"""
main.py

FastAPI application for the Teaching Assistant AI.

Responsibilities kept here (and only here):
- Creating the FastAPI app.
- Defining the HTTP routes.
- Validating incoming requests.
- Calling into llm.py for the actual model interaction.
- Turning errors into clean, student-friendly JSON responses.

The Hugging Face-specific code lives in llm.py so this file stays focused
on "web app" concerns rather than LLM concerns.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator

from backend.llm import ask_llm, LLMConfigError, LLMRequestError

# Load variables from .env into the process environment (local dev convenience).
load_dotenv()

app = FastAPI(title="Teaching Assistant AI")

# --- CORS -------------------------------------------------------------
# During local development the frontend may be opened directly as a file
# or served from a different port than FastAPI (e.g. a simple static
# server on :5500 while FastAPI runs on :8000). We allow the common local
# dev origins explicitly rather than allowing every origin.
#
# If the frontend ends up being served BY this same FastAPI app (see the
# StaticFiles mount below), everything runs on one origin and CORS is not
# strictly needed — but leaving this in place is harmless for local dev.
DEV_ORIGINS = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=DEV_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class QuestionRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Question must not be empty.")
        return value.strip()


class AnswerResponse(BaseModel):
    answer: str


@app.get("/")
def health_check():
    """Simple health/status endpoint used to verify the backend is running."""
    return {"status": "ok", "service": "Teaching Assistant AI backend"}


@app.post("/ask", response_model=AnswerResponse)
def ask_question(request: QuestionRequest):
    """
    Receive a student's question, send it (with the teaching-assistant
    instructions) to the Hugging Face model, and return the answer.
    """
    try:
        answer = ask_llm(request.question)
    except LLMConfigError:
        # Configuration problems are a server-side setup issue, not
        # something caused by the student's request.
        raise HTTPException(
            status_code=500,
            detail="The AI service is not configured correctly. Please contact the site administrator.",
        )
    except LLMRequestError:
        raise HTTPException(
            status_code=502,
            detail="The AI service is currently unavailable. Please try again.",
        )

    return AnswerResponse(answer=answer)


# --- Optional: serve the frontend from FastAPI itself ---------------------
# This lets a student run a single server (`uvicorn backend.main:app`) and
# open the whole app at http://127.0.0.1:8000/app without a separate static
# file server. It is mounted last so it never shadows the API routes above.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
