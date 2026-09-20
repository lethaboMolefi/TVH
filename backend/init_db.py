import os
import psycopg2
import time

DATABASE_URL = os.getenv("DATABASE_URL")

def init_db():
    if not DATABASE_URL:
        print("DATABASE_URL is not set. Skipping DB initialization.")
        return

    # Try connecting with retries to ensure DB is up
    max_retries = 5
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(DATABASE_URL)
            conn.autocommit = True
            cur = conn.cursor()

            # Check if users table exists
            cur.execute("SELECT to_regclass('public.users');")
            if cur.fetchone()[0] is None:
                print("Initializing database schema...")
                # The Dockerfile sets WORKDIR to /app/backend, so db-init is one level up
                with open("../db-init/init.sql", "r") as f:
                    schema = f.read()
                    cur.execute(schema)
                print("Database initialized successfully.")
            else:
                print("Database schema is already initialized.")
            
            cur.close()
            conn.close()
            break
        except Exception as e:
            print(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                print("Could not connect to the database to run initialization.")

if __name__ == "__main__":
    init_db()
