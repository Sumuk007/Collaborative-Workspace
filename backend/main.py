from fastapi import FastAPI
from routers import auth_router, workspace_router, membership_router, document_router, role_router # import your routers here
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Collaborative Workspace API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Include your routers
app.include_router(auth_router.router)
app.include_router(workspace_router.router)
app.include_router(membership_router.router)
app.include_router(document_router.router)
app.include_router(role_router.router)
# Later you can add: app.include_router(document_router.router) etc.

