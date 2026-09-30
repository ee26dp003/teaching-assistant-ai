# CLAUDE.md

## Project Goal

Build a web-based **Teaching Assistant AI** that allows a student to ask questions through a browser interface and receive answers from a remotely hosted Large Language Model (LLM).

The project is intended as an educational AI/ML systems project. The goal is to demonstrate how a complete AI application is constructed using:

1. A web frontend used by the student.
2. A Python FastAPI backend.
3. A remotely hosted LLM accessed through Hugging Face.
4. An API-based communication flow between the frontend, backend, and LLM.
5. A final project that can be run locally and uploaded to GitHub.

The central system should work conceptually as:

```text
Student
   |
   | Question
   v
Web Frontend
   |
   | HTTP request
   v
FastAPI Backend
   |
   | API request
   v
Hugging Face
   |
   v
Hosted LLM
   |
   | Generated answer
   v
FastAPI Backend
   |
   | JSON response
   v
Web Frontend
   |
   v
Student
```

The application should behave like a simple AI teaching assistant rather than a generic chatbot.

---

# Important Scope

The first version should be a **working educational prototype**, not a production-grade AI platform.

The implementation MUST include:

- A browser-based frontend.
- A Python FastAPI backend.
- Communication between frontend and FastAPI.
- Communication between FastAPI and a Hugging Face hosted model.
- A text input box for student questions.
- A button to submit a question.
- A visible area for the AI answer.
- Loading/status feedback while waiting for the model.
- Basic error handling.
- Secure handling of API credentials.
- A README with setup and execution instructions.
- A `.env.example` file.
- A `.gitignore` file.
- A clear project structure.
- Testing of the complete application before finalizing.
- Uploading the complete project to GitHub as the final stage.

Do NOT initially add:

- Docker
- Kubernetes
- Databases
- Vector databases
- RAG
- Fine-tuning
- Model training
- Complex authentication
- Microservices
- Redis
- Celery
- Complicated agent frameworks
- Unnecessary design patterns
- Complex frontend frameworks unless genuinely needed
- Paid proprietary LLM APIs

Keep the implementation understandable to a student learning how AI applications are built.

---

# Preferred Technology

Use the following technologies unless there is a strong technical reason not to.

## Backend

- Python 3.10+
- FastAPI
- Uvicorn
- `python-dotenv`
- Hugging Face API/client

The backend should expose a simple API endpoint for asking questions.

For example:

```text
POST /ask
```

The endpoint should accept a student's question and return the generated answer.

---

# LLM Provider

Use **Hugging Face hosted/free-access models** rather than requiring a locally running LLM.

The model should be configurable rather than hard-coded throughout the application.

Use an environment variable such as:

```text
HF_TOKEN=your_huggingface_token_here
HF_MODEL=your_model_name_here
```

Do not assume that a particular Hugging Face model will always be available.

Before implementation, check the current Hugging Face documentation and current model/API availability.

Use the current supported Hugging Face API/client syntax.

Do NOT invent deprecated API methods.

If the selected model/API has limitations, document them clearly.

The application should make it easy to change the model by changing the environment variable rather than modifying multiple source files.

---

# API Key Security

This is extremely important.

NEVER:

- Hard-code the Hugging Face token in Python source code.
- Put the Hugging Face token in frontend JavaScript.
- Put the Hugging Face token in HTML.
- Commit the `.env` file to GitHub.
- Display the token in error messages.
- Send the token from the browser to the FastAPI backend.

The correct architecture is:

```text
Browser
   |
   | question only
   v
FastAPI
   |
   | Hugging Face token is read from server environment
   v
Hugging Face API
```

Create:

```text
.env.example
```

with placeholders such as:

```text
HF_TOKEN=your_huggingface_token_here
HF_MODEL=your_model_name_here
```

The actual `.env` file must be included in `.gitignore`.

---

# Project Structure

Start with a simple and understandable structure.

Use something similar to:

```text
teaching-assistant-ai/
│
├── CLAUDE.md
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── backend/
│   ├── main.py
│   └── llm.py
│
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

Do not create unnecessary files.

The responsibilities should be approximately:

### `backend/main.py`

Responsible for:

- Creating the FastAPI application.
- Defining API routes.
- Receiving student questions.
- Calling the LLM functionality.
- Returning responses to the frontend.
- Handling basic HTTP/API errors.

### `backend/llm.py`

Responsible for:

- Loading the Hugging Face configuration.
- Initializing the Hugging Face client.
- Sending prompts to the selected model.
- Returning the generated response.

Keep LLM-specific code separate from the FastAPI route logic.

### `frontend/index.html`

Responsible for:

- Page structure.
- Question input.
- Submit button.
- Answer display.
- Basic application layout.

### `frontend/style.css`

Responsible for:

- Page styling.
- Chat/teaching-assistant appearance.
- Input and button styling.
- Answer area.
- Loading/error states.

### `frontend/script.js`

Responsible for:

- Reading the student's question.
- Sending the question to FastAPI.
- Receiving the JSON response.
- Displaying the answer.
- Displaying loading/error states.

---

# Frontend Requirements

The frontend should be simple but visually clean.

The main page should contain:

```text
--------------------------------------------------
             Teaching Assistant AI
