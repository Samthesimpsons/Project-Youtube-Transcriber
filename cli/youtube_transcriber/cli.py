import re
import sys
from pathlib import Path

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

from .config import get_settings
from .summarization.summarizer import summarize
from .transcription.fetcher import fetch_transcript

console = Console()


def sanitize_for_filename(text: str) -> str:
    return re.sub(r"[^\w\-]", "_", text).strip("_")[:80]


def resolve_notes_path(title: str) -> str:
    settings = get_settings()
    settings.notes_directory.mkdir(exist_ok=True)
    safe_title = sanitize_for_filename(title)
    path = settings.notes_directory / f"{safe_title}.md"

    if not path.exists():
        return str(path)

    answer = (
        console.input(
            f"\n[yellow]'{path.name}' already exists. Overwrite? [y/N]:[/yellow] "
        )
        .strip()
        .lower()
    )

    if answer != "y":
        console.print("[red]Aborted.[/red]")
        sys.exit(0)

    return str(path)


def save_notes(title: str, content: str) -> str:
    path = resolve_notes_path(title)
    Path(path).write_text(content, encoding="utf-8")
    return path


def main() -> None:
    console.print(
        Panel(
            "[bold cyan]YouTube Transcriber[/bold cyan]\n"
            "[dim]Paste a YouTube URL to generate interview study notes[/dim]",
            expand=False,
        )
    )

    url = console.input("\n[bold]YouTube URL:[/bold] ").strip()

    if not url:
        console.print("[red]No URL provided. Exiting.[/red]")
        sys.exit(1)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True,
    ) as progress:
        fetch_task = progress.add_task("Fetching transcript...", total=None)
        transcript = fetch_transcript(url)
        progress.update(
            fetch_task,
            description=f"Transcript fetched — {transcript.word_count:,} words. Generating notes...",
        )
        notes = summarize(transcript)

    path = save_notes(transcript.title, notes)
    console.print(f"\n[green]Notes saved to:[/green] {path}\n")
    console.print(Markdown(notes))
