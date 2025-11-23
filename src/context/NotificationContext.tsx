import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useCallback,
	useMemo,
} from "react";
import {
	Notification,
	NotificationContextType,
	NotificationProviderProps,
} from "../types";

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined,
);

export const useNotifications = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error(
			"useNotifications must be used within a NotificationProvider",
		);
	}
	return context;
};

export const NotificationProvider: React.FC<NotificationProviderProps> =
	React.memo(({ children }) => {
		const [notifications, setNotifications] = useState<Notification[]>([]);

		const addNotification = useCallback(
			(message: string, type: Notification["type"], duration = 5000) => {
				const id = Math.random().toString(36).substr(2, 9);
				const notification: Notification = { id, message, type, duration };

				setNotifications((prev) => [...prev, notification]);

				// Auto-remove notification after duration (if specified)
				if (duration > 0) {
					setTimeout(() => {
						removeNotification(id);
					}, duration);
				}
			},
			[],
		);

		const removeNotification = useCallback((id: string) => {
			setNotifications((prev) =>
				prev.filter((notification) => notification.id !== id),
			);
		}, []);

		const clearAllNotifications = useCallback(() => {
			setNotifications([]);
		}, []);

		const value = useMemo(
			() => ({
				notifications,
				addNotification,
				removeNotification,
				clearAllNotifications,
			}),
			[
				notifications,
				addNotification,
				removeNotification,
				clearAllNotifications,
			],
		);

		return (
			<NotificationContext.Provider value={value}>
				{children}
			</NotificationContext.Provider>
		);
	});

NotificationProvider.displayName = "NotificationProvider";
