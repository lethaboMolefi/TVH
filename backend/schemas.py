from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from models import UserRole, UpdateType, VisibilityType

# Users
class UserCreate(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    system_role: UserRole

class ParticipantCreate(BaseModel):
    first_name: str
    last_name: str
    team_role: str

class UserResponse(BaseModel):
    id: UUID
    username: str
    first_name: str
    last_name: str
    system_role: UserRole
    is_active: bool
    requires_password_change: bool
    team_id: Optional[UUID] = None
    team_role: Optional[str] = None
    
    class Config:
        from_attributes = True

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

# Ideas
class IdeaCreate(BaseModel):
    title: str
    description: str
    tech_requirements: Optional[str] = None

class IdeaResponse(BaseModel):
    id: UUID
    title: str
    description: str
    tech_requirements: Optional[str]
    created_by: UUID
    
    class Config:
        from_attributes = True

# Teams
class TeamCreate(BaseModel):
    name: str
    coach_id: UUID

class TeamResponse(BaseModel):
    id: UUID
    name: str
    coach_id: UUID
    idea_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Progress Updates
class ProgressUpdateCreate(BaseModel):
    team_id: UUID
    user_id: Optional[UUID] = None
    type: UpdateType
    content: str

class ProgressUpdateResponse(BaseModel):
    id: UUID
    team_id: UUID
    user_id: Optional[UUID]
    type: UpdateType
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Notes
class NoteCreate(BaseModel):
    team_id: Optional[UUID] = None
    target_user_id: Optional[UUID] = None
    progress_update_id: Optional[UUID] = None
    content: str
    visibility: VisibilityType

class NoteResponse(BaseModel):
    id: UUID
    author_id: UUID
    team_id: Optional[UUID]
    target_user_id: Optional[UUID]
    progress_update_id: Optional[UUID]
    content: str
    visibility: VisibilityType
    created_at: datetime
    
    class Config:
        from_attributes = True

# System Settings
class SystemSettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = None
    reporting_interval_hours: Optional[int] = None

class SystemSettingsResponse(BaseModel):
    has_api_key: bool
    reporting_interval_hours: int

class AIInsightResponse(BaseModel):
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Team Snapshot (Compound Response)
class SnapshotTeamMember(BaseModel):
    id: UUID
    name: str
    team_role: Optional[str]

class SnapshotTeamInfo(BaseModel):
    id: UUID
    name: str
    coach_id: UUID
    idea: Optional[IdeaResponse]
    members: List[SnapshotTeamMember]

class TeamSnapshotResponse(BaseModel):
    team: SnapshotTeamInfo
    team_milestones: List[ProgressUpdateResponse]
    individual_updates: List[ProgressUpdateResponse]
    notes: List[NoteResponse]
    ai_insight: Optional[AIInsightResponse] = None
