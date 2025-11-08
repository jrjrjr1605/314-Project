from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import api_routes

app = FastAPI()

# Allow your frontend origins
origins = [
    "http://localhost:5173",  # Vite
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


# Routes
app.include_router(api_routes.router)