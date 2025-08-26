#!/bin/bash

# Server Setup Script for Badeel Platform on AWS EC2
# This script installs and configures all required software

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

# Update system
update_system() {
    print_status "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y curl wget git unzip software-properties-common
    print_success "System updated successfully"
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_success "Node.js installed: $node_version, npm: $npm_version"
}

# Install MongoDB
install_mongodb() {
    print_status "Installing MongoDB..."
    
    # Import MongoDB public key
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    # Update and install
    sudo apt update
    sudo apt install -y mongodb-org
    
    # Start and enable MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    # Verify installation
    if sudo systemctl is-active --quiet mongod; then
        print_success "MongoDB installed and running"
    else
        print_error "MongoDB installation failed"
        exit 1
    fi
}

# Install and configure Nginx
install_nginx() {
    print_status "Installing Nginx..."
    sudo apt install -y nginx
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Configure firewall
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
    
    print_success "Nginx installed and configured"
}

# Install PM2
install_pm2() {
    print_status "Installing PM2..."
    sudo npm install -g pm2
    
    # Configure PM2 startup
    sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
    
    print_success "PM2 installed and configured"
}

# Install Certbot for SSL
install_certbot() {
    print_status "Installing Certbot for SSL certificates..."
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
}

# Configure MongoDB security
configure_mongodb() {
    print_status "Configuring MongoDB security..."
    
    # Create admin user
    sudo mongo admin --eval "
    db.createUser({
        user: 'admin',
        pwd: 'SecurePassword123!',
        roles: ['userAdminAnyDatabase', 'dbAdminAnyDatabase', 'readWriteAnyDatabase']
    })"
    
    # Create application user
    sudo mongo badeel_platform --eval "
    db.createUser({
        user: 'badeel_user',
        pwd: 'BadeelSecure123!',
        roles: ['readWrite']
    })"
    
    # Enable authentication
    sudo sed -i 's/#security:/security:/' /etc/mongod.conf
    sudo sed -i '/security:/a\  authorization: enabled' /etc/mongod.conf
    
    # Restart MongoDB
    sudo systemctl restart mongod
    
    print_success "MongoDB security configured"
}

# Create project directories
create_directories() {
    print_status "Creating project directories..."
    
    # Create main directories
    sudo mkdir -p /var/www/badeel
    sudo mkdir -p /var/www/html
    sudo mkdir -p /var/log/pm2
    sudo mkdir -p /var/backups/badeel
    
    # Set ownership
    sudo chown -R ubuntu:ubuntu /var/www/badeel
    sudo chown -R www-data:www-data /var/www/html
    sudo chown -R ubuntu:ubuntu /var/log/pm2
    sudo chown -R ubuntu:ubuntu /var/backups/badeel
    
    print_success "Project directories created"
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow necessary ports
    sudo ufw allow 22    # SSH
    sudo ufw allow 80    # HTTP
    sudo ufw allow 443   # HTTPS
    
    # Show status
    sudo ufw status
    
    print_success "Firewall configured"
}

# Clone project repository
clone_project() {
    print_status "Cloning project repository..."
    
    cd /var/www
    sudo rm -rf badeel  # Remove if exists
    git clone https://github.com/badeellab-cpu/badeel.git
    sudo chown -R ubuntu:ubuntu badeel
    
    print_success "Project repository cloned"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Backend dependencies
    cd /var/www/badeel/backend
    npm install --production
    
    # Frontend dependencies
    cd /var/www/badeel/badeel-platform
    npm install
    
    print_success "Project dependencies installed"
}

