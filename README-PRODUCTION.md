# Production Deployment Guide

## Quick Start

```bash
# 1. Setup environment
cp .env.example .env.production
# Edit .env.production with your values

# 2. Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d

# 3. Or use deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh production
```

## Architecture

- **Frontend**: Next.js (Port 3000)
- **Payment Service**: Node.js (Port 8000)
- **Order Service**: Node.js (Port 8001)
- **Email Service**: Node.js (Port 8002)
- **Analytic Service**: Node.js (Port 8003)
- **Kafka**: 3 brokers (Ports 9092-9094)
- **Monitoring**: Prometheus (9090), Grafana (3001)

## Environment Variables

Required variables in `.env.production`:
- `KAFKA_BROKERS` - Kafka broker addresses
- `NODE_ENV=production`
- `JWT_SECRET` - Security secret
- Service ports and API keys

## Monitoring

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kafka UI**: http://localhost:8080

## Health Checks

All services expose `/health` endpoint:
```bash
curl http://localhost:8000/health
```

## Logs

Logs stored in `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs

## CI/CD

GitHub Actions pipeline:
1. Tests on push/PR
2. Security scanning
3. Build & push Docker images
4. Deploy to staging/production

## Scaling

- Add more Kafka brokers in `docker-compose.prod.yml`
- Use Kubernetes for orchestration
- Implement load balancer for services

## Security

- Environment variables for secrets
- CORS configuration
- Rate limiting
- Input validation
- Security scanning in CI/CD

## Troubleshooting

1. Check service logs: `docker logs <service-name>`
2. Verify Kafka connectivity
3. Check health endpoints
4. Monitor Grafana dashboards
