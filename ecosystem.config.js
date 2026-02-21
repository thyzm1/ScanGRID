module.exports = {
  apps: [
    {
      name: "scangrid-backend",
      cwd: "./backend",
      script: "venv/bin/python",
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8001 --forwarded-allow-ips='*'",
      interpreter: "none", // On utilise le venv directement via le script
      env: {
        SCANGRID_DB_DIR: "./data"
      }
    }
  ]
};
