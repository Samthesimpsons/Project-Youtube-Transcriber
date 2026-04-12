import { marked } from "marked";
import type { NotesState } from "./types";

function showView(viewId: string): void {
	document.querySelectorAll<HTMLElement>(".view").forEach((el) => {
		el.classList.add("hidden");
	});
	document.getElementById(viewId)?.classList.remove("hidden");
}

function renderState(state: NotesState): void {
	if (state.status === "loading") {
		showView("view-loading");
		return;
	}

	if (state.status === "error") {
		showView("view-error");
		const errorEl = document.getElementById("error-message");
		if (errorEl)
			errorEl.textContent = state.error ?? "An unknown error occurred.";
		return;
	}

	if (state.status === "ready" && state.notes) {
		showView("view-ready");
		const titleEl = document.getElementById("notes-title");
		const contentEl = document.getElementById("notes-content");
		if (titleEl) titleEl.textContent = state.title ?? "";
		if (contentEl) contentEl.innerHTML = marked.parse(state.notes) as string;
		return;
	}

	showView("view-empty");
}

document.getElementById("open-options")?.addEventListener("click", (event) => {
	event.preventDefault();
	chrome.runtime.openOptionsPage();
});

document.getElementById("download-btn")?.addEventListener("click", () => {
	chrome.storage.session.get(
		"notesState",
		(result: { notesState?: NotesState }) => {
			const state = result.notesState;
			if (state?.status !== "ready" || !state.notes) return;

			const blob = new Blob([state.notes], { type: "text/markdown" });
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `${(state.title ?? "notes").replace(/[^\w-]/g, "_")}.md`;
			anchor.click();
			URL.revokeObjectURL(url);
		},
	);
});

// Respond to state changes while the panel is open
chrome.storage.session.onChanged.addListener((changes) => {
	if (changes.notesState) {
		renderState(changes.notesState.newValue as NotesState);
	}
});

// Initial render when panel opens
chrome.storage.session.get(
	"notesState",
	(result: { notesState?: NotesState }) => {
		if (result.notesState) {
			renderState(result.notesState);
		} else {
			showView("view-empty");
		}
	},
);
