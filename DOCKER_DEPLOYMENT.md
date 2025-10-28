# Docker Deployment Guide for AlertNAV

## Prerequisites
- Docker installed on your system
- Docker Compose (usually comes with Docker Desktop)
- Your `.env.local` file with database credentials

## Files Created
- `Dockerfile` - Multi-stage Docker build configuration
- `.dockerignore` - Files to exclude from Docker build
- `docker-compose.yml` - Docker Compose configuration
- `next.config.ts` - Updated with standalone output

## Deployment Methods

### Method 1: Using Docker Compose (Recommended)

1. **Make sure your `.env.local` file is present** with your database credentials:
   ```bash
   POSTGRES_HOST=your-aurora-endpoint.rds.amazonaws.com
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your-password
   POSTGRES_DATABASE=postgres
   POSTGRES_PORT=5432
   ```

2. **Build and start the container**:
   ```bash
   docker-compose up --build
   ```

3. **Run in detached mode** (background):
   ```bash
   docker-compose up -d --build
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f
   ```

5. **Stop the container**:
   ```bash
   docker-compose down
   ```

### Method 2: Using Docker Directly

1. **Build the Docker image**:
   ```bash
   docker build -t alertnav:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 \
     -e POSTGRES_HOST=your-host \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=your-password \
     -e POSTGRES_DATABASE=postgres \
     -e POSTGRES_PORT=5432 \
     --name alertnav \
     alertnav:latest
   ```

3. **Or use env file**:
   ```bash
   docker run -p 3000:3000 \
     --env-file .env.local \
     --name alertnav \
     alertnav:latest
   ```

## Access Your Application

Once running, access your app at:
- **Local**: http://localhost:3000
- **Network**: http://your-server-ip:3000

## Production Deployment Options

### Option 1: AWS ECS (Elastic Container Service)

1. **Push to ECR (Elastic Container Registry)**:
   ```bash
   # Authenticate Docker to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

   # Tag your image
   docker tag alertnav:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/alertnav:latest

   # Push to ECR
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/alertnav:latest
   ```

2. **Create ECS Task Definition** with:
   - Container image from ECR
   - Environment variables for database
   - Port mapping 3000:3000

3. **Deploy to ECS Fargate** or ECS EC2

### Option 2: AWS Lightsail Containers

1. **Push to Lightsail**:
   ```bash
   aws lightsail push-container-image \
     --service-name alertnav-service \
     --label alertnav \
     --image alertnav:latest
   ```

2. **Create container service** through AWS Console or CLI

### Option 3: Digital Ocean App Platform

1. **Connect your GitHub repository**
2. **Select Dockerfile deployment**
3. **Add environment variables**
4. **Deploy**

### Option 4: Railway/Render/Fly.io

All support Docker deployments:
1. Connect your repository
2. They auto-detect Dockerfile
3. Add environment variables
4. Deploy

### Option 5: Your Own VPS (Ubuntu/Debian)

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. **Clone your repository**:
   ```bash
   git clone https://github.com/AndrewLiii/AlertNAV.git
   cd AlertNAV
   git checkout andrew/dev
   ```

4. **Create `.env.local`** file with your credentials

5. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

6. **Setup Nginx reverse proxy** (optional but recommended):
   ```bash
   sudo apt install nginx
   ```

   Create `/etc/nginx/sites-available/alertnav`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/alertnav /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt** (recommended):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Useful Docker Commands

**View running containers**:
```bash
docker ps
```

**View all containers**:
```bash
docker ps -a
```

**Stop container**:
```bash
docker stop alertnav
```

**Start container**:
```bash
docker start alertnav
```

**Remove container**:
```bash
docker rm alertnav
```

**View logs**:
```bash
docker logs alertnav
docker logs -f alertnav  # Follow logs
```

**Access container shell**:
```bash
docker exec -it alertnav sh
```

**Rebuild without cache**:
```bash
docker-compose build --no-cache
```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs`
- Verify environment variables are set correctly
- Ensure port 3000 is not already in use

### Can't connect to database
- Verify Aurora security group allows connections from your container
- Check if Aurora is publicly accessible (or use VPC)
- Verify database credentials in `.env.local`

### Build fails
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility
- Try building without cache: `docker-compose build --no-cache`

### Image is too large
- The multi-stage build already optimizes size
- Current setup should produce ~200-300MB image

## Performance Tips

1. **Use build cache** for faster rebuilds
2. **Limit memory** if needed:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

3. **Add health checks** in docker-compose.yml:
   ```yaml
   healthcheck:
     test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

## Security Recommendations

1. **Don't commit `.env.local`** (already in .gitignore)
2. **Use secrets management** in production (AWS Secrets Manager, etc.)
3. **Keep Docker images updated**: `docker-compose pull && docker-compose up -d`
4. **Run as non-root user** (already configured in Dockerfile)
5. **Use HTTPS** in production (with Nginx + Let's Encrypt)

## Next Steps

1. Test locally with Docker Compose
2. Choose a deployment platform
3. Set up CI/CD (GitHub Actions, etc.)
4. Configure domain and SSL
5. Set up monitoring and logging
