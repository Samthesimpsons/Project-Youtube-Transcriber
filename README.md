# YouTube Transcriber

Two tools in one repo for generating concise interview study notes from YouTube videos using Claude Sonnet. Designed for Software Engineering, Machine Learning, DevOps, and Cloud content.

| Tool | What it is |
|---|---|
| `cli/` | Local Python CLI — paste a URL, get a Markdown note saved to `notes/` |
| `extension/` | Chrome extension — button injected into YouTube, notes in a side panel |

## Requirements

- Python 3.13+ and [uv](https://docs.astral.sh/uv/)
- Node.js 20+ and npm (extension only)
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

**1. Clone and install dependencies:**

```bash
git clone <repo>
cd youtube_transcriber
uv sync
cd extension && npm install && cd ..
```

**2. Create your `.env` file:**

```bash
cp .env.example .env
```

Open `.env` and set your API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

**3. Add the shell alias (CLI only):**

```bash
echo "alias transcribe='(cd /home/ssim/projects/youtube_transcriber && uv run poe transcribe)'" >> ~/.bashrc
source ~/.bashrc
```

## CLI Usage

```bash
transcribe
```

Paste a YouTube URL when prompted. The tool will:

1. Fetch the video transcript
2. Generate structured study notes via Claude Sonnet
3. Save the notes to `notes/{Video Title}.md`
4. Render the notes in the terminal

If a note with the same title already exists, you will be asked whether to overwrite it.

## Chrome Extension Usage

**1. Build the extension:**

```bash
uv run poe ext-build
```

**2. Load in Chrome:**

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/dist/` folder

**3. Add your API key:**

Click the extension icon and open **Settings**. Enter your Anthropic API key — it is stored locally in your browser and only sent directly to `api.anthropic.com`.

**4. Generate notes:**

Open any YouTube video. Click the notes icon in the player controls. Notes appear in a side panel and can be downloaded as a `.md` file.

## Notes Format

Both tools produce the same structured output:

- **Core Concept**: one to two sentence summary of the video's thesis
- **Key Points**: dense bullet list of the most important concepts
- **Deep Dive**: detailed explanation of complex parts with code examples where relevant
- **Interview Angles**: common questions, gotchas, trade-offs
- **Quick Recall**: mnemonics and one-liners to make the ideas stick

## Development Tasks

All tasks run from the project root via `uv run poe`.

### Python CLI

```bash
uv run poe format      # format with ruff
uv run poe lint        # lint with ruff
uv run poe typecheck   # type check with ty
```

### Chrome Extension

```bash
uv run poe ext-format      # format with biome
uv run poe ext-lint        # lint with biome
uv run poe ext-typecheck   # type check with tsc
uv run poe ext-build       # build to extension/dist/
```

Both formatters run automatically on `git commit` via lefthook.
