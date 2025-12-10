from fastapi import FastAPI
from app.database import Base, engine
from app import models
from app.routes import auth_router

app=FastAPI(title="Collaborative Docs API")

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "Backend is running with db connected"}