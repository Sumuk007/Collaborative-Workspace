from pydantic import BaseModel

class UserStatsOut(BaseModel):
    total_documents: int
    owned_documents: int
    collaborations: int
    shared_links: int
    
    class Config:
        from_attributes = True
