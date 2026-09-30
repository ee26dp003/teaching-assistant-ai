# Project Plan — AI & ML Teaching Assistant

## 1. Objective

Build an AI-powered teaching agent, specialized in AI/Machine Learning, that
gives students clear, step-by-step explanations — including worked math —
rather than behaving like a generic chatbot. The subject-matter behavior
must come from an editable context file, not hardcoded logic, so the
agent's teaching style and knowledge can be changed without touching code.

## 2. Scope

**Subject chosen:** Artificial Intelligence & Machine Learning
(supervised/unsupervised learning, optimization, neural networks,
evaluation metrics).

**In scope:**
- Single-turn question answering (no multi-turn memory).
- Text-based explanations with Markdown formatting and rendered math.
- Local execution via `uvicorn`, with an optional cloud deployment.

**Out of scope (possible future work):**
- Conversation history / follow-up questions.
- User accounts or saved question history.
- Support for file uploads (e.g. asking about an uploaded dataset).

## 3. System Architecture

```
┌─────────────────────┐
│      Browser         │
│  (Student's device)  │
│                       │
│  index.html/css/js    │
│  - question input     │
│  - Markdown + math     │
│    rendering           │
└──────────┬────────────┘
           │  HTTP (fetch)
           │  POST /ask { "question": "..." }
           ▼
┌─────────────────────────────┐
│         FastAPI Backend      │
│         (backend/main.py)    │
│                               │
│  - validates the request      │
│  - calls llm.py               │
│  - returns { "answer": "..." }│
│    or a clean error message   │
└──────────┬────────────────────┘
           │
           │  ask_llm(question)
           ▼
┌─────────────────────────────┐
│        backend/llm.py         │
│                               │
│  1. load_context() reads      │
│     context/context.md        │
│  2. builds the message list:  │
│     [system: context,         │
│      user: question]          │
│  3. calls Hugging Face         │
└──────────┬────────────────────┘
           │
           │  system + user messages
           ▼
┌─────────────────────────────┐      ┌───────────────────────┐
│  Hugging Face Inference API   │◄────►│   context/context.md   │
│  (hosted LLM, e.g. Mistral-7B)│      │  subject knowledge +   │
│                               │      │  teaching instructions │
└──────────┬────────────────────┘      └───────────────────────┘
           │
           │  generated answer text
           ▼
   (returns back up through llm.py → main.py → browser)
```

**Configuration flow (kept separate from the diagram above for clarity):**

```
.env  ──►  os.environ  ──►  backend/llm.py reads HF_TOKEN, HF_MODEL, HF_PROVIDER
```

`.env` is never read by the frontend and never leaves the server process.

## 4. How the Context File Is Used

`context/context.md` is not just documentation — it is loaded by
`load_context()` in `backend/llm.py` on every request and sent as the
`system` message to the LLM, ahead of the student's question. This is what
makes the agent behave as a *teaching assistant* rather than a generic
chatbot: the LLM is told, on every single call, what its role is, how it
should teach, and what subject knowledge to draw on. Editing that file
changes the agent's behavior with no code changes and no redeploy of logic
— only a server restart to reload the file.

## 5. Technology Choices

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Plain HTML/CSS/JS | No build step; easy to read and modify for a learning project |
| Backend | FastAPI (Python) | Lightweight, async-ready, automatic request validation via Pydantic |
| LLM provider | Hugging Face Inference API (`huggingface_hub`) | Free tier available; simple token-based auth; easy to swap models via `.env` |
| Math rendering | MathJax | Standard, reliable LaTeX rendering in-browser |
| Markdown rendering | marked.js | Small, dependency-free Markdown-to-HTML conversion |

## 6. Milestones

1. **Backend skeleton** — FastAPI app, `/ask` route, request validation.
2. **LLM integration** — Hugging Face client, error handling for
   config/auth/availability failures.
3. **Frontend** — question input, loading state, answer display.
4. **Context file** — externalize teaching behavior into `context.md`.
5. **Formatting** — Markdown rendering, LaTeX math rendering.
6. **Visual design** — notebook/chalkboard light-dark theme.
7. **Documentation** — README, this project plan, `.env.example`.
8. **Deployment** — push to GitHub; optionally deploy to Render for a live
   public URL.

## 7. Known Limitations

- Free-tier Hugging Face models can be slow or briefly unavailable on the
  first request after inactivity ("cold start").
- No conversation memory — each question is answered independently.
- Answer quality depends on the chosen model; smaller models trade depth
  for speed.
