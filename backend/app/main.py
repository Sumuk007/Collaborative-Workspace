from fastapi import FastAPI
from app.database import Base, engine
from app import models

app=FastAPI(title="Collaborative Docs API")

@app.get("/")
def root():
    return {"message": "Backend is running with db connected"}