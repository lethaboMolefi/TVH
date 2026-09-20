import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = 'ADMIN'
    COACH = 'COACH'
    DEDICATED_COACH = 'DEDICATED_COACH'
    PARTICIPANT = 'PARTICIPANT'

class UpdateType(str, enum.Enum):
    TEAM_MILESTONE = 'TEAM_MILESTONE'
    INDIVIDUAL_TASK = 'INDIVIDUAL_TASK'

class VisibilityType(str, enum.Enum):
    PUBLIC = 'PUBLIC'
    PRIVATE = 'PRIVATE'

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    requires_password_change = Column(Boolean, default=True)
    system_role = Column(Enum(UserRole, name="user_role", create_type=False), nullable=False)
    is_active = Column(Boolean, default=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    team_role = Column(String(100), nullable=True)

    team = relationship("Team", foreign_keys=[team_id], back_populates="members")

class Idea(Base):
    __tablename__ = "ideas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    tech_requirements = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    team = relationship("Team", back_populates="idea", uselist=False)

class Team(Base):
    __tablename__ = "teams"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    coach_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    idea_id = Column(UUID(as_uuid=True), ForeignKey("ideas.id"), unique=True)
    
    idea = relationship("Idea", back_populates="team")
    coach = relationship("User", foreign_keys=[coach_id])
    members = relationship("User", foreign_keys=[User.team_id], back_populates="team")
    progress_updates = relationship("ProgressUpdate", back_populates="team")
    notes = relationship("Note", back_populates="team")

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    type = Column(Enum(UpdateType, name="update_type", create_type=False), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    team = relationship("Team", back_populates="progress_updates")
    user = relationship("User", foreign_keys=[user_id])
    notes = relationship("Note", back_populates="progress_update")

class Note(Base):
    __tablename__ = "notes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    progress_update_id = Column(UUID(as_uuid=True), ForeignKey("progress_updates.id"), nullable=True)
    content = Column(Text, nullable=False)
    visibility = Column(Enum(VisibilityType, name="visibility_type", create_type=False), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    author = relationship("User", foreign_keys=[author_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    team = relationship("Team", back_populates="notes")
    progress_update = relationship("ProgressUpdate", back_populates="notes")

class SystemSettings(Base):
    __tablename__ = "system_settings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    openai_api_key = Column(String(255), nullable=True)
    openai_api_key_added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reporting_interval_hours = Column(Integer, default=24)

class AIInsight(Base):
    __tablename__ = "ai_insights"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