--------------------------------------------------

Ask a question:

[                                      ]

[ Ask Question ]

--------------------------------------------------
AI Answer

[                                      ]
[                                      ]
[                                      ]

--------------------------------------------------
```

The interface should clearly communicate that the system is a teaching assistant.

Use a simple educational design.

Do not spend excessive time creating a highly complex UI.

---

# Frontend Behaviour

When the student enters a question and clicks the button:

1. Validate that the question is not empty.
2. Display a loading indicator.
3. Disable the submit button temporarily if appropriate.
4. Send an HTTP POST request to the FastAPI backend.
5. Receive the response.
6. Display the AI-generated answer.
7. Remove the loading indicator.
8. Re-enable the button.
9. Display a useful error message if the request fails.

The browser should NOT communicate directly with Hugging Face.

The browser communicates only with FastAPI.

---

# FastAPI Backend

Create a FastAPI application.

The backend should expose at least:

```text
GET /
```

and:

```text
POST /ask
```

`GET /` can be used as a simple health/status endpoint.

`POST /ask` should receive a JSON request similar to:

```json
{
    "question": "Explain gradient descent."
}
```

and return something similar to:

```json
{
    "answer": "Gradient descent is..."
}
```

Use Pydantic models for request validation where appropriate.

For example, conceptually:

```python
class QuestionRequest(BaseModel):
    question: str
```

Do not create unnecessary abstractions.

---

# CORS

Because the frontend and backend may run on different local development ports, configure CORS appropriately for local development.

Do not simply allow every origin without explanation.

Document the chosen development configuration in the README.

If the frontend is later served by FastAPI itself, simplify the configuration accordingly.

---

# Teaching Assistant Prompt

The LLM should not simply be treated as a generic chatbot.

Create a basic system/instruction prompt that tells the model to behave as a teaching assistant.

The assistant should:

- Explain concepts clearly.
- Prefer understandable explanations over unnecessarily complicated terminology.
- Break difficult concepts into smaller steps.
- Use examples when useful.
- Help students understand rather than simply giving unexplained answers.
- Avoid pretending to know information it does not know.
- State uncertainty when appropriate.

A basic instruction can conceptually be:

```text
You are a helpful Teaching Assistant AI.

Your job is to help students understand technical and academic concepts.

Explain concepts clearly and step by step.
Use simple examples when useful.
Do not unnecessarily complicate explanations.
When solving a problem, explain the reasoning rather than only giving the final answer.
If the student's question is ambiguous, explain the ambiguity or ask for clarification.
```

Keep this prompt easy to modify.

---

# Question Handling

The backend should combine the teaching-assistant instructions with the student's question before sending the request to the LLM.

Conceptually:

```text
Teaching Assistant Instructions
+
Student Question
        ↓
Hugging Face Model
        ↓
Generated Answer
```

Do not expose internal implementation details unnecessarily to the student.

---

# Error Handling

The application should handle at least:

1. Empty question.
2. Missing Hugging Face token.
3. Invalid Hugging Face configuration.
4. Hugging Face API/model errors.
5. Network errors.
6. Invalid backend requests.
7. Unexpected model responses.
8. Frontend request failures.

Error messages should be understandable.

For example:

```text
Please enter a question.
```

or:

```text
The AI service is currently unavailable. Please try again.
```

Do not expose:

- API tokens.
- Internal stack traces to the frontend.
- Sensitive configuration values.

During development, useful errors may be logged on the backend, but secrets must never be logged.

---

# Environment Configuration

Use `python-dotenv` for local development.

The backend should load:

```text
HF_TOKEN
HF_MODEL
```

from `.env`.

Example:

```text
HF_TOKEN=your_huggingface_token_here
HF_MODEL=your_model_name_here
```

Never commit the real `.env`.

`.gitignore` should include at least:

```text
.env
.venv/
__pycache__/
*.pyc
```

---

# Dependencies

Create:

```text
requirements.txt
```

Include only packages actually required.

At minimum, the project will likely require packages such as:

```text
fastapi
uvicorn
python-dotenv
huggingface_hub
```

Use the current compatible versions/API according to the current documentation.

Do not add packages simply because they are popular.

---

# Running the Backend

The README should explain how to create a virtual environment.

For example:

```bash
python -m venv .venv
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

