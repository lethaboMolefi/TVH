from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from database import get_db
from models import User, Team, Idea, Note, ProgressUpdate, AIInsight, UserRole

def add_delete_endpoints(app: FastAPI):
    def get_superadmin_local(current_user: User):
        if current_user.system_role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Superadmin access required")
        return current_user

    from main import get_current_user

    @app.delete("/api/v1/teams/{team_id}")
    def delete_team(team_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        if current_user.system_role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Superadmin access required")
            
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
            
        # Delete related child records explicitly to avoid FK errors without CASCADE set in DB
        db.query(Note).filter(Note.team_id == team_id).delete(synchronize_session=False)
        db.query(ProgressUpdate).filter(ProgressUpdate.team_id == team_id).delete(synchronize_session=False)
        db.query(AIInsight).filter(AIInsight.team_id == team_id).delete(synchronize_session=False)
        
        # Clear coach team_ids
        coaches = db.query(User).filter(User.team_id == team_id).all()
        for c in coaches:
            c.team_id = None
            
        # Delete idea
        if team.idea_id:
            db.query(Idea).filter(Idea.id == team.idea_id).delete(synchronize_session=False)
            
        db.delete(team)
        db.commit()
        return {"message": "Team deleted successfully"}

    @app.delete("/api/v1/users/{user_id}")
    def delete_user(user_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        if current_user.system_role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Superadmin access required")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.system_role == UserRole.ADMIN:
            raise HTTPException(status_code=400, detail="Cannot delete superadmin")
            
        # Delete notes authored by them
        db.query(Note).filter(Note.author_id == user_id).delete(synchronize_session=False)
        
        # Delete user
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
