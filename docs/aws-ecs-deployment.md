# AWS ECS Deployment — Sorterra Frontend

Deploy the Sorterra frontend as a Fargate service behind the existing Network Load Balancer. The frontend is a static React SPA served by nginx. It shares the same ECS cluster, VPC, and NLB as the API.

## Architecture

```
                              NLB (sorterra-nlb)
                         35.175.101.240 / 3.230.81.125
                           ┌──────────┴──────────┐
                           │                      │
                        :80 (API)             :3000 (Frontend)
                           │                      │
                           ▼                      ▼
                  ┌─────────────────┐    ┌─────────────────┐
                  │  ECS Fargate    │    │  ECS Fargate    │
                  │  sorterra-api   │    │  sorterra-fe    │
                  │  .NET :8080     │    │  nginx :80      │
                  │  sg-api         │    │  sg-api         │
                  └─────────────────┘    └─────────────────┘
```

The frontend runs on the same NLB using port **3000** externally, forwarding to the nginx container on port **80**. It reuses the API security group (`sg-api`) since it only needs outbound internet access (for ECR image pulls) and inbound from the NLB.

> **Security group note:** The `sg-api` security group must allow inbound TCP on port **80** (for the nginx container) in addition to port 8080 (for the API). This rule was added during initial deployment:
> ```bash
> aws ec2 authorize-security-group-ingress \
>   --group-id sg-0d557c9256b77a88b \
>   --protocol tcp --port 80 --cidr 0.0.0.0/0 \
>   --region us-east-1
> ```

## Prerequisites

- AWS CLI installed and authenticated (`aws sts get-caller-identity`)
- Docker running locally
- The ECR repository `sorterra-frontend` exists (created during initial setup)
- The ECS cluster `sorterra` is running

Set environment variables used throughout this guide:

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
export ECR_BASE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

## 1. Authenticate Docker to ECR

```bash
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_BASE
```

## 2. Build and Push the Image

Vite bakes `VITE_*` environment variables into the JavaScript bundle at build time. You must pass the correct values for the target environment via `--build-arg`. A separate image must be built for each environment.

```bash
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://35.175.101.240 \
  --build-arg VITE_COGNITO_REGION=us-east-1 \
  --build-arg VITE_COGNITO_USER_POOL_ID=us-east-1_d63e7X9x7 \
  --build-arg VITE_COGNITO_APP_CLIENT_ID=1ccr4hrojdp2kt96qohc2a05s5 \
  -t sorterra-frontend .

docker tag sorterra-frontend:latest $ECR_BASE/sorterra-frontend:latest
docker push $ECR_BASE/sorterra-frontend:latest
```

> **Note:** When a custom domain is configured, update `VITE_API_BASE_URL` to the domain-based API URL (e.g., `https://api.sorterra.com`).

## 3. Create a CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/sorterra-frontend \
  --region $AWS_REGION
```

## 4. Register the Task Definition

```bash
cat > /tmp/sorterra-frontend-task.json << 'EOF'
{
  "family": "sorterra-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/sorterra-ecs-execution-role",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/sorterra-ecs-task-role",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sorterra-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -q -O /dev/null http://localhost/ || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 5
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sorterra-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
EOF

# Replace placeholder account ID
sed -i '' "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g" /tmp/sorterra-frontend-task.json

aws ecs register-task-definition \
  --cli-input-json file:///tmp/sorterra-frontend-task.json \
  --region $AWS_REGION
```

## 5. Create a Target Group for the Frontend

```bash
export VPC_ID=vpc-0d3a8af5cb4da7000

aws elbv2 create-target-group \
  --name sorterra-frontend-nlb-tg \
  --protocol TCP \
  --port 80 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region $AWS_REGION
```

Save the target group ARN:

```bash
export FRONTEND_TG_ARN=$(aws elbv2 describe-target-groups \
  --names sorterra-frontend-nlb-tg \
  --query "TargetGroups[0].TargetGroupArn" --output text \
  --region $AWS_REGION)
```

## 6. Add an NLB Listener on Port 3000

The existing NLB listener on port 80 routes to the API. Add a second listener on port 3000 for the frontend:

```bash
export NLB_ARN=$(aws elbv2 describe-load-balancers \
  --names sorterra-nlb \
  --query "LoadBalancers[0].LoadBalancerArn" --output text \
  --region $AWS_REGION)

aws elbv2 create-listener \
  --load-balancer-arn $NLB_ARN \
  --protocol TCP \
  --port 3000 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG_ARN \
  --region $AWS_REGION
```

## 7. Deploy the Frontend Service

```bash
export API_SG=sg-0d557c9256b77a88b
export PRIVATE_SUBNET_1A=subnet-0c494af6d467e6dbb
export PRIVATE_SUBNET_1B=subnet-05254ca568d47c8ea

aws ecs create-service \
  --cluster sorterra \
  --service-name sorterra-frontend \
  --task-definition sorterra-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET_1A,$PRIVATE_SUBNET_1B],securityGroups=[$API_SG],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=$FRONTEND_TG_ARN,containerName=frontend,containerPort=80" \
  --enable-execute-command \
  --region $AWS_REGION
