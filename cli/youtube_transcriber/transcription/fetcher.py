import json
import urllib.parse
import urllib.request
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled

from .models import Transcript, TranscriptSegment

OEMBED_URL = "https://www.youtube.com/oembed?url={url}&format=json"


def extract_video_id(url: str) -> str:
    parsed = urlparse(url)

    if parsed.hostname in ("youtu.be",):
        return parsed.path.lstrip("/")

    if parsed.hostname in ("www.youtube.com", "youtube.com", "m.youtube.com"):
        query_params = parse_qs(parsed.query)
        if "v" not in query_params:
            raise ValueError(f"No video ID found in URL: {url}")
        return query_params["v"][0]

    raise ValueError(f"Unrecognised YouTube URL format: {url}")


def fetch_video_title(url: str) -> str:
    request_url = OEMBED_URL.format(url=urllib.parse.quote(url, safe=":/?=&"))
    try:
        with urllib.request.urlopen(request_url, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get("title", "Untitled")
    except Exception:
        return "Untitled"


def fetch_transcript(url: str) -> Transcript:
    video_id = extract_video_id(url)
    title = fetch_video_title(url)

    api = YouTubeTranscriptApi()

    try:
        raw = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
    except NoTranscriptFound:
        transcript_list = api.list(video_id)
        raw = transcript_list.find_generated_transcript(
            [t.language_code for t in transcript_list]
        ).fetch()
    except TranscriptsDisabled as error:
        raise RuntimeError(
            f"Transcripts are disabled for this video: {video_id}"
        ) from error

    segments = [
        TranscriptSegment(
            text=snippet.text, start=snippet.start, duration=snippet.duration
        )
        for snippet in raw
    ]

    return Transcript(video_id=video_id, title=title, segments=segments)
