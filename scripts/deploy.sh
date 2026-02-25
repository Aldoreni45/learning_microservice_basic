#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"ghcr.io/your-username"}
PROJECT_NAME=${PROJECT_NAME:-"microservices"}

echo -e "${GREEN}Deploying to $ENVIRONMENT environment...${NC}"

# Function to check if service is healthy
check_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Checking health of $service_name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:$port/health > /dev/null 2>&1; then
            echo -e "${GREEN}$service_name is healthy!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts: $service_name not ready yet...${NC}"
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}$service_name failed to become healthy after $max_attempts attempts${NC}"
    return 1
}

# Function to deploy service
deploy_service() {
    local service_name=$1
    local port=$2
    
    echo -e "${GREEN}Deploying $service_name...${NC}"
    
    # Stop existing container
    docker stop $service_name 2>/dev/null || true
    docker rm $service_name 2>/dev/null || true
    
    # Pull latest image
    docker pull $DOCKER_REGISTRY/$PROJECT_NAME/$service_name:latest
    
    # Run new container
    docker run -d \
        --name $service_name \
        --restart unless-stopped \
        -p $port:$port \
        --env-file .env.$ENVIRONMENT \
        --network microservices-network \
        $DOCKER_REGISTRY/$PROJECT_NAME/$service_name:latest
    
    # Check health
    check_health $service_name $port
}

# Create network if it doesn't exist
docker network create microservices-network 2>/dev/null || true

# Deploy services in order
deploy_service "kafka" "9092"
deploy_service "payment-service" "8000"
deploy_service "order-service" "8001"
deploy_service "email-service" "8002"
deploy_service "analytic-service" "8003"
deploy_service "frontend" "3000"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Services are running at:${NC}"
echo -e "${YELLOW}- Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}- Payment Service: http://localhost:8000${NC}"
echo -e "${YELLOW}- Order Service: http://localhost:8001${NC}"
echo -e "${YELLOW}- Email Service: http://localhost:8002${NC}"
echo -e "${YELLOW}- Analytic Service: http://localhost:8003${NC}"
