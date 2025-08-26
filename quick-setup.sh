#!/bin/bash

# Quick Setup Script for Badeel Platform
# This will install everything needed on the server

set -e

echo "🚀 Starting Badeel Platform setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install basic tools
echo "🔧 Installing basic tools..."
sudo apt install -y curl wget git unzip software-properties-common ufw

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
echo "🗄️ Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
echo "⚡ Installing PM2..."
sudo npm install -g pm2

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create directories
echo "📁 Creating directories..."
sudo mkdir -p /var/www/badeel
sudo mkdir -p /var/www/html
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/backups/badeel

# Set permissions
sudo chown -R ubuntu:ubuntu /var/www/badeel
sudo chown -R www-data:www-data /var/www/html
sudo chown -R ubuntu:ubuntu /var/log/pm2
sudo chown -R ubuntu:ubuntu /var/backups/badeel

# Clone project
echo "📥 Cloning project from GitHub..."
cd /var/www
sudo rm -rf badeel
git clone https://github.com/badeellab-cpu/badeel.git
sudo chown -R ubuntu:ubuntu badeel

echo "✅ Basic setup completed!"
echo "🔧 Next: Install project dependencies and configure environment"
