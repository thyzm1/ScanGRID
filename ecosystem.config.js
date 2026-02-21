module.exports = {
  apps: [
    {
      name: "scangrid-backend",
      cwd: "./backend",
      script: "venv/bin/python",
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8001",
      interpreter: "none", // On utilise le venv directement via le script
      env: {
        SCANGRID_DB_DIR: "./data"
      }
    },
    {
      name: "scangrid-frontend",
      cwd: "./front",
      script: "serve",
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: '5173',
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      }
    }
  ]
};
