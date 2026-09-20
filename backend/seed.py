import uuid
import random
from database import SessionLocal
from models import User, UserRole

def seed_db():
    db = SessionLocal()
    
    if db.query(User).count() > 0:
        print("Database already contains users. Skipping seed.")
        return

    print("Seeding Users...")
    superadmin = User(
        username="Super1",
        hashed_password="161841_hashed",
        system_role=UserRole.ADMIN,
        is_active=True,
        requires_password_change=True,
        first_name="Super",
        last_name="Admin"
    )
    
    db.add_all([superadmin])
    db.commit()
    db.refresh(superadmin)
    
    print("\n--- SEEDING COMPLETE ---")
    print(f"Superadmin ID : {superadmin.id}")
    print("------------------------\n")

if __name__ == "__main__":
    seed_db()