```

### Wait for Stability

```bash
aws ecs wait services-stable \
  --cluster sorterra \
  --services sorterra-frontend \
  --region $AWS_REGION

echo "Frontend deployment complete"
```

This blocks until the task is running and healthy (typically 1–2 minutes).

## 8. Verify the Deployment

```bash
# Health check (should return the HTML page)
curl -s -o /dev/null -w "%{http_code}" http://35.175.101.240:3000/
# Expected: 200

# Verify SPA routing works (any path should return index.html)
curl -s -o /dev/null -w "%{http_code}" http://35.175.101.240:3000/login
# Expected: 200
```

Open in a browser: **http://35.175.101.240:3000**

## 9. View Logs

```bash
aws logs tail /ecs/sorterra-frontend --since 30m --follow --region $AWS_REGION
```

---

## Update & Redeployment

After making code changes, rebuild, push, and force a new deployment:

```bash
# 1. Authenticate (if session expired)
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_BASE

# 2. Build and push
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://35.175.101.240 \
  --build-arg VITE_COGNITO_REGION=us-east-1 \
  --build-arg VITE_COGNITO_USER_POOL_ID=us-east-1_d63e7X9x7 \
  --build-arg VITE_COGNITO_APP_CLIENT_ID=1ccr4hrojdp2kt96qohc2a05s5 \
  -t sorterra-frontend .

docker tag sorterra-frontend:latest $ECR_BASE/sorterra-frontend:latest
docker push $ECR_BASE/sorterra-frontend:latest

# 3. Force new deployment
aws ecs update-service \
  --cluster sorterra \
  --service sorterra-frontend \
  --force-new-deployment \
  --region $AWS_REGION

# 4. Wait for stability
aws ecs wait services-stable \
  --cluster sorterra \
  --services sorterra-frontend \
  --region $AWS_REGION

echo "Frontend redeployment complete"
```

## Rollback

ECS performs rolling deployments — if the new task fails health checks, the old task stays running. To manually roll back:

```bash
# Check deployment status
aws ecs describe-services \
  --cluster sorterra \
  --services sorterra-frontend \
  --query "services[0].deployments[*].{status:status,running:runningCount,desired:desiredCount,rollout:rolloutState}" \
  --output table --region $AWS_REGION

# Rebuild from a known good commit
git checkout <good-commit>
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=http://35.175.101.240 \
  --build-arg VITE_COGNITO_REGION=us-east-1 \
  --build-arg VITE_COGNITO_USER_POOL_ID=us-east-1_d63e7X9x7 \
  --build-arg VITE_COGNITO_APP_CLIENT_ID=1ccr4hrojdp2kt96qohc2a05s5 \
  -t sorterra-frontend .

docker tag sorterra-frontend:latest $ECR_BASE/sorterra-frontend:latest
docker push $ECR_BASE/sorterra-frontend:latest

aws ecs update-service \
  --cluster sorterra \
  --service sorterra-frontend \
  --force-new-deployment \
  --region $AWS_REGION
```

## Cost Impact

| Resource | Spec | Est. Cost/Month |
|----------|------|-----------------|
| Fargate — Frontend | 0.25 vCPU, 512 MB | ~$9 |
| NLB listener (port 3000) | Included in NLB base | ~$0 |
| CloudWatch Logs | Minimal (nginx access logs only) | ~$0.50 |
| **Added cost** | | **~$9.50/month** |

Total infrastructure cost with frontend: **~$87–90/month** (up from ~$77–80).

## Infrastructure Reference

| Resource | Value |
|----------|-------|
| ECS Cluster | `sorterra` |
| Service Name | `sorterra-frontend` |
| Task Definition | `sorterra-frontend` |
| ECR Repository | `896170900648.dkr.ecr.us-east-1.amazonaws.com/sorterra-frontend` |
| NLB Port | 3000 (TCP) |
| Target Group | `sorterra-frontend-nlb-tg` (IP, port 80) |
| Security Group | `sg-0d557c9256b77a88b` (sg-api) |
| Subnets | Private 1a, Private 1b |
| Log Group | `/ecs/sorterra-frontend` |
| Container Port | 80 (nginx) |
| CPU / Memory | 0.25 vCPU / 512 MB |
| Health Check | `GET /` (HTTP, 30s interval) |
| Access URL | `http://35.175.101.240:3000` |
