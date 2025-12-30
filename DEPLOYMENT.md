# Deployment Guide - Encubation Management System

## Server: library@library (Ubuntu) - Port 55221

### Prerequisites

- Node.js 20+ installed
- npm or pnpm
- Git

---

## Option 1: Direct Deployment (Recommended for quick setup)

### Step 1: SSH into the server

```bash
ssh library@library
```

### Step 2: Navigate to project directory

```bash
cd ~/incubation/encubation_management_system
```

### Step 3: Install dependencies

```bash
npm ci
```

### Step 4: Create production environment file

```bash
cat > .env << 'EOF'
# API Configuration
VITE_API_BASE_URL=http://encubation-backend.excellusi.com/api
VITE_SOCKET_URL=http://encubation-backend.excellusi.com

# Application Environment
VITE_APP_ENV=production
VITE_DEBUG=false

# Server Port
PORT=55221
EOF
```

### Step 5: Build the application

```bash
npm run build
```

### Step 6: Start the application on port 55221

```bash
PORT=55221 npm run start
```

---

## Option 2: Using PM2 (Recommended for production)

PM2 keeps your app running and restarts it automatically.

### Step 1: Install PM2 globally

```bash
npm install -g pm2
```

### Step 2: Create PM2 ecosystem file

```bash
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'encubation-frontend',
    script: 'npm',
    args: 'run start',
    cwd: '/home/library/incubation/encubation_management_system',
    env: {
      NODE_ENV: 'production',
      PORT: 55221
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
```

### Step 3: Create logs directory

```bash
mkdir -p logs
```

### Step 4: Start with PM2

```bash
pm2 start ecosystem.config.cjs
```

### Step 5: Save PM2 process list and enable startup

```bash
pm2 save
pm2 startup
```

Follow the command output to enable auto-start on boot.

### PM2 Useful Commands

```bash
pm2 list              # List all processes
pm2 logs              # View logs
pm2 restart all       # Restart all
pm2 stop all          # Stop all
pm2 delete all        # Delete all
```

---

## Option 3: Using Docker

### Step 1: Build Docker image

```bash
docker build -t encubation-frontend .
```

### Step 2: Run container on port 55221

```bash
docker run -d \
  --name encubation-frontend \
  -p 55221:3000 \
  -e PORT=3000 \
  -e VITE_API_BASE_URL=http://encubation-backend.excellusi.com/api \
  -e VITE_SOCKET_URL=http://encubation-backend.excellusi.com \
  --restart unless-stopped \
  encubation-frontend
```

---

## Nginx Reverse Proxy (Optional but recommended)

If you want to use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:55221;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Firewall Configuration

Make sure port 55221 is open:

```bash
sudo ufw allow 55221/tcp
sudo ufw reload
```

---

## Quick Deploy Script

Run this all-in-one script on the server:

```bash
#!/bin/bash
cd ~/incubation/encubation_management_system

# Install dependencies
npm ci

# Create .env
cat > .env << 'EOF'
VITE_API_BASE_URL=http://encubation-backend.excellusi.com/api
VITE_SOCKET_URL=http://encubation-backend.excellusi.com
VITE_APP_ENV=production
VITE_DEBUG=false
PORT=55221
EOF

# Build
npm run build

# Install PM2 if not installed
which pm2 || npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'encubation-frontend',
    script: 'npm',
    args: 'run start',
    cwd: '/home/library/incubation/encubation_management_system',
    env: {
      NODE_ENV: 'production',
      PORT: 55221
    },
    autorestart: true,
    max_memory_restart: '1G'
  }]
}
EOF

# Start with PM2
pm2 delete encubation-frontend 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "✅ Deployed! Access at http://YOUR_SERVER_IP:55221"
```

---

## Troubleshooting

### Check if port is in use

```bash
sudo lsof -i :55221
```

### Check application logs

```bash
pm2 logs encubation-frontend
```

### Check if Node.js is installed

```bash
node --version  # Should be 20+
```

### Rebuild if issues

```bash
rm -rf node_modules build
npm ci
npm run build
```
