// PM2 Ecosystem Configuration for KEPROBA
module.exports = {
  apps: [
    {
      // Backend API Server
      name: 'keproba-api',
      script: 'server/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx',
      instances: 2, // Run 2 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Logging
      log_file: '/var/log/keproba/api-combined.log',
      out_file: '/var/log/keproba/api-out.log',
      error_file: '/var/log/keproba/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart configuration
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '500M',
      
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    },
    
    {
      // Frontend Next.js Server (if serving with PM2)
      name: 'keproba-frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_file: '/var/log/keproba/frontend-combined.log',
      out_file: '/var/log/keproba/frontend-out.log',
      error_file: '/var/log/keproba/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart configuration
      watch: false,
      max_memory_restart: '300M',
      
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/keproba-trade-directory.git',
      path: '/var/www/keproba',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && npm run db:push && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};