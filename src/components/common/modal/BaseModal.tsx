import React, { ReactNode } from "react";
import "../../../styles/styles.css";

export interface BaseModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	isLoading?: boolean;
	size?: "sm" | "md" | "lg";
	closeOnOverlayClick?: boolean;
}

export default function BaseModal({
	isOpen,
	onClose,
	title,
	children,
	isLoading = false,
	size = "md",
	closeOnOverlayClick = true,
}: BaseModalProps) {
	if (!isOpen) return null;

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (closeOnOverlayClick && !isLoading) {
			onClose();
		}
	};

	const handleContentClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	const getSizeClass = () => {
		switch (size) {
			case "sm":
				return "modal-sm";
			case "lg":
				return "modal-lg";
			default:
				return "";
		}
	};

	return (
		<div className="modal-overlay" onClick={handleOverlayClick}>
			<div className={`modal ${getSizeClass()}`} onClick={handleContentClick}>
				<div className="modal-header">
					<h3 className="modal-title">{title}</h3>
					<button
						className="modal-close"
						onClick={onClose}
						disabled={isLoading}
						aria-label="Close modal"
					>
						×
					</button>
				</div>

				<div className="modal-body">{children}</div>
			</div>
		</div>
	);
}
