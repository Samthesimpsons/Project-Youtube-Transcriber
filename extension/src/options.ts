const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const toggleButton = document.getElementById(
	"toggle-visibility",
) as HTMLButtonElement;
const iconShow = document.getElementById("icon-show") as unknown as SVGElement;
const iconHide = document.getElementById("icon-hide") as unknown as SVGElement;
const saveButton = document.getElementById("save-btn") as HTMLButtonElement;
const statusMessage = document.getElementById("status-message") as HTMLElement;

chrome.storage.local.get("apiKey", (result: { apiKey?: string }) => {
	if (result.apiKey) {
		apiKeyInput.value = result.apiKey;
	}
});

toggleButton.addEventListener("click", () => {
	const isPassword = apiKeyInput.type === "password";
	apiKeyInput.type = isPassword ? "text" : "password";
	iconShow.classList.toggle("hidden", isPassword);
	iconHide.classList.toggle("hidden", !isPassword);
});

saveButton.addEventListener("click", async () => {
	const key = apiKeyInput.value.trim();

	if (!key) {
		showStatus("Please enter an API key.", "error");
		return;
	}

	await chrome.storage.local.set({ apiKey: key });
	showStatus("Saved.", "success");
});

function showStatus(message: string, type: "success" | "error"): void {
	statusMessage.textContent = message;
	statusMessage.className = type;
	statusMessage.classList.remove("hidden");
	setTimeout(() => statusMessage.classList.add("hidden"), 3000);
}