Then:

```bash
pip install -r requirements.txt
```

Create `.env` from `.env.example`.

Then start FastAPI using an appropriate Uvicorn command, for example:

```bash
uvicorn backend.main:app --reload
```

Verify that the backend starts successfully.

---

# Running the Frontend

Choose a simple approach that is easy for students to understand.

If the frontend is served separately during development, document the method clearly.

If appropriate, FastAPI may serve the static frontend so that the entire application can eventually be started using one server.

Prefer the simplest working architecture.

Do not introduce a complicated frontend build system unless it is genuinely necessary.

---

# API Testing

Before declaring the project complete, test the backend independently.

Verify:

```text
GET /
```

works.

Then test:

```text
POST /ask
```

with a simple question such as:

```text
What is gradient descent?
```

Verify that:

1. FastAPI receives the request.
2. FastAPI successfully contacts Hugging Face.
3. The selected model generates a response.
4. FastAPI returns the response as JSON.
5. The frontend displays the response.

---

# End-to-End Testing

The complete application must be tested through the browser.

Perform at least these tests:

### Test 1 — Basic Question

Ask:

```text
What is machine learning?
```

Verify that an answer appears.

### Test 2 — Technical Question

Ask:

```text
Explain gradient descent using a simple analogy.
```

Verify that the model responds appropriately.

### Test 3 — Empty Input

Submit an empty question.

Verify that the application does not send an unnecessary API request and instead displays a useful validation message.

### Test 4 — Multiple Questions

Ask several different questions sequentially.

Verify that the interface continues to work.

### Test 5 — API Failure

Test an invalid/unavailable model configuration or another safe failure condition.

Verify that the application displays a user-friendly error rather than crashing the frontend.

### Test 6 — Missing Token

Temporarily test the backend without a Hugging Face token.

Verify that the backend produces a clear configuration error without exposing secrets.

---

# README.md

Create a clear README explaining:

## 1. Project Overview

Explain what the Teaching Assistant AI does.

## 2. Architecture

Show the architecture:

```text
Browser
   ↓
Frontend
   ↓ HTTP
FastAPI
   ↓
Hugging Face API
   ↓
Hosted LLM
   ↓
FastAPI
   ↓
Frontend
```

Explain the role of each component.

## 3. Requirements

Explain:

- Python version.
- Hugging Face account/token requirement.
- Internet connection.
- Required packages.

## 4. Installation

Provide exact commands.

## 5. Environment Variables

Explain how to create `.env` from `.env.example`.

Explicitly warn:

- Never commit API tokens.
- Never put API tokens in frontend JavaScript.
- Never hard-code API tokens.
- Never upload `.env` to GitHub.

## 6. Running the Application

Provide exact commands for starting the backend and frontend.

## 7. Using the Application

Explain how a student asks a question.

## 8. How It Works Internally

Explain the complete request flow:

```text
Student enters question
        ↓
Frontend JavaScript
        ↓
POST /ask
        ↓
FastAPI
        ↓
Teaching Assistant prompt
        ↓
Hugging Face API
        ↓
Hosted LLM
        ↓
Generated response
        ↓
FastAPI JSON response
        ↓
Frontend
        ↓
Student sees answer
```

## 9. Changing the Model

Explain how `HF_MODEL` can be changed.

Do not assume all models have identical capabilities or availability.

## 10. Limitations

Clearly mention that this is an educational prototype.

Potential limitations include:

- Hosted model availability.
- Rate limits.
- Model quality.
- Response latency.
- Internet dependency.
- Free-tier/API limitations.
- The model can produce incorrect information.

---

# Code Quality

The code should be:

- Short.
- Readable.
- Well structured.
- Appropriately commented.
- Easy for a student to understand.
- Easy to modify with Claude Code.
- Based on current library/API syntax.

Avoid:

- Unnecessary classes.
- Excessive abstraction.
- Complex dependency injection.
- Large configuration systems.
- Complicated logging frameworks.
- Unnecessary asynchronous complexity.
- Design patterns that do not provide educational value.

Comments should explain important concepts and architecture rather than restating obvious Python syntax.

---

# Security Requirements

Treat API credentials as secrets.

Before the project is considered complete, inspect the repository for accidentally exposed secrets.

Check that:

```text
.env
```

is ignored.

Check that no token appears in:

- `.py`
- `.js`
- `.html`
- `.css`
- `README.md`
- Git history
- configuration files

The browser must never receive the Hugging Face token.

---

# GitHub Requirement

At the **final stage of the project**, upload the complete working Teaching Assistant AI project to GitHub.

This is a mandatory final step.

Before uploading:

