module.exports = {
  apps: [
    {
      name: "scangrid-backend",
      cwd: "./backend",
      script: "venv/bin/uvicorn",
      args: "main:app --host 127.0.0.1 --port 8001 --root-path /api",
      interpreter: "none", // On utilise le venv directement via le script
      env: {
        SCANGRID_DB_DIR: "./data"
      }
    },
    {
      name: "scangrid-frontend",
      cwd: "./front",
      script: "serve",
      args: "-s dist -l 5173", // On sert le dossier "dist" sur le port 5173
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
