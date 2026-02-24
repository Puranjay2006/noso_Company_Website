# Production Deployment Checklist for nosocompany.com

## 🚨 Critical Issue: Backend Not Running

The "Registration failed" error shown in the screenshot indicates the **backend API is not reachable** from the production website. The frontend is trying to connect to the API but failing.

---

## Step 1: Verify Backend Environment on Production Server

### SSH into your production server and check:

```bash
# Check if backend is running
ps aux | grep uvicorn
# OR
ps aux | grep python

# Check if port 8080 is listening
netstat -tlnp | grep 8080
# OR
ss -tlnp | grep 8080
```

### If backend is NOT running, start it:

```bash
cd /path/to/NoSo-Company-main/backend

# Activate virtual environment (if using one)
source venv/bin/activate  # Linux/Mac
# OR
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Start the backend
uvicorn app:app --host 0.0.0.0 --port 8080
```

### For Production (run as a service):

Create a systemd service file `/etc/systemd/system/noso-backend.service`:

```ini
[Unit]
Description=NoSo Company Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/noso-backend
Environment="PATH=/var/www/noso-backend/venv/bin"
EnvironmentFile=/var/www/noso-backend/.env
ExecStart=/var/www/noso-backend/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable noso-backend
sudo systemctl start noso-backend
sudo systemctl status noso-backend
```

---

## Step 2: Configure Production Environment Variables

### Backend `.env` (on production server):

```dotenv
# =============================================================================
# NoSo Company Backend Environment - PRODUCTION
# =============================================================================

APP_NAME=NoSo Company API
ENV=production
DEBUG=False

# Security & JWT - CHANGE THIS SECRET KEY FOR PRODUCTION!
SECRET_KEY=your-super-secret-production-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database - Use your production MongoDB URI
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/
MONGO_URI=mongodb://localhost:27017/
DB_NAME=noso_company

# Stripe Payment (use live keys for production)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
CURRENCY=nzd

# File Upload
UPLOAD_FOLDER=uploads/images/bookings
MAX_FILE_SIZE=16777216

# CORS Origins - CRITICAL FOR PRODUCTION
CORS_ORIGINS=["https://nosocompany.com", "https://www.nosocompany.com"]

# URLs
FRONTEND_URL=https://nosocompany.com
APP_BASE_URL=https://nosocompany.com/
PRODUCTION_DOMAIN=nosocompany.com
```

### Frontend `.env` (build with these for production):

```dotenv
VITE_ENV=production
VITE_API_URL=https://nosocompany.com/api
VITE_FRONTEND_URL=https://nosocompany.com
```

---

## Step 3: Verify MongoDB is Running

```bash
# Check MongoDB status
sudo systemctl status mongod

# If not running:
sudo systemctl start mongod
sudo systemctl enable mongod

# Test connection
mongosh --eval "db.adminCommand('ping')"
```

### Initialize Database with Demo Data (if needed):

```bash
cd /path/to/backend
python -c "from database.create_demo_records import create_demo_data; create_demo_data()"
```

---

## Step 4: Configure Web Server (Nginx/Caddy)

### Nginx Configuration (`/etc/nginx/sites-available/nosocompany`):

```nginx
server {
    listen 80;
    server_name nosocompany.com www.nosocompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nosocompany.com www.nosocompany.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/nosocompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nosocompany.com/privkey.pem;

    # Frontend (static files)
    root /var/www/noso-frontend/dist;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static uploads
    location /uploads/ {
        alias /var/www/noso-backend/uploads/;
    }
}
```

---

## Step 5: Test API Endpoints

```bash
# Test health endpoint
curl https://nosocompany.com/api/health

# Test registration endpoint
curl -X POST https://nosocompany.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"+64123456789","password":"testpass123"}'

# Test services endpoint
curl https://nosocompany.com/api/services/

# Test categories endpoint
curl https://nosocompany.com/api/categories/
```

---

## Common Issues & Solutions

### Issue 1: "Registration failed. Please try again."
**Cause:** Backend API not reachable
**Solution:** 
- Check backend is running on port 8080
- Check Nginx/Caddy is proxying /api/ correctly
- Check CORS_ORIGINS includes your domain

### Issue 2: Services not loading
**Cause:** Empty database or API error
**Solution:**
- Run database initialization script
- Check MongoDB connection
- Check API logs: `journalctl -u noso-backend -f`

### Issue 3: CORS errors in browser console
**Cause:** Frontend domain not in CORS_ORIGINS
**Solution:**
- Add your domain to CORS_ORIGINS in backend .env
- Restart backend service

---

## Quick Diagnostic Commands

```bash
# View backend logs
journalctl -u noso-backend -f

# View Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Test local API
curl http://localhost:8080/health

# Check if backend can connect to MongoDB
cd /path/to/backend && python -c "from database.mongodb import connect_to_mongo; connect_to_mongo()"
```
