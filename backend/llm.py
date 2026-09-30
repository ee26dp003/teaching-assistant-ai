"""
llm.py

Everything related to talking to the Hugging Face hosted LLM lives here,
kept separate from the FastAPI route logic in main.py.

Educational note: we use huggingface_hub's InferenceClient with the
chat-completion API, which is the current standard way to call
instruction-tuned / chat models hosted on the HF Inference API. Swapping
the model only requires changing the HF_MODEL environment variable.
"""

import os
from pathlib import Path

from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError

# --- Teaching context -------------------------------------------------
# The subject knowledge and teaching instructions live in a separate
# Markdown file (context/context.md), NOT hardcoded here. This means the
# assistant's behavior and subject expertise can be edited by anyone
# without touching Python code, and it's easy to see exactly what
# "context" the agent is using when it generates an answer.
CONTEXT_FILE_PATH = Path(__file__).resolve().parent.parent / "context" / "context.md"


class LLMConfigError(Exception):
    """Raised when required Hugging Face configuration is missing or invalid."""


class LLMRequestError(Exception):
    """Raised when the Hugging Face API call itself fails (network, model, etc.)."""


def load_context() -> str:
    """
    Read the teaching context (subject knowledge + teaching instructions)
    from context/context.md. This is sent as the system message on every
    request, so the model's teaching behavior always reflects whatever is
    currently in that file.
    """
    if not CONTEXT_FILE_PATH.exists():
        raise LLMConfigError(
            f"Context file not found at {CONTEXT_FILE_PATH}. "
            "The teaching assistant requires context/context.md to generate answers."
        )

    content = CONTEXT_FILE_PATH.read_text(encoding="utf-8").strip()
    if not content:
        raise LLMConfigError("context/context.md exists but is empty.")

    return content


def _get_client() -> InferenceClient:
    """
    Build an InferenceClient from environment variables.

    Reads HF_TOKEN and HF_PROVIDER from the environment each call so the
    server always picks up whatever is currently configured (useful during
    local development when .env changes are reloaded).
    """
    token = os.getenv("HF_TOKEN")
    if not token or token == "your_huggingface_token_here":
        # Fail loudly on the backend, but this message is safe to show —
        # it never includes the token itself.
        raise LLMConfigError(
            "HF_TOKEN is not configured. Copy .env.example to .env and set a real Hugging Face token."
        )

    provider = os.getenv("HF_PROVIDER", "auto")
    return InferenceClient(provider=provider, token=token)


def ask_llm(question: str) -> str:
    """
    Send the student's question (combined with the teaching context loaded
    from context/context.md) to the configured Hugging Face model and
    return the generated answer as plain text.

    Raises LLMConfigError / LLMRequestError on failure so main.py can
    translate them into clean HTTP error responses.
    """
    model = os.getenv("HF_MODEL")
    if not model or model == "your_huggingface_model_here":
        raise LLMConfigError(
            "HF_MODEL is not configured. Set HF_MODEL in your .env file to a supported chat model."
        )

    system_prompt = load_context()
    client = _get_client()

    try:
        response = client.chat_completion(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            max_tokens=1024,
            temperature=0.5,
        )
    except HfHubHTTPError as exc:
        # Covers auth errors, model-not-found, rate limits, provider outages, etc.
        raise LLMRequestError(f"The Hugging Face API request failed: {exc}") from exc
    except Exception as exc:  # noqa: BLE001 - last-resort safety net, re-raised as our own type
        raise LLMRequestError(f"Unexpected error while contacting the LLM: {exc}") from exc

    try:
        answer = response.choices[0].message.content
    except (AttributeError, IndexError) as exc:
        raise LLMRequestError("The model returned an unexpected response format.") from exc

    if not answer or not answer.strip():
        raise LLMRequestError("The model returned an empty response.")

    return answer.strip()
