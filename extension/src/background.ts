import { SYSTEM_PROMPT } from "./lib/prompts";
import type { Message, NotesState } from "./types";

chrome.runtime.onInstalled.addListener(() => {
	chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message: Message, sender) => {
	if (message.type !== "GENERATE_NOTES") return false;

	const tabId = sender.tab?.id;
	if (tabId !== undefined) {
		handleGenerateNotes(message.title, message.transcript, tabId);
	}

	return false;
});

async function handleGenerateNotes(
	title: string,
	transcript: string,
	tabId: number,
): Promise<void> {
	await setNotesState({ status: "loading" });
	await chrome.sidePanel.open({ tabId });

	try {
		const { apiKey } = (await chrome.storage.local.get("apiKey")) as {
			apiKey?: string;
		};

		if (!apiKey) {
			throw new Error(
				"No API key configured. Open the extension options to add your Anthropic API key.",
			);
		}

		const notes = await callClaude(apiKey, title, transcript);
		await setNotesState({ status: "ready", notes, title });
	} catch (error) {
		await setNotesState({ status: "error", error: String(error) });
	}
}

function setNotesState(state: NotesState): Promise<void> {
	return chrome.storage.session.set({ notesState: state });
}

async function callClaude(
	apiKey: string,
	title: string,
	transcript: string,
): Promise<string> {
	const response = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"anthropic-beta": "prompt-caching-2024-07-31",
		},
		body: JSON.stringify({
			model: "claude-sonnet-4-6",
			max_tokens: 4096,
			system: [
				{
					type: "text",
					text: SYSTEM_PROMPT,
					cache_control: { type: "ephemeral" },
				},
			],
			messages: [
				{
					role: "user",
					content: `Video title: ${title}\n\nTranscript:\n\n${transcript}`,
				},
			],
		}),
	});

	if (!response.ok) {
		const errorData = (await response.json()) as {
			error?: { message?: string };
		};
		throw new Error(
			errorData.error?.message ?? `Anthropic API error: ${response.status}`,
		);
	}

	const data = (await response.json()) as {
		content: Array<{ text: string }>;
	};

	const text = data.content[0]?.text;
	if (!text) {
		throw new Error("Empty or unexpected response from Claude API.");
	}

	return text;
}
