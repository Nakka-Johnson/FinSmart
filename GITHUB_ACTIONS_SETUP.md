# GitHub Actions CI/CD Setup Guide

## Overview

Two workflows are configured:
1. **CI (Continuous Integration)** - Build and test on every push/PR
2. **Deploy** - Build Docker images and deploy to EC2 on tags or manual trigger

## Required GitHub Secrets

Navigate to your repository **Settings → Secrets and variables → Actions** and add the following secrets:

### Docker Hub Credentials

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `myusername` |
| `DOCKERHUB_TOKEN` | Docker Hub access token | `dckr_pat_xxxxxxxxxxxxx` |

**How to create Docker Hub token:**
1. Log in to [Docker Hub](https://hub.docker.com)
2. Go to Account Settings → Security → New Access Token
3. Name: `GitHub Actions`
4. Permissions: Read, Write, Delete
5. Copy the token (you won't see it again!)

### EC2 Deployment Credentials

| Secret Name | Description | Example |
|------------|-------------|---------|
| `PROD_SSH_HOST` | EC2 public hostname or IP | `ec2-1-2-3-4.eu-west-2.compute.amazonaws.com` |
| `PROD_SSH_USER` | SSH username | `ubuntu` (for Ubuntu AMI) or `ec2-user` (for Amazon Linux) |
| `PROD_SSH_KEY` | Private SSH key | Contents of your `~/.ssh/id_rsa` file |
| `PROD_SSH_PORT` | SSH port (optional) | `22` (default) |
| `PROD_DOMAIN` | Your production domain (optional) | `finsmart.example.com` |

**How to get SSH key:**
```bash
# If you don't have an SSH key pair, create one:
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/finsmart_deploy

# Copy the PRIVATE key contents (entire file including BEGIN/END lines):
cat ~/.ssh/finsmart_deploy

# Add the PUBLIC key to EC2 instance:
# Method 1: Add to ~/.ssh/authorized_keys on EC2
# Method 2: Add via AWS EC2 console (Key Pairs)
cat ~/.ssh/finsmart_deploy.pub
```

### Production Environment File

| Secret Name | Description |
|------------|-------------|
| `PROD_ENV_FILE` | Complete contents of `.env.production` file |

**Example `.env.production` contents:**
```env
# Database
DB_URL=jdbc:postgresql://your-rds.region.rds.amazonaws.com:5432/finsmartdb?sslmode=require
DB_USER=finsmart
DB_PASSWORD=your-strong-password

# JWT
APP_JWT_SECRET=your-32-char-random-secret
APP_JWT_ISSUER=finsmart
APP_JWT_EXPIRES_MINUTES=60

# Application
APP_FRONTEND_URL=https://finsmart.example.com
DOMAIN=finsmart.example.com
APP_PORT=8080

# JVM
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC

# Caddy
CADDY_EMAIL=admin@finsmart.example.com
```

**How to add:**
1. Copy the entire contents of your `.env.production` file
2. In GitHub Secrets, create new secret named `PROD_ENV_FILE`
3. Paste the entire file contents
4. Save

## EC2 Instance Setup

### Prerequisites

Your EC2 instance must have:
1. ✅ Docker installed
2. ✅ Docker Compose installed
3. ✅ Port 22 (SSH) open for GitHub Actions IP
4. ✅ Port 80 (HTTP) open
5. ✅ Port 443 (HTTPS) open

### Quick Setup Script

SSH into your EC2 instance and run:

```bash
#!/bin/bash
# Install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker compose version

echo "✅ Docker setup complete!"
echo "⚠️  Log out and back in for group changes to take effect"
```

### Add SSH Key to EC2

```bash
# On your EC2 instance
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key to authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Test SSH connection from your local machine
ssh -i ~/.ssh/finsmart_deploy ubuntu@your-ec2-host
```

## Workflow Triggers

### CI Workflow (ci.yml)

**Runs automatically on:**
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main` branch

**What it does:**
1. ✅ Backend: Maven tests
2. ✅ Frontend: Build and lint
3. ✅ AI: Flake8/Pyflakes linting
4. ✅ Artifacts uploaded (7 days retention)

### Deploy Workflow (deploy.yml)

**Runs on:**
- Push tags matching `v*.*.*` pattern (e.g., `v1.0.0`)
- Manual workflow dispatch

**What it does:**
1. 🐳 Build Docker images (backend, frontend, ai)
2. 📤 Push images to Docker Hub with tags: `latest`, `vX.Y.Z`, `<sha>`
3. 🚀 Deploy to EC2 via SSH:
   - Upload docker-compose.prod.yml and Caddyfile
   - Write .env.production
   - Pull latest images
   - Start services
   - Run health checks
4. 🧹 Cleanup old images

## Usage Examples

### Trigger CI (Automatic)

```bash
# Push to main branch
git add .
git commit -m "feat: add new feature"
git push origin main

# Or create a pull request
gh pr create --base main --head feature/my-feature
```

### Deploy via Git Tag

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# The deploy workflow will trigger automatically
```

### Deploy Manually

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Choose environment (production/staging)
6. Click **Run workflow**

## Monitoring Deployment

### View Workflow Logs

1. Go to **Actions** tab
2. Click on the running workflow
3. Expand job steps to see detailed logs

### Check Deployment Status

After deployment completes, check the **Summary** tab for:
- ✅ Service health status
- 🐳 Docker image tags
- 🔗 Public endpoint URL
- 📊 Service status

### SSH to EC2 for Troubleshooting

```bash
# SSH to your EC2 instance
ssh -i ~/.ssh/finsmart_deploy ubuntu@your-ec2-host

# Check service status
cd /opt/finsmart
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:8080/api/health
curl http://localhost:80/health
curl http://localhost:8001/health
```

## Rollback Procedure

### Option 1: Deploy Previous Tag

```bash
# Create a new tag from previous commit
git tag v1.0.1 <previous-commit-hash>
git push origin v1.0.1
```

### Option 2: Manual Rollback on EC2

```bash
# SSH to EC2
ssh -i ~/.ssh/finsmart_deploy ubuntu@your-ec2-host

# Go to deployment directory
cd /opt/finsmart

# Pull specific image version
docker pull finsmart/backend:v1.0.0
docker pull finsmart/frontend:v1.0.0
docker pull finsmart/ai:v1.0.0

# Update docker-compose.prod.yml to use specific tags
# Then restart services
docker compose -f docker-compose.prod.yml up -d
```

## Security Best Practices

### Protect Secrets

- ✅ **Never** commit secrets to repository
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate SSH keys regularly
- ✅ Use Docker Hub access tokens (not password)
- ✅ Limit SSH key permissions (read-only where possible)

### EC2 Security Group Rules

```yaml
Inbound Rules:
  - Type: SSH (22)
    Source: Your IP / GitHub Actions IP ranges
  
  - Type: HTTP (80)
    Source: 0.0.0.0/0 (public)
  
  - Type: HTTPS (443)
    Source: 0.0.0.0/0 (public)

Outbound Rules:
  - Type: All traffic
    Destination: 0.0.0.0/0
```

### GitHub Actions Security

```yaml
# Use environment protection rules
Settings → Environments → production
  - Required reviewers: Add team members
  - Wait timer: 5 minutes
  - Deployment branches: Only main
```

## Troubleshooting

### Docker Hub Authentication Fails

**Error:** `unauthorized: authentication required`

**Solution:**
1. Verify `DOCKERHUB_USERNAME` is correct
2. Regenerate `DOCKERHUB_TOKEN` in Docker Hub
3. Update secret in GitHub

### SSH Connection Fails

**Error:** `Permission denied (publickey)`

**Solution:**
1. Verify SSH key is correct (include BEGIN/END lines)
2. Check public key is in EC2 `~/.ssh/authorized_keys`
3. Verify security group allows SSH from GitHub Actions IPs
4. Check SSH port is correct (default: 22)

### Health Check Fails

**Error:** `Backend API health check failed`

**Solution:**
```bash
# SSH to EC2 and check logs
docker compose -f docker-compose.prod.yml logs backend

# Check if service is running
docker compose -f docker-compose.prod.yml ps

# Check backend health directly
curl http://localhost:8080/api/health

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### TLS Certificate Not Provisioning

**Error:** Public endpoint health check fails with TLS error

**Solution:**
1. Wait 5-10 minutes for Let's Encrypt provisioning
2. Check DNS is pointing to EC2 public IP
3. Verify ports 80 and 443 are open
4. Check Caddy logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs caddy | grep -i certificate
   ```

## GitHub Actions IP Ranges

If you need to whitelist GitHub Actions IPs in your EC2 security group:

```bash
# Get current GitHub Actions IP ranges
curl https://api.github.com/meta | jq -r '.actions[]'

# Or allow GitHub's entire IP range (less secure)
# See: https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses
```

## Cost Optimization

### Reduce Build Time

- ✅ Docker layer caching enabled
- ✅ Maven dependency caching
- ✅ npm dependency caching

### Reduce Storage

```yaml
# Clean up old images weekly
# Add to deploy.yml:
- name: Prune old images
  run: docker image prune -af --filter "until=168h"
```

### Limit Concurrent Deployments

```yaml
# Add to deploy.yml job:
concurrency:
  group: production-deploy
  cancel-in-progress: false
```

## Next Steps

1. ✅ Add all required secrets to GitHub
2. ✅ Set up EC2 instance with Docker
3. ✅ Test SSH connection
4. ✅ Create first deployment tag
5. ✅ Monitor deployment in Actions tab
6. ✅ Verify services are running
7. ✅ Set up monitoring/alerting
8. ✅ Configure environment protection rules

---

**Need Help?**
- GitHub Actions Docs: https://docs.github.com/en/actions
- Docker Hub: https://hub.docker.com
- AWS EC2: https://aws.amazon.com/ec2

**Last Updated:** 2025-11-06  
**Status:** Ready for Production ✅
