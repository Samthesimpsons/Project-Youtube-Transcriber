export interface NotesState {
	status: "loading" | "ready" | "error";
	notes?: string;
	title?: string;
	error?: string;
}

export type Message = {
	type: "GENERATE_NOTES";
	title: string;
	transcript: string;
};
