import logger, { logError } from './logger.js';

// Custom error classes
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class KafkaError extends Error {
  constructor(message, topic = null, key = null) {
    super(message);
    this.name = 'KafkaError';
    this.statusCode = 500;
    this.topic = topic;
    this.key = key;
  }
}

export class DatabaseError extends Error {
  constructor(message, query = null) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.query = query;
  }
}

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  // Log the error
  logError('Unhandled Error', err, {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      name: err.name || 'InternalServerError',
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: {
          field: err.field,
          topic: err.topic,
          key: err.key,
          query: err.query
        }
      })
    },
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Kafka error handler
export const handleKafkaError = (error, context = {}) => {
  logError('Kafka Error', error, {
    context,
    timestamp: new Date().toISOString()
  });
  
  // Implement retry logic or dead letter queue here
  if (error.name === 'KafkaJSBrokerNotFound') {
    // Handle broker not found
    throw new KafkaError('Kafka broker not available', context.topic, context.key);
  }
  
  if (error.name === 'KafkaJSConnectionError') {
    // Handle connection error
    throw new KafkaError('Failed to connect to Kafka', context.topic, context.key);
  }
  
  throw new KafkaError(error.message, context.topic, context.key);
};

// Circuit breaker pattern for external services
export class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit breaker for ${this.serviceName} is HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker for ${this.serviceName} is OPEN`);
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        logger.info(`Circuit breaker for ${this.serviceName} is CLOSED`);
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        logger.warn(`Circuit breaker for ${this.serviceName} is OPEN`);
      }
      
      throw error;
    }
  }
}

// Rate limiting
export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    requests.set(key, validRequests);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          name: 'RateLimitExceeded',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
    
    validRequests.push(now);
    next();
  };
};
