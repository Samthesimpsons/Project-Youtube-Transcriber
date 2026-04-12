from pydantic import BaseModel, computed_field


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class Transcript(BaseModel):
    video_id: str
    title: str
    segments: list[TranscriptSegment]

    @computed_field
    @property
    def full_text(self) -> str:
        return " ".join(segment.text for segment in self.segments)

    @computed_field
    @property
    def word_count(self) -> int:
        return len(self.full_text.split())
