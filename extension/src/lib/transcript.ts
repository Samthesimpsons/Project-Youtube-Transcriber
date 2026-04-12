interface CaptionTrack {
	baseUrl: string;
	languageCode: string;
	kind?: string;
}

interface TranscriptEvent {
	segs?: Array<{ utf8: string }>;
}

interface PlayerResponse {
	videoDetails?: { title: string };
	captions?: {
		playerCaptionsTracklistRenderer?: {
			captionTracks?: CaptionTrack[];
		};
	};
}

export interface TranscriptResult {
	title: string;
	text: string;
}

function readPlayerResponse(): PlayerResponse {
	return (window as unknown as { ytInitialPlayerResponse: PlayerResponse })
		.ytInitialPlayerResponse;
}

function selectBestTrack(tracks: CaptionTrack[]): CaptionTrack | undefined {
	return (
		tracks.find((t) => t.languageCode === "en" && t.kind !== "asr") ??
		tracks.find((t) => t.languageCode === "en") ??
		tracks.find((t) => t.kind !== "asr") ??
		tracks[0]
	);
}

function hasSegments(
	event: TranscriptEvent,
): event is Required<TranscriptEvent> {
	return event.segs != null;
}

function parseEvents(events: TranscriptEvent[]): string {
	return events
		.filter(hasSegments)
		.map((e) => e.segs.map((s) => s.utf8).join(""))
		.join(" ")
		.replace(/\n/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export async function fetchTranscript(): Promise<TranscriptResult> {
	const playerResponse = readPlayerResponse();
	const tracks =
		playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

	if (!tracks?.length) {
		throw new Error("No captions available for this video.");
	}

	const track = selectBestTrack(tracks);
	if (!track) {
		throw new Error("No usable transcript track found.");
	}

	const response = await fetch(`${track.baseUrl}&fmt=json3`);

	if (!response.ok) {
		throw new Error(`Failed to fetch transcript: ${response.statusText}`);
	}

	const data = (await response.json()) as { events: TranscriptEvent[] };

	return {
		title: playerResponse.videoDetails?.title ?? "Untitled",
		text: parseEvents(data.events ?? []),
	};
}
