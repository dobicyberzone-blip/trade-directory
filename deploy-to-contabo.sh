#!/bin/bash

# KEPROBA Trade Directory - Contabo Deployment Script
# This script automates the deployment process on a fresh Ubuntu server

set -e  # Exit on any error

echo "=========================================="
echo "KEPROBA Trade Directory Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Prompt for configuration
echo "Please provide the following information:"
echo ""
read -p "Domain name (e.g., keproba.co.ke): " DOMAIN_NAME
read -p "Database name (default: keproba_trade_db): " DB_NAME
DB_NAME=${DB_NAME:-keproba_trade_db}
read -p "Database user (default: keproba_user): " DB_USER
DB_USER=${DB_USER:-keproba_user}
read -sp "Database password: " DB_PASSWORD
echo ""
read -p "GitHub repository URL: " REPO_URL
read -p "Application directory name (default: keproba-app): " APP_DIR
APP_DIR=${APP_DIR:-keproba-app}
echo ""

print_info "Starting deployment process..."
echo ""

# Step 1: Update system
print_info "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
print_success "System packages updated"
echo ""

# Step 2: Install Node.js
print_info "Step 2: Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi
echo ""

# Step 3: Install PostgreSQL
print_info "Step 3: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    print_success "PostgreSQL installed"
else
    print_success "PostgreSQL already installed"
fi
echo ""

# Step 4: Create database and user
print_info "Step 4: Setting up database..."
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF
print_success "Database created: $DB_NAME"
echo ""

# Step 5: Install Nginx
print_info "Step 5: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed"
else
    print_success "Nginx already installed"
fi
echo ""

# Step 6: Install PM2
print_info "Step 6: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi
echo ""

# Step 7: Configure firewall
print_info "Step 7: Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
print_success "Firewall configured"
echo ""

# Step 8: Clone repository
print_info "Step 8: Cloning repository..."
mkdir -p ~/apps
cd ~/apps
if [ -d "$APP_DIR" ]; then
    print_info "Directory exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin main
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi
print_success "Repository cloned/updated"
echo ""

# Step 9: Install dependencies
print_info "Step 9: Installing dependencies..."
npm install
print_success "Dependencies installed"
echo ""

# Step 10: Create .env file
print_info "Step 10: Creating environment file..."
cat > .env <<EOF
# Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Application Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME

# JWT Secret (generate a strong random string)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Email Configuration (Update with your SMTP details)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@$DOMAIN_NAME

# Add other environment variables as needed
EOF
chmod 600 .env
print_success "Environment file created"
print_info "Please update .env with your actual SMTP credentials"
echo ""

# Step 11: Setup database
print_info "Step 11: Setting up database schema..."
npx prisma generate
npx prisma migrate deploy
print_success "Database schema created"
echo ""

# Step 12: Build application
print_info "Step 12: Building application..."
npm run build
print_success "Application built"
echo ""

# Step 13: Configure Nginx
print_info "Step 13: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$APP_DIR > /dev/null <<EOF
upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    client_max_body_size 50M;

    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /_next/static {
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /api/files/ {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control "no-store";
        expires off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$APP_DIR /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
print_success "Nginx configured"
echo ""

# Step 14: Start application with PM2
print_info "Step 14: Starting application with PM2..."
pm2 delete $APP_DIR 2>/dev/null || true
pm2 start npm --name "$APP_DIR" -- start
pm2 save
print_success "Application started"
echo ""

# Step 15: Setup PM2 startup
print_info "Step 15: Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp $HOME | grep "sudo" | bash
pm2 save
print_success "PM2 startup configured"
echo ""

# Step 16: Install SSL certificate
print_info "Step 16: Installing SSL certificate..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi
print_info "Run the following command to get SSL certificate:"
echo "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
echo ""

# Step 17: Create backup script
print_info "Step 17: Creating backup script..."
cat > ~/backup-database.sh <<EOF
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"

mkdir -p \$BACKUP_DIR
PGPASSWORD='$DB_PASSWORD' pg_dump -U \$DB_USER -h localhost \$DB_NAME > \$BACKUP_DIR/backup_\$DATE.sql
find \$BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
echo "Backup completed: backup_\$DATE.sql"
EOF
chmod +x ~/backup-database.sh
print_success "Backup script created"
echo ""

# Final summary
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
print_success "Application deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your SMTP credentials:"
echo "   nano ~/apps/$APP_DIR/.env"
echo ""
echo "2. Install SSL certificate:"
echo "   sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
echo ""
echo "3. Test your application:"
echo "   https://$DOMAIN_NAME"
echo ""
echo "4. View application logs:"
echo "   pm2 logs $APP_DIR"
echo ""
echo "5. Monitor application:"
echo "   pm2 monit"
echo ""
echo "6. Setup daily backups (optional):"
echo "   crontab -e"
echo "   Add: 0 2 * * * /home/$USER/backup-database.sh"
echo ""
echo "=========================================="
