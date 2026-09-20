from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime
import os

app = FastAPI(title="Hackathon Coach Management System API")

# --- Schemas ---

class IdeaSchema(BaseModel):
    id: UUID4
    title: str
    description: str
    tech_requirements: Optional[str]

class MemberSchema(BaseModel):
    id: UUID4
    name: str
    team_role: Optional[str]

class TeamSchema(BaseModel):
    id: UUID4
    name: str
    coach_id: UUID4
    idea: Optional[IdeaSchema]
    members: List[MemberSchema]

class ProgressUpdateSchema(BaseModel):
    id: UUID4
    user_id: Optional[UUID4]
    user_name: Optional[str]
    content: str
    created_at: datetime

class NoteSchema(BaseModel):
    id: UUID4
    author_id: UUID4
    author_name: str
    content: str
    visibility: str
    created_at: datetime
    related_entity: str

class SnapshotProgressSchema(BaseModel):
    team_milestones: List[ProgressUpdateSchema]
    individual_updates: List[ProgressUpdateSchema]

class TeamSnapshotResponse(BaseModel):
    team: TeamSchema
    progress: SnapshotProgressSchema
    notes: List[NoteSchema]


# --- Dependencies ---
def get_current_user_id(authorization: str = Header(None)):
    """
    Mock dependency to extract user ID from JWT token.
    In a real app, this would decode the JWT and fetch the user.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    # Mocking: returning a static UUID for demonstration
    return "00000000-0000-0000-0000-000000000000"

# --- Endpoints ---

@app.get("/api/v1/teams/{team_id}/snapshot", response_model=TeamSnapshotResponse)
def get_team_snapshot(team_id: UUID4, current_user_id: str = Depends(get_current_user_id)):
    """
    Fetch a complete snapshot of a team's current state.
    Includes:
    - Team details and selected Idea
    - Members and their roles
    - Dual-track progress updates (Team & Individual)
    - Public notes and the requesting coach's private notes
    """
    
    # In a real implementation, we would query the database using SQLAlchemy here.
    # e.g., session.query(Team).filter(Team.id == team_id).first()
    
    # Returning mock data mapped to the required structure for demonstration
    return {
        "team": {
            "id": team_id,
            "name": "Team Alpha",
            "coach_id": "11111111-1111-1111-1111-111111111111",
            "idea": {
                "id": "22222222-2222-2222-2222-222222222222",
                "title": "Smart City Dashboard",
                "description": "A dashboard for urban metrics.",
                "tech_requirements": "React, FastAPI, PostgreSQL"
            },
            "members": [
                {
                    "id": "33333333-3333-3333-3333-333333333333",
                    "name": "Alice Developer",
                    "team_role": "Frontend Developer"
                }
            ]
        },
        "progress": {
            "team_milestones": [
                {
                    "id": "44444444-4444-4444-4444-444444444444",
                    "user_id": None,
                    "user_name": None,
                    "content": "MVP Built",
                    "created_at": datetime.utcnow()
                }
            ],
            "individual_updates": [
                {
                    "id": "55555555-5555-5555-5555-555555555555",
                    "user_id": "33333333-3333-3333-3333-333333333333",
                    "user_name": "Alice Developer",
                    "content": "Designed Figma wireframes",
                    "created_at": datetime.utcnow()
                }
            ]
        },
        "notes": [
            {
                "id": "66666666-6666-6666-6666-666666666666",
                "author_id": current_user_id,
                "author_name": "Coach Name",
                "content": "Team is slightly behind on frontend tasks.",
                "visibility": "PRIVATE",
                "created_at": datetime.utcnow(),
                "related_entity": "team"
            }
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
