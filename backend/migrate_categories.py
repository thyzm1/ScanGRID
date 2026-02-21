import asyncio
from sqlalchemy import text
from database import engine, Base
from models import Category

async def migrate():
    async with engine.begin() as conn:
        print("Creating categories table...")
        await conn.run_sync(Base.metadata.create_all) # Create new tables (Category)
        
        print("Checking if 'bins' table needs 'category_id' column...")
        try:
            # Check if column exists (simplistic check for SQLite)
            await conn.execute(text("SELECT category_id FROM bins LIMIT 1"))
            print("'category_id' column already exists.")
        except Exception:
            print("Adding 'category_id' column to 'bins' table...")
            await conn.execute(text("ALTER TABLE bins ADD COLUMN category_id VARCHAR"))
            print("Column added.")

    # Insert default categories
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.ext.asyncio import AsyncSession
    
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with SessionLocal() as db:
        print("Inserting default categories...")
        categories = [
            {"name": "Informatique", "icon": "ri-computer-line"},
            {"name": "Outils", "icon": "ri-tools-line"},
            {"name": "Câbles", "icon": "ri-plug-line"},
            {"name": "Composants", "icon": "ri-cpu-line"},
            {"name": "Divers", "icon": "ri-question-line"}
        ]
        
        from sqlalchemy import select
        for cat_data in categories:
            result = await db.execute(select(Category).where(Category.name == cat_data["name"]))
            existing = result.scalar_one_or_none()
            if not existing:
                new_cat = Category(name=cat_data["name"], icon=cat_data["icon"])
                db.add(new_cat)
                print(f"Created category: {cat_data['name']}")
        
        await db.commit()
    
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
