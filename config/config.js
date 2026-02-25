import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Kafka Configuration
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'microservice',
  },
  
  // Service Ports
  ports: {
    payment: process.env.PAYMENT_SERVICE_PORT || 8000,
    order: process.env.ORDER_SERVICE_PORT || 8001,
    email: process.env.EMAIL_SERVICE_PORT || 8002,
    analytic: process.env.ANALYTIC_SERVICE_PORT || 8003,
    frontend: process.env.FRONTEND_PORT || 3000,
  },
  
  // CORS Configuration
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars',
  },
  
  // External Services
  services: {
    emailApiKey: process.env.EMAIL_SERVICE_API_KEY,
    paymentGatewayApiKey: process.env.PAYMENT_GATEWAY_API_KEY,
  },
  
  // Database (for future use)
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // Redis (for future use)
  redis: {
    url: process.env.REDIS_URL,
  },
  
  // Monitoring
  monitoring: {
    prometheusPort: process.env.PROMETHEUS_PORT || 9090,
    grafanaPort: process.env.GRAFANA_PORT || 3001,
  },
};

// Validation
function validateConfig() {
  const required = ['KAFKA_BROKERS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

if (config.NODE_ENV === 'production') {
  validateConfig();
}

export default config;
