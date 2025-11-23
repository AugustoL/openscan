import { useNotifications } from "../context/NotificationContext";

export const useNotify = () => {
	const { addNotification } = useNotifications();

	const notify = {
		success: (message: string, duration?: number) =>
			addNotification(message, "success", duration),
		warning: (message: string, duration?: number) =>
			addNotification(message, "warning", duration),
		error: (message: string, duration?: number) =>
			addNotification(message, "error", duration),
	};

	return notify;
};
