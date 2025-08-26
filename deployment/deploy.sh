#!/bin/bash

# Badeel Platform Deployment Script
# This script automates the deployment process for the Badeel platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/badeel"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/badeel-platform"
WEB_DIR="/var/www/html"
LOG_FILE="/var/log/badeel-deploy.log"
BACKUP_DIR="/var/backups/badeel"

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

# Function to create backup
create_backup() {
    print_status "Creating backup..."
    
    # Create backup directory with timestamp
    BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    CURRENT_BACKUP_DIR="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    mkdir -p "$CURRENT_BACKUP_DIR"
    
    # Backup current code
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$CURRENT_BACKUP_DIR/code"
        print_success "Code backup created"
    fi
    
    # Backup database
    if command -v mongodump &> /dev/null; then
        mongodump --db badeel_platform --out "$CURRENT_BACKUP_DIR/database" --quiet
        print_success "Database backup created"
    else
        print_warning "mongodump not found, skipping database backup"
    fi
    
    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -1t | tail -n +6 | xargs -r rm -rf
    
    print_success "Backup completed: $CURRENT_BACKUP_DIR"
}

# Function to rollback
rollback() {
    print_error "Deployment failed, initiating rollback..."
    
    # Get latest backup
    LATEST_BACKUP=$(ls -1t "$BACKUP_DIR" | head -n 1)
    
    if [ -n "$LATEST_BACKUP" ] && [ -d "$BACKUP_DIR/$LATEST_BACKUP" ]; then
        print_status "Rolling back to: $LATEST_BACKUP"
        
        # Stop services
        pm2 stop badeel-backend || true
        
        # Restore code
        rm -rf "$PROJECT_DIR"
        cp -r "$BACKUP_DIR/$LATEST_BACKUP/code" "$PROJECT_DIR"
        
        # Restart services
        cd "$BACKEND_DIR"
        pm2 start ecosystem.config.js
        
        # Reload nginx
        sudo systemctl reload nginx
        
        print_success "Rollback completed"
    else
        print_error "No backup found for rollback"
    fi
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if running as root for certain operations
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root, some operations may require sudo"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed"
        exit 1
    fi
    
    # Check Nginx
    if ! command -v nginx &> /dev/null; then
        print_error "Nginx is not installed"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Function to deploy application
deploy() {
    print_status "Starting deployment process..."
    
    # Create backup first
    create_backup
    
    # Navigate to project directory
    cd "$PROJECT_DIR"
    
    # Get current branch and commit
    CURRENT_BRANCH=$(git branch --show-current)
    CURRENT_COMMIT=$(git rev-parse HEAD)
    print_status "Current branch: $CURRENT_BRANCH, Commit: $CURRENT_COMMIT"
    
    # Pull latest changes
    print_status "Pulling latest changes from GitHub..."
    git fetch origin
    git reset --hard origin/main
    
    NEW_COMMIT=$(git rev-parse HEAD)
    print_status "Updated to commit: $NEW_COMMIT"
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install --production --silent
    
    # Install frontend dependencies and build
    print_status "Building frontend application..."
    cd "$FRONTEND_DIR"
    npm install --silent
    npm run build
    
    # Deploy frontend build
    print_status "Deploying frontend build..."
    sudo rm -rf "$WEB_DIR"/*
    sudo cp -r build/* "$WEB_DIR/"
    sudo chown -R www-data:www-data "$WEB_DIR"
    
    # Restart backend with PM2
    print_status "Restarting backend services..."
    cd "$BACKEND_DIR"
    pm2 restart badeel-backend || pm2 start ecosystem.config.js --name badeel-backend
    
    # Test backend health
    print_status "Testing backend health..."
    sleep 5
    
    if curl -f http://localhost:5000/health &> /dev/null; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        rollback
        exit 1
    fi
    
    # Reload Nginx
    print_status "Reloading Nginx configuration..."
    sudo nginx -t
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        print_success "Nginx reloaded successfully"
    else
        print_error "Nginx configuration test failed"
        rollback
        exit 1
    fi
    
    # Test frontend
    print_status "Testing frontend deployment..."
    if curl -f http://localhost/ &> /dev/null; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend accessibility check failed"
    fi
    
    print_success "Deployment completed successfully!"
    print_status "Application URL: https://your-domain.com"
}

# Function to show application status
show_status() {
    print_status "Application Status:"
    echo "==================="
    
    # PM2 status
    echo -e "\n${BLUE}PM2 Processes:${NC}"
    pm2 list
    
    # Nginx status
    echo -e "\n${BLUE}Nginx Status:${NC}"
    sudo systemctl status nginx --no-pager -l
    
    # Disk usage
    echo -e "\n${BLUE}Disk Usage:${NC}"
    df -h "$PROJECT_DIR"
    
    # Last few log entries
    echo -e "\n${BLUE}Recent Logs:${NC}"
    if [ -f "$LOG_FILE" ]; then
        tail -10 "$LOG_FILE"
    else
        echo "No deployment logs found"
    fi
}

# Function to show logs
show_logs() {
    print_status "Application Logs:"
    echo "=================="
    
    # PM2 logs
    echo -e "\n${BLUE}PM2 Logs:${NC}"
    pm2 logs badeel-backend --lines 20
    
    # Nginx error logs
    echo -e "\n${BLUE}Nginx Error Logs:${NC}"
    sudo tail -20 /var/log/nginx/badeel_error.log 2>/dev/null || echo "No Nginx error logs found"
    
    # Deployment logs
    echo -e "\n${BLUE}Deployment Logs:${NC}"
    if [ -f "$LOG_FILE" ]; then
        tail -20 "$LOG_FILE"
    else
        echo "No deployment logs found"
    fi
}

# Function to update SSL certificate
update_ssl() {
    print_status "Updating SSL certificate..."
    
    sudo certbot renew --nginx --quiet
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate updated successfully"
        sudo systemctl reload nginx
    else
        print_error "SSL certificate update failed"
        exit 1
    fi
}

# Main script logic
main() {
    # Create log file if it doesn't exist
    sudo mkdir -p "$(dirname "$LOG_FILE")"
    sudo touch "$LOG_FILE"
    sudo chmod 664 "$LOG_FILE"
    
    # Log all output
    exec > >(tee -a "$LOG_FILE")
    exec 2>&1
    
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            deploy
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "ssl")
            update_ssl
            ;;
        "backup")
            create_backup
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|status|logs|ssl|backup}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the latest version from GitHub"
            echo "  rollback - Rollback to the previous version"
            echo "  status   - Show application status"
            echo "  logs     - Show application logs"
            echo "  ssl      - Update SSL certificate"
            echo "  backup   - Create manual backup"
            exit 1
            ;;
    esac
}

# Create backup directory
sudo mkdir -p "$BACKUP_DIR"

# Run main function
main "$@"
