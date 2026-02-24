"""
Migration script to add height_units column to bins table
Run this script to update existing database: python3 migrate_height.py
"""
import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Checking if 'bins' table needs 'height_units' column...")
        try:
            # Check if column exists (simplistic check for SQLite)
            await conn.execute(text("SELECT height_units FROM bins LIMIT 1"))
            print("'height_units' column already exists.")
        except Exception:
            print("Adding 'height_units' column to 'bins' table...")
            await conn.execute(text("ALTER TABLE bins ADD COLUMN height_units INTEGER DEFAULT 1 NOT NULL"))
            print("Column added successfully.")
            
            # Ensure all existing bins have height_units = 1
            print("Setting default height_units = 1 for existing bins...")
            await conn.execute(text("UPDATE bins SET height_units = 1 WHERE height_units IS NULL"))
            print("Default values set.")
    
    print("Migration complete! All bins now have height_units = 1 by default.")

if __name__ == "__main__":
    asyncio.run(migrate())
