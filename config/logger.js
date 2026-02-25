import winston from 'winston';
import { config } from './config.js';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: process.env.SERVICE_NAME || 'microservice' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console with a simple format
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Production: Add external logging service
if (config.NODE_ENV === 'production') {
  // Add external logging service like ELK stack, Loggly, etc.
  // Example for HTTP transport:
  // logger.add(new winston.transports.Http({
  //   host: 'log-server.example.com',
  //   port: 8080,
  //   path: '/logs'
  // }));
}

export default logger;

// Helper functions for structured logging
export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

export const logError = (message, error = null, meta = {}) => {
  const errorMeta = {
    ...meta,
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    })
  };
  logger.error(message, errorMeta);
};

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

// Kafka specific logging
export const logKafkaEvent = (event, topic, key = null, meta = {}) => {
  logInfo('Kafka Event', {
    event,
    topic,
    key,
    ...meta
  });
};

// HTTP request logging middleware
export const httpRequestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logInfo('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });
  });
  
  next();
};
