module.exports = {
  apps: [
    {
      name: "scangrid-backend",
      cwd: "/home/admin/scangrid/backend",
      script: "/home/admin/scangrid/backend/venv/bin/python",
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8001 --forwarded-allow-ips='*'",
      interpreter: "none",
      env: {
        SCANGRID_DB_DIR: "/home/admin/scangrid/backend/data"
      }
    }
  ]
};