1. Verify that the project runs successfully.
2. Run the end-to-end tests.
3. Check the project structure.
4. Check `requirements.txt`.
5. Check `README.md`.
6. Check `.gitignore`.
7. Check that `.env` is NOT included.
8. Check that no API token or secret is present anywhere in the repository.
9. Review the files that will be committed.
10. Initialize Git if necessary.
11. Create or connect to the appropriate GitHub repository.
12. Commit the project.
13. Push the complete project to GitHub.
14. Verify the repository contents on GitHub.

The final GitHub repository should contain the source code and documentation but MUST NOT contain real API credentials.

The repository should look approximately like:

```text
teaching-assistant-ai/
│
├── CLAUDE.md
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── backend/
│   ├── main.py
│   └── llm.py
│
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

---

# Git Workflow

Use meaningful commit messages.

For example:

```text
Initial project structure
```

```text
Add FastAPI backend
```

```text
Integrate Hugging Face model
```

```text
Add teaching assistant frontend
```

```text
Add error handling and documentation
```

```text
Finalize project for GitHub
```

Do not commit secrets.

---

# Development Process

Follow this order rather than trying to build everything at once.

## Phase 1 — Project Setup

Create the project structure.

Create:

- `requirements.txt`
- `.env.example`
- `.gitignore`
- `README.md`

Do not add unnecessary dependencies.

---

## Phase 2 — FastAPI Backend

Implement the FastAPI application.

First make:

```text
GET /
```

work.

Then implement:

```text
POST /ask
```

using a simple placeholder response if necessary.

Verify that the API works before integrating the LLM.

---

## Phase 3 — Hugging Face Integration

Integrate the Hugging Face hosted model.

Verify that:

```text
FastAPI → Hugging Face → FastAPI
```

works independently of the frontend.

Test with simple questions.

---

## Phase 4 — Teaching Assistant Behaviour

Add the Teaching Assistant system/instruction prompt.

Test questions such as:

```text
Explain supervised learning.
```

```text
What is gradient descent?
```

```text
Explain backpropagation using an analogy.
```

Verify that the responses are appropriate for students.

---

## Phase 5 — Frontend

Build the simple web interface.

Connect:

```text
Frontend → FastAPI → Hugging Face → FastAPI → Frontend
```

Test the complete flow.

---

## Phase 6 — Error Handling

Add validation and user-friendly error handling.

Test:

- Empty input.
- API failure.
- Missing token.
- Model failure.
- Network failure.

---

## Phase 7 — Documentation

Complete `README.md`.

Make sure another student can clone the repository and understand how to run it.

---

## Phase 8 — Final Verification

Before GitHub upload:

```text
[ ] Backend starts
[ ] Frontend works
[ ] Question can be submitted
[ ] LLM generates answer
[ ] Answer appears in browser
[ ] Empty input handled
[ ] API failure handled
[ ] Missing token handled
[ ] .env ignored
[ ] No secret in source code
[ ] README complete
[ ] requirements.txt complete
[ ] Project structure clean
```

Only after these checks should the project be uploaded to GitHub.

---

# Claude Code Instructions

When working on this project:

1. Inspect the existing files before modifying them.
2. Do not overwrite working code unnecessarily.
3. Make small, understandable changes.
4. After significant changes, run the application/tests.
5. If an API/library has changed, check current official documentation rather than relying on outdated examples.
6. Explain important implementation decisions when they affect the architecture.
7. Do not add technologies outside the defined scope without first explaining why they are necessary.
8. Keep the application simple enough that a student can understand the complete request flow.
9. Never expose or commit API credentials.
10. At the end, verify the entire application before performing the GitHub upload.

---

# Final Objective

The finished project should demonstrate a complete but simple AI application:

```text
                 Teaching Assistant AI

                       Student
                          |
                          v
                  +---------------+
                  |    Frontend   |
                  | HTML/CSS/JS   |
                  +-------+-------+
                          |
                     HTTP POST
                          |
                          v
                  +---------------+
                  |    FastAPI    |
                  |    Backend    |
                  +-------+-------+
                          |
                     LLM API call
                          |
                          v
                  +---------------+
                  |  Hugging Face |
                  | Hosted Model  |
                  +-------+-------+
                          |
                     AI response
                          |
                          v
                  +---------------+
                  |    FastAPI    |
                  +-------+-------+
                          |
                       JSON
                          |
                          v
                  +---------------+
                  |    Frontend   |
                  +-------+-------+
                          |
                          v
                       Student
```

The primary educational concept is:

> A web application can communicate with a backend API, and the backend can securely communicate with a remotely hosted LLM to provide an AI-powered service.

The project should prioritize **clarity, working functionality, security, and educational value over complexity**.