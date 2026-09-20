import time
from database import engine, Base
import models # Ensure models are imported for Base

def init_db():
    max_retries = 30
    for attempt in range(max_retries):
        try:
            print("Initializing database schema via SQLAlchemy...")
            from sqlalchemy import inspect, text
            inspector = inspect(engine)
            if 'users' in inspector.get_table_names():
                columns = [c['name'] for c in inspector.get_columns('users')]
                if 'username' not in columns:
                    print("Old schema detected (missing 'username' column). Dropping all tables to reset...")
                    with engine.begin() as conn:
                        conn.execute(text("DROP TABLE IF EXISTS users, ideas, teams, progress_updates, notes, system_settings, ai_insights CASCADE;"))
                    
            Base.metadata.create_all(bind=engine)
            print("Database schema ensured.")
            break
        except Exception as e:
            print(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)
            else:
                print("Could not connect to the database to run initialization.")
                import sys
                sys.exit(1)

if __name__ == "__main__":
    init_db()
