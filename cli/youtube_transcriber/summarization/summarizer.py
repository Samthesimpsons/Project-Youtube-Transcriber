import anthropic
from anthropic.types import TextBlock

from ..config import get_settings
from ..transcription.models import Transcript
from .prompts import SYSTEM_PROMPT


def summarize(transcript: Transcript) -> str:
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    user_message = (
        f"Video title: {transcript.title}\n\n"
        f"Transcript ({transcript.word_count} words):\n\n"
        f"{transcript.full_text}"
    )

    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=4096,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_message}],
    )

    content_block = response.content[0]
    if not isinstance(content_block, TextBlock):
        raise RuntimeError(
            f"Unexpected response block type from Claude API: {type(content_block)}"
        )

    return content_block.text
