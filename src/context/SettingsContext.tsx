import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { UserSettings, DEFAULT_SETTINGS } from "../types";

interface SettingsContextType {
	settings: UserSettings;
	updateSettings: (newSettings: Partial<UserSettings>) => void;
	resetSettings: () => void;
	// Theme-specific methods for backward compatibility
	isDarkMode: boolean;
	toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined,
);

const SETTINGS_STORAGE_KEY = "flashlender_user_settings";

interface SettingsProviderProps {
	children: ReactNode;
}

export const SettingsProvider = React.memo<SettingsProviderProps>(
	({ children }) => {
		const [settings, setSettings] = useState<UserSettings>(() => {
			// Load settings from localStorage on initialization
			try {
				const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
				if (stored) {
					const parsed = JSON.parse(stored);
					// Merge with defaults to ensure all fields are present
					return { ...DEFAULT_SETTINGS, ...parsed };
				}
			} catch (error) {
				console.warn("Failed to load settings from localStorage:", error);
			}
			return DEFAULT_SETTINGS;
		});

		// Determine if dark mode should be active based on settings and system preference
		const isDarkMode = React.useMemo(() => {
			if (settings.theme === "dark") return true;
			if (settings.theme === "light") return false;
			// Auto mode: use system preference
			return window.matchMedia("(prefers-color-scheme: dark)").matches;
		}, [settings.theme]);

		// Memoized theme application function
		const applyTheme = React.useCallback((darkMode: boolean) => {
			if (darkMode) {
				document.body.classList.remove("light-theme");
			} else {
				document.body.classList.add("light-theme");
			}
		}, []);

		// Apply theme to document body whenever isDarkMode changes
		useEffect(() => {
			applyTheme(isDarkMode);
		}, [isDarkMode, applyTheme]);

		// Save settings to localStorage whenever they change
		useEffect(() => {
			try {
				localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
			} catch (error) {
				console.warn("Failed to save settings to localStorage:", error);
			}
		}, [settings]);

		const updateSettings = React.useCallback(
			(newSettings: Partial<UserSettings>) => {
				setSettings((prev) => ({ ...prev, ...newSettings }));
			},
			[],
		);

		const resetSettings = React.useCallback(() => {
			setSettings(DEFAULT_SETTINGS);
		}, []);

		const toggleTheme = React.useCallback(() => {
			const currentTheme = settings.theme || "auto";
			let newTheme: "light" | "dark" | "auto";

			// Cycle through: auto -> light -> dark -> auto
			if (currentTheme === "auto") {
				newTheme = "light";
			} else if (currentTheme === "light") {
				newTheme = "dark";
			} else {
				newTheme = "auto";
			}

			updateSettings({ theme: newTheme });
		}, [settings.theme, updateSettings]);

		const value = React.useMemo(
			() => ({
				settings,
				updateSettings,
				resetSettings,
				isDarkMode,
				toggleTheme,
			}),
			[settings, updateSettings, resetSettings, isDarkMode, toggleTheme],
		);

		return (
			<SettingsContext.Provider value={value}>
				{children}
			</SettingsContext.Provider>
		);
	},
);

SettingsProvider.displayName = "SettingsProvider";

export function useSettings(): SettingsContextType {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}

// Backward compatibility for theme functionality
export function useTheme(): { isDarkMode: boolean; toggleTheme: () => void } {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a SettingsProvider");
	}
	return {
		isDarkMode: context.isDarkMode,
		toggleTheme: context.toggleTheme,
	};
}
