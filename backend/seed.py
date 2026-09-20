import uuid
import random
from database import SessionLocal
from models import User, Idea, Team, ProgressUpdate, Note, UserRole, UpdateType, VisibilityType

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
    
    coach1 = User(
        username="coach1",
        hashed_password="hashed_hashed",
        system_role=UserRole.COACH,
        is_active=True,
        requires_password_change=True,
        first_name="Sarah",
        last_name="Coach"
    )
    
    db.add_all([superadmin, coach1])
    db.commit()
    db.refresh(superadmin)
    db.refresh(coach1)

    print("Seeding Ideas...")
    idea1 = Idea(
        title="AI-Powered City Traffic Optimizer",
        description="A platform that uses AI to redirect emergency vehicles through optimal routes.",
        tech_requirements="Python, FastAPI, Next.js, Google Maps API",
        created_by=superadmin.id
    )
    db.add(idea1)
    db.commit()
    db.refresh(idea1)

    print("Seeding Teams...")
    team1 = Team(
        name="Team Alpha Data",
        coach_id=coach1.id,
        idea_id=idea1.id
    )
    db.add(team1)
    db.commit()
    db.refresh(team1)

    print("Seeding Dedicated Coaches (formerly Hackers)...")
    hackers = []
    roles = ["Frontend Developer", "Backend Developer", "UI/UX Designer", "Project Manager", "Data Scientist"]
    names = ["Alice", "Bob", "Charlie", "David", "Eve"]
    for i in range(5):
        hacker = User(
            username=f"{names[i].lower()}",
            hashed_password="hashed_hashed",
            system_role=UserRole.DEDICATED_COACH,
            is_active=True,
            requires_password_change=True,
            first_name=names[i],
            last_name="Hacker",
            team_id=team1.id,
            team_role=roles[i]
        )
        hackers.append(hacker)
    db.add_all(hackers)
    db.commit()
    
    print("\n--- SEEDING COMPLETE ---")
    print(f"Superadmin ID : {superadmin.id}")
    print(f"Coach ID      : {coach1.id}")
    print("------------------------\n")

if __name__ == "__main__":
    seed_db()
