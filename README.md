# AI & ML Teaching Assistant

An AI-powered teaching agent, specialized in AI/Machine Learning, that
gives students clear, step-by-step explanations — including properly
rendered math — instead of behaving like a generic chatbot.

See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the full project plan and
architecture block diagram.

---

## 1. What This Project Includes

- **Frontend** (`frontend/`) — an interactive notebook/chalkboard-themed
  web page where a student types a question and gets a formatted answer,
  with a light/dark mode toggle.
- **Backend** (`backend/`) — a FastAPI server that validates requests and
  talks to the LLM.
- **LLM integration** — Hugging Face's Inference API via `huggingface_hub`,
  configurable to any supported chat model.
- **Context file** (`context/context.md`) — the subject knowledge and
  teaching instructions the agent uses on every request. This is what
  makes it a *teaching assistant* rather than a generic chatbot — see
  Section 6.
- **`.env`** — all API keys and configuration; never hardcoded, never
  committed to version control.

## 2. Requirements

- Python 3.10+
- A Hugging Face account and access token with **Inference** permission:
  https://huggingface.co/settings/tokens
- Internet connection (the backend calls Hugging Face over the network)

## 3. Installation

```bash
# from the project root
python -m venv .venv

# activate it
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

## 4. Configuration

Copy the example file and fill in your real values:

```bash
cp .env.example .env
```

`.env` should contain:

```text
HF_TOKEN=your_huggingface_token_here
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
HF_PROVIDER=auto
```

**When creating your Hugging Face token:** choose the **Inference** scope
(or, on a fine-grained token, enable "Make calls to Inference Providers").
A plain "Read" token is not sufficient — it will fail with a 403 error.

**Security rules:**
- Never commit your real `.env` file — it's already listed in `.gitignore`.
- Never put the Hugging Face token in frontend JavaScript/HTML.
- The token is read only on the server (`backend/llm.py`), never sent to
  or logged for the browser.

## 5. Running the Application

Start the backend from the project root:

```bash
uvicorn backend.main:app --reload
```

The backend also serves the frontend as static files, so once it's
running you can open everything at:

```text
http://127.0.0.1:8000/app
```

(`GET /` on its own returns a small JSON health check:
`http://127.0.0.1:8000/`.)

## 6. How the Context File Works

`context/context.md` contains two things:

1. **Teaching instructions** — how the agent should explain concepts
   (step-by-step, with analogies, using Markdown and LaTeX for math, etc).
2. **Subject knowledge** — a reference of core AI/ML concepts, formulas,
   and definitions the agent draws on.

On every question, `backend/llm.py` reads this file with `load_context()`
and sends its full contents to the LLM as the system message, before the
student's question. This means:

- The agent's behavior can be changed by editing a Markdown file — no
  Python code changes needed (just restart the server to pick up edits).
- You can verify the agent is actually "using" the context: try asking an
  AI/ML question and check that the answer follows the teaching style and
  draws on the knowledge described in `context.md`.

To change the subject entirely (e.g. from AI/ML to Biology), replace the
content of `context/context.md` with instructions and knowledge for the
new subject — no other files need to change.

## 7. Changing the Model

The model is never hard-coded. To use a different one, change `HF_MODEL`
in `.env`:

```text
HF_MODEL=microsoft/Phi-3-mini-4k-instruct
```

Not every model on the Hugging Face Hub is available through the free
Inference API, and some (like Meta's Llama models) are "gated" and require
requesting access on the model's page before your token can use them.
Check the model's page on huggingface.co if you're unsure.

## 8. Using the Application

1. Open the app in your browser.
2. Type a question, e.g. *"Explain gradient descent using a simple analogy."*
3. Click **Ask Question**.
4. A loading indicator appears while the backend contacts the model.
5. The answer appears with Markdown formatting and rendered math, or a
   plain-language error message appears if something went wrong.
6. Use the toggle in the top-right corner to switch between "Notebook"
   (light) and "Chalkboard" (dark) mode.

## 9. Deploying Publicly (Optional)

To let others use the app without installing anything, deploy it to a
host like Render:

1. Push this project to a GitHub repository (`.env` stays out of it,
   thanks to `.gitignore`).
2. On Render, create a new Web Service connected to that repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Add `HF_TOKEN`, `HF_MODEL`, and `HF_PROVIDER` as environment variables
   in Render's dashboard (not in the repo).
6. Once deployed, share the `/app` URL Render gives you.

Free-tier hosting can "sleep" after inactivity, so the first request after
a while may take 30–60 seconds.

## 10. Limitations

- **Hosted model availability** — free-tier models can be rate-limited,
  temporarily unavailable, or slow to respond on first use ("cold start").
- **No conversation memory** — each question is answered independently.
- **Model quality** — smaller/free models may give shallower explanations.
- **Internet dependency** — the backend requires network access to
  Hugging Face; it stops working offline.
- **AI-generated content can be wrong** — always double-check important
  facts.

---

## Project Structure

```text
teaching-assistant-ai/
│
├── README.md
├── PROJECT_PLAN.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── context/
│   └── context.md    # Subject knowledge + teaching instructions (used at runtime)
│
├── backend/
│   ├── main.py        # FastAPI app, routes, validation, error handling
│   └── llm.py          # Hugging Face client, loads context.md, calls the LLM
│
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## Testing Notes

Before relying on this project, verify:

- `GET /` returns `{"status": "ok", ...}`.
- `POST /ask` with a real question returns a generated answer that
  reflects the teaching style in `context/context.md`.
- Submitting an empty question shows a validation message and makes
  **no** network request to the backend.
- Running the backend without a valid `HF_TOKEN` produces a clear
  "not configured correctly" error — never the token itself.
- Running the backend with `context/context.md` missing or empty
  produces a clear configuration error rather than a crash.
- An invalid `HF_MODEL` or a Hugging Face outage produces a clear
  "AI service is currently unavailable" error instead of crashing the
  frontend.
