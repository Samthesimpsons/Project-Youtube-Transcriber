import { fetchTranscript } from "./lib/transcript";
import type { Message } from "./types";

const BUTTON_ID = "yt-notes-generate-btn";

function createButton(): HTMLButtonElement {
	const button = document.createElement("button");
	button.id = BUTTON_ID;
	button.className = "ytp-button yt-notes-btn";
	button.title = "Generate study notes";
	button.innerHTML = `
    <svg height="100%" viewBox="0 0 24 24" width="100%" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM6 20V4h5v7h7v9H6zm2-5h8v2H8zm0-4h4v2H8z"/>
    </svg>
  `;
	return button;
}

function injectButton(): void {
	if (document.getElementById(BUTTON_ID)) return;

	const controls = document.querySelector(".ytp-right-controls");
	if (!controls) return;

	const button = createButton();

	button.addEventListener("click", async () => {
		button.disabled = true;
		button.style.opacity = "0.4";

		try {
			const { title, text } = await fetchTranscript();
			chrome.runtime.sendMessage({
				type: "GENERATE_NOTES",
				title,
				transcript: text,
			} satisfies Message);
		} catch (error) {
			alert(`YouTube Notes: ${String(error)}`);
		} finally {
			button.disabled = false;
			button.style.opacity = "";
		}
	});

	controls.prepend(button);
}

// YouTube is a SPA — re-inject button after navigations
const observer = new MutationObserver(() => injectButton());
observer.observe(document.body, { childList: true, subtree: true });

injectButton();
