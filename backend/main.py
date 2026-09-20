from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from database import get_db
from models import User, Idea, Team, ProgressUpdate, Note, VisibilityType, UpdateType
import schemas

app = FastAPI(title="Hackathon Coach Management System API")

# --- Authentication Mock ---
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """
    MOCK AUTHENTICATION: 
    For development, pass a user's UUID in the 'Authorization' header to act as that user.
    Example: `Authorization: <user_uuid>`
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header (pass user UUID)")
    
    user_id = authorization.replace("Bearer ", "").strip()
    try:
        user = db.query(User).filter(User.id == UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format in Authorization header")

# --- Users ---
@app.post("/api/v1/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Mock password hashing
    fake_hashed_password = user.password + "_hashed"
    db_user = User(
        email=user.email,
        hashed_password=fake_hashed_password,
        system_role=user.system_role,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/v1/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# --- Ideas ---
@app.post("/api/v1/ideas", response_model=schemas.IdeaResponse)
def create_idea(idea: schemas.IdeaCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_idea = Idea(**idea.model_dump(), created_by=current_user.id)
    db.add(db_idea)
    db.commit()
    db.refresh(db_idea)
    return db_idea

@app.get("/api/v1/ideas", response_model=List[schemas.IdeaResponse])
def get_ideas(db: Session = Depends(get_db)):
    return db.query(Idea).all()

# --- Teams ---
@app.post("/api/v1/teams", response_model=schemas.TeamResponse)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    db_team = Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@app.post("/api/v1/teams/{team_id}/members/{user_id}")
def add_member_to_team(team_id: UUID, user_id: UUID, team_role: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.team_id = team_id
    user.team_role = team_role
    db.commit()
    return {"message": "User added to team successfully", "user_id": user_id, "team_id": team_id}

@app.post("/api/v1/teams/{team_id}/idea/{idea_id}")
def assign_idea_to_team(team_id: UUID, idea_id: UUID, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team.idea_id = idea_id
    db.commit()
    return {"message": "Idea assigned to team successfully"}

# --- Progress Updates ---
@app.post("/api/v1/progress_updates", response_model=schemas.ProgressUpdateResponse)
def create_progress_update(update: schemas.ProgressUpdateCreate, db: Session = Depends(get_db)):
    db_update = ProgressUpdate(**update.model_dump())
    db.add(db_update)
    db.commit()
    db.refresh(db_update)
    return db_update

# --- Notes ---
@app.post("/api/v1/notes", response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not note.team_id and not note.progress_update_id:
        raise HTTPException(status_code=400, detail="Note must be linked to a team or progress update")
    
    db_note = Note(**note.model_dump(), author_id=current_user.id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

# --- Coach Snapshot ---
@app.get("/api/v1/teams/{team_id}/snapshot", response_model=schemas.TeamSnapshotResponse)
def get_team_snapshot(team_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    members = db.query(User).filter(User.team_id == team_id).all()
    idea = db.query(Idea).filter(Idea.id == team.idea_id).first() if team.idea_id else None
    
    updates = db.query(ProgressUpdate).filter(ProgressUpdate.team_id == team_id).all()
    team_milestones = [u for u in updates if u.type == UpdateType.TEAM_MILESTONE]
    individual_updates = [u for u in updates if u.type == UpdateType.INDIVIDUAL_TASK]
    
    # Filter notes: include all public notes for this team/updates, 
    # but only private notes authored by the current user.
    all_notes = db.query(Note).filter(
        (Note.team_id == team_id) | 
        (Note.progress_update_id.in_([u.id for u in updates] if updates else []))
    ).all()
    
    visible_notes = []
    for note in all_notes:
        if note.visibility == VisibilityType.PUBLIC or note.author_id == current_user.id:
            visible_notes.append(note)

    snapshot_members = [
        schemas.SnapshotTeamMember(id=m.id, name=f"{m.first_name} {m.last_name}", team_role=m.team_role)
        for m in members
    ]

    snapshot_team = schemas.SnapshotTeamInfo(
        id=team.id,
        name=team.name,
        coach_id=team.coach_id,
        idea=idea,
        members=snapshot_members
    )
    
    return schemas.TeamSnapshotResponse(
        team=snapshot_team,
        team_milestones=team_milestones,
        individual_updates=individual_updates,
        notes=visible_notes
    )

@app.get("/health")
def health_check():
    return {"status": "healthy"}
