import { useState } from "react";

/**
 * Shared modal management hook
 * Consolidates modal state management across components
 */
export const useModalManager = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [transactionLoading, setIsTransactionLoading] = useState(false);

	// Main modal handlers
	const openModal = () => {
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setIsTransactionLoading(false);
	};

	return {
		// State
		isModalOpen,

		// Actions
		openModal,
		closeModal,
	};
};
