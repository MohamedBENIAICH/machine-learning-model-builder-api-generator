# Deployment Guide

## 🚀 Deployment Options

This guide covers deploying the ML Model Builder Backend in different environments.

## 1️⃣ Development Deployment

### Local Machine

```bash
cd back-end
python app.py
```

**Access**: `http://localhost:5000`

## 2️⃣ Production Deployment with Gunicorn

### Installation

```bash
pip install gunicorn
```

### Running

```bash
# Basic
gunicorn -b 0.0.0.0:5000 app:app

# With multiple workers
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# With timeout and graceful shutdown
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --graceful-timeout 30 app:app

# With logging
gunicorn -w 4 -b 0.0.0.0:5000 \
  --access-logfile - \
  --error-logfile - \
  --log-level info app:app
```

## 3️⃣ Nginx Reverse Proxy Setup

### Installation

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# macOS
brew install nginx
```

### Configuration

Create `/etc/nginx/sites-available/ml-backend`:

```nginx
upstream ml_backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}

server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 100M;

    location / {
        proxy_pass http://ml_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/ml-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4️⃣ Systemd Service

Create `/etc/systemd/system/ml-backend.service`:

```ini
[Unit]
Description=ML Model Builder Backend
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/back-end
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable ml-backend
sudo systemctl start ml-backend
sudo systemctl status ml-backend
```

## 5️⃣ Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create models directory
RUN mkdir -p models

# Expose port
EXPOSE 5000

# Run Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "120", "app:app"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  backend:
    build: ./back-end
    environment:
      DB_HOST: mysql
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      FLASK_DEBUG: "False"
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - "5000:5000"
    volumes:
      - ./back-end/models:/app/models
    restart: unless-stopped

volumes:
  mysql_data:
```

### Build and Run

```bash
docker-compose up -d
```

## 6️⃣ AWS EC2 Deployment

### Instance Setup

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Python and dependencies
sudo yum install -y python3 python3-pip mysql
sudo pip3 install -r /path/to/requirements.txt

# Install Gunicorn
sudo pip3 install gunicorn
```

### MySQL RDS Setup

1. Create RDS MySQL instance
2. Create security group allowing access from EC2
3. Create database and user
4. Update `.env` with RDS endpoint

### Systemd Service

Same as section 4️⃣ above.

## 7️⃣ Heroku Deployment

### Procfile

```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

### requirements.txt

Already configured.

### Deploy

```bash
heroku login
heroku create ml-model-builder
heroku config:set DB_HOST=your-rds-endpoint
heroku config:set DB_USER=admin
heroku config:set DB_PASSWORD=your-password
git push heroku main
```

## 8️⃣ Azure App Service

### Create App Service

```bash
az appservice plan create \
  --name ml-backend-plan \
  --resource-group myResourceGroup \
  --sku B1 \
  --is-linux

az webapp create \
  --resource-group myResourceGroup \
  --plan ml-backend-plan \
  --name ml-backend \
  --runtime "PYTHON|3.9"
```

### Deploy

```bash
az webapp deployment source config-zip \
  --resource-group myResourceGroup \
  --name ml-backend \
  --src app.zip
```

## 9️⃣ DigitalOcean App Platform

1. Connect GitHub repository
2. Create new app
3. Set environment variables
4. Configure MySQL database
5. Deploy

## 🔟 GCP Cloud Run

### Build Image

```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/ml-backend
```

### Deploy

```bash
gcloud run deploy ml-backend \
  --image gcr.io/PROJECT-ID/ml-backend \
  --platform managed \
  --region us-central1
```

## SSL/TLS Configuration

### Let's Encrypt (Free)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
sudo certbot renew --dry-run
```

### Nginx SSL

Update Nginx config:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring & Logging

### Application Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check MySQL
mysql -u root -p -e "SHOW PROCESSLIST;"

# Monitor logs
tail -f /var/log/syslog
```

### APM Tools

- **New Relic**: `pip install newrelic`
- **DataDog**: `pip install datadog`
- **Sentry**: `pip install sentry-sdk`

## Backup Strategy

### Database Backup

```bash
# Manual backup
mysqldump -u user -p database > backup.sql

# Automated daily backup (cron)
0 2 * * * mysqldump -u user -p database > /backups/db-$(date +\%Y\%m\%d).sql
```

### Model Files Backup

```bash
# Backup models directory
tar -czf models-backup-$(date +%Y%m%d).tar.gz models/

# Sync to S3
aws s3 sync models/ s3://your-bucket/models/
```

## Performance Optimization

### Database Connection Pooling

Update `database.py`:

```python
from mysql.connector import pooling

connection_pool = pooling.MySQLConnectionPool(
    pool_name="ml_pool",
    pool_size=32,
    host=config.DB_HOST,
    user=config.DB_USER,
    password=config.DB_PASSWORD,
    database=config.DB_NAME
)
```

### Caching Layer (Redis)

```bash
pip install flask-caching
```

### Load Balancing

- Use multiple Gunicorn workers
- Deploy behind Nginx or HAProxy
- Use sticky sessions if needed

## Security Best Practices

✅ **Must Do**:
- [ ] Change default SECRET_KEY
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL
- [ ] Set environment variables (no hardcoding)
- [ ] Implement rate limiting
- [ ] Add authentication
- [ ] Validate all inputs
- [ ] Use security headers

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## Troubleshooting Deployment

### Issue: Connection timeout
**Solution**: Check firewall rules, security groups

### Issue: 502 Bad Gateway
**Solution**: Check Gunicorn process, view error logs

### Issue: Database connection fails
**Solution**: Verify RDS endpoint, security group, credentials

### Issue: Out of memory
**Solution**: Reduce Gunicorn workers, increase instance size

## Health Check

```bash
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-27T10:30:00.000000"
}
```

## Rollback Procedure

```bash
# Identify previous version
git log --oneline

# Checkout previous version
git checkout <commit-hash>

# Redeploy
git push heroku main  # or appropriate deploy command
```

## Documentation

- Keep documentation updated with deployment details
- Document database schema changes
- Record environment-specific configurations
- Maintain runbooks for common issues

---

**Deployment Checklist**:
- [ ] MySQL database configured
- [ ] Environment variables set
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Backup system in place
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Health check verified
- [ ] Load testing completed
- [ ] Security audit passed

