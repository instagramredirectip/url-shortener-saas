module.exports = {
  apps: [
    {
      name: "url-shortener-api",
      script: "./server/src/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        // PORT will be read from the server/.env file, 
        // but we define it here as a fallback
        PORT: 5000 
      }
    }
  ]
};