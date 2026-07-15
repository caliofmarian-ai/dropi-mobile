# DROPi Deployment Guide

Complete guide for deploying DROPi platform across all components.

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- npm or yarn
- Git
- SSL certificates (for production)

## Quick Start with Docker

### 1. Clone Repository

```bash
git clone https://github.com/dropi/dropi-platform.git
cd dropi-platform
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start All Services

```bash
docker-compose up -d
```

### 4. Initialize Database

```bash
docker-compose exec backend npm run db:push
docker-compose exec backend npm run seed
```

### 5. Access Services

- **Website**: http://localhost:3002
- **Admin Dashboard**: http://localhost:3003
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

## Manual Deployment

### Backend Setup

```bash
cd 11_BACKEND
npm install
npm run build
npm start
```

### Website Setup

```bash
cd 06_WEBSITE/react
npm install
npm run build
npm run preview
```

### Admin Dashboard Setup

```bash
cd 07_ADMIN_DASHBOARD
npm install
npm run build
npm run preview
```

### Mobile App Deployment

#### Android

```bash
cd 05_MOBILE_APP/react-native
npm install
npm run build:android
# Upload APK to Google Play Store
```

#### iOS

```bash
cd 05_MOBILE_APP/react-native
npm install
npm run build:ios
# Upload to App Store Connect
```

## Production Deployment

### AWS EC2

```bash
# 1. Launch EC2 instance
# 2. Install Docker & Docker Compose
# 3. Clone repository
# 4. Configure environment
# 5. Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Heroku

```bash
# 1. Create Heroku app
heroku create dropi-app

# 2. Deploy
git push heroku main

# 3. Configure environment
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
```

### DigitalOcean

```bash
# 1. Create droplet
# 2. Install Docker
# 3. Deploy using Docker Compose
docker-compose up -d
```

## Database Migration

### TiDB Cloud (Recommended)

```bash
# 1. Create TiDB cluster
# 2. Update DATABASE_URL in .env
# 3. Run migrations
npm run db:push
```

### MySQL

```bash
# 1. Install MySQL
# 2. Create database
mysql -u root -p
CREATE DATABASE dropi;

# 3. Update DATABASE_URL
DATABASE_URL=mysql://user:password@localhost:3306/dropi

# 4. Run migrations
npm run db:push
```

## Monitoring & Logging

### Docker Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
```

### Application Monitoring

- Set up Datadog or New Relic
- Configure error tracking (Sentry)
- Set up performance monitoring

## Backup & Recovery

### Database Backup

```bash
# Backup MySQL
mysqldump -u root -p dropi > backup.sql

# Restore
mysql -u root -p dropi < backup.sql
```

### Docker Volume Backup

```bash
# Backup volumes
docker run --rm -v dropi_mysql_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mysql_backup.tar.gz -C /data .
```

## SSL/TLS Configuration

### Let's Encrypt

```bash
# 1. Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. Generate certificate
sudo certbot certonly --nginx -d yourdomain.com

# 3. Configure Nginx
# Update nginx.conf with certificate paths
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3
```

### Load Balancing

- Use Nginx for load balancing
- Configure round-robin or least connections
- Set up health checks

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Test connection
docker-compose exec backend npm run db:test

# Check environment variables
docker-compose config
```

### Performance Issues

- Monitor CPU/Memory usage
- Check database query performance
- Optimize indexes
- Implement caching

## Maintenance

### Regular Tasks

- Monitor disk space
- Update dependencies
- Review logs for errors
- Backup databases
- Update SSL certificates

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

## Support

For deployment issues:
- Check `/DROPI_CANONICAL/12_DOCUMENTATION/TROUBLESHOOTING.md`
- Review Docker logs
- Contact support team

## License

MIT
