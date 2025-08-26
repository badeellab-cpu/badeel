module.exports = {
  apps: [
    {
      name: 'badeel-backend',
      script: '../backend/server.js',
      cwd: '/var/www/badeel/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Restart policy
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      log_file: '/var/log/pm2/badeel-backend.log',
      out_file: '/var/log/pm2/badeel-backend-out.log',
      error_file: '/var/log/pm2/badeel-backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Performance monitoring
      pmx: true,
      
      // Auto restart on memory limit
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 3000,
      listen_timeout: 3000,
      
      // Environment variables specific to production
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // Add other production-specific variables here
      }
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/badeellab-cpu/badeel.git',
      path: '/var/www/badeel',
      'post-deploy': 'cd backend && npm install --production && pm2 reload ecosystem.config.js --env production && cd ../badeel-platform && npm install && npm run build && sudo cp -r build/* /var/www/html/ && sudo systemctl reload nginx'
    }
  }
};
