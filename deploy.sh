nano ecosystem.config.js
  require('dotenv').config({ override: true });

module.exports = {
  apps: [
    {
      name: 'app-backend',
      script: 'dist/main.js',
      env: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        PORT: 8080,
        NODE_ENV: process.env.NODE_ENV || 'production'
      }
    }
  ]
};
