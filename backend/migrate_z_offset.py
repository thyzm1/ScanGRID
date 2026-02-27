import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Checking if 'bins' table needs 'z_offset' column...")
        try:
            # Check if column exists
            await conn.execute(text("SELECT z_offset FROM bins LIMIT 1"))
            print("'z_offset' column already exists.")
        except Exception:
            print("Adding 'z_offset' column to 'bins' table...")
            await conn.execute(text("ALTER TABLE bins ADD COLUMN z_offset FLOAT DEFAULT 0.0 NOT NULL"))
            print("Column added successfully.")
            
            print("Setting default z_offset = 0.0 for existing bins...")
            await conn.execute(text("UPDATE bins SET z_offset = 0.0 WHERE z_offset IS NULL"))
            print("Default values set.")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
