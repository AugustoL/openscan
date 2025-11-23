const STORAGE_KEY = "OPENSCAN_ARTIFACTS_JSON_V1";

type JsonFilesMap = Record<string, any>;

/**
 * Validates that the object is a valid JSON files map
 */
function isValidJsonFilesMap(obj: any): obj is JsonFilesMap {
	if (!obj || typeof obj !== "object") return false;
	// Basic validation - ensure all keys are strings
	for (const k of Object.keys(obj)) {
		if (typeof k !== "string") return false;
	}
	return true;
}

/**
 * Load JSON files from localStorage. Returns empty object if nothing found or invalid.
 */
export function loadJsonFilesFromStorage(): JsonFilesMap {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		if (!isValidJsonFilesMap(parsed)) return {};
		return parsed;
	} catch (err) {
		console.warn("Failed to parse JSON files from storage", err);
		return {};
	}
}

/**
 * Save JSON files to localStorage
 */
export function saveJsonFilesToStorage(jsonFiles: JsonFilesMap): void {
	try {
		const raw = localStorage.getItem(STORAGE_KEY) || "{}";
		const parsed = JSON.parse(raw);

		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...parsed, ...jsonFiles }),
		);
	} catch (err) {
		console.warn("Failed to save JSON files to storage", err);
		// Handle quota exceeded errors
		if (err instanceof Error && err.name === "QuotaExceededError") {
			console.error(
				"LocalStorage quota exceeded. Consider clearing old artifacts.",
			);
		}
	}
}

/**
 * Clear all JSON files from localStorage
 */
export function clearJsonFilesFromStorage(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (err) {
		console.warn("Failed to clear JSON files from storage", err);
	}
}

export { STORAGE_KEY };