# Configure environment variables
configure_environment() {
    print_status "Configuring environment variables..."
    
    cd /var/www/badeel/backend
    
    # Create production .env file
    cat > .env << EOF
# Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://badeel_user:BadeelSecure123!@localhost:27017/badeel_platform

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration (Update these with your SMTP settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Badeel Platform <noreply@badeel.com>

# Frontend Configuration
FRONTEND_URL=https://your-domain.com

# File Upload Configuration
MAX_FILE_UPLOAD=10485760
FILE_UPLOAD_PATH=./uploads

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Configuration
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=$(openssl rand -base64 32)

# Admin Default Configuration
ADMIN_DEFAULT_EMAIL=admin@badeel.com
ADMIN_DEFAULT_PASSWORD=Admin@$(openssl rand -base64 8)

# API Configuration
API_VERSION=v1

# Moyasar Payment Gateway Configuration
MOYASAR_PUBLIC_KEY=pk_test_jMJ9G9hod66VrmMqBjPv5GQxZX5d6LW8MKerNuYh
MOYASAR_SECRET_KEY=sk_test_Nog5Vyz4ovEjv1dU95Qw4tpdGdp6bk2jCmzDciZA
MOYASAR_API_URL=https://api.moyasar.com/v1
MOYASAR_WEBHOOK_SECRET=$(openssl rand -base64 32)

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF

    # Set proper permissions
    chmod 600 .env
    
    print_success "Environment variables configured"
}

# Build and deploy frontend
build_frontend() {
    print_status "Building and deploying frontend..."
    
    cd /var/www/badeel/badeel-platform
    npm run build
    
    # Deploy to web directory
    sudo rm -rf /var/www/html/*
    sudo cp -r build/* /var/www/html/
    sudo chown -R www-data:www-data /var/www/html
    
    print_success "Frontend built and deployed"
}

# Start application with PM2
start_application() {
    print_status "Starting application with PM2..."
    
    cd /var/www/badeel/backend
    pm2 start ../deployment/ecosystem.config.js
    pm2 save
    
    print_success "Application started with PM2"
}

# Configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Backup default config
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    
    # Copy our config (update domain name first)
    sudo cp /var/www/badeel/deployment/nginx.conf /etc/nginx/sites-available/badeel
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/badeel /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    # Restart Nginx
    sudo systemctl restart nginx
    
    print_success "Nginx configured"
}

# Display final information
show_completion_info() {
    print_success "✅ Server setup completed successfully!"
    echo ""
    echo "==================== IMPORTANT INFORMATION ===================="
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Update your domain DNS to point to this server's IP"
    echo "2. Update domain name in /var/www/badeel/deployment/nginx.conf"
    echo "3. Install SSL certificate: sudo certbot --nginx -d your-domain.com"
    echo "4. Update email settings in /var/www/badeel/backend/.env"
    echo "5. Update Moyasar keys for production in .env file"
    echo ""
    echo "📂 Important Paths:"
    echo "   Project: /var/www/badeel"
    echo "   Web Root: /var/www/html"
    echo "   Logs: /var/log/pm2"
    echo "   Backups: /var/backups/badeel"
    echo ""
    echo "🔐 Default Admin Credentials:"
    echo "   Email: admin@badeel.com"
    admin_password=$(grep ADMIN_DEFAULT_PASSWORD /var/www/badeel/backend/.env | cut -d'=' -f2)
    echo "   Password: $admin_password"
    echo ""
    echo "🛠️ Useful Commands:"
    echo "   Deploy: /var/www/badeel/deployment/deploy.sh"
    echo "   Status: /var/www/badeel/deployment/deploy.sh status"
    echo "   Logs: /var/www/badeel/deployment/deploy.sh logs"
    echo "   PM2 Status: pm2 status"
    echo "   Nginx Status: sudo systemctl status nginx"
    echo ""
    echo "==============================================================="
}

# Main installation function
main() {
    print_status "Starting Badeel Platform server setup..."
    
    update_system
    install_nodejs
    install_mongodb
    install_nginx
    install_pm2
    install_certbot
    configure_firewall
    create_directories
    clone_project
    configure_mongodb
    install_dependencies
    configure_environment
    build_frontend
    start_application
    configure_nginx
    
    show_completion_info
}

# Run main function
main "$@"
