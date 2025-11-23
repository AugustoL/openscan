import React from "react";
import { useNotifications } from "../../context/NotificationContext";

const NotificationDisplay: React.FC = React.memo(() => {
	const { notifications, removeNotification } = useNotifications();

	if (notifications.length === 0) {
		return null;
	}

	return (
		<div className="notification-container">
			{notifications.map((notification) => (
				<div
					key={notification.id}
					className={`notification notification--${notification.type}`}
				>
					<div className="notification__content">
						<span className="notification__message">
							{notification.message}
						</span>
						<button
							className="notification__close"
							onClick={() => removeNotification(notification.id)}
							aria-label="Close notification"
						>
							×
						</button>
					</div>
				</div>
			))}
		</div>
	);
});

NotificationDisplay.displayName = "NotificationDisplay";

export default NotificationDisplay;
