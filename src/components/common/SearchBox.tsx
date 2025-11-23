import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SearchBox = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const navigate = useNavigate();
	const location = useLocation();

	// Extract chainId from the pathname (e.g., /1/blocks -> 1)
	const pathSegments = location.pathname.split("/").filter(Boolean);
	const chainId =
		pathSegments[0] && !isNaN(Number(pathSegments[0]))
			? pathSegments[0]
			: undefined;

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchTerm.trim()) return;

		// Basic routing logic placeholder
		// In a real app, we would detect the type of input (address, tx, block)
		// For now, we'll just log it or maybe navigate to a search result page if it existed.
		// Since the user just asked for the UI, we'll keep the logic minimal but functional enough to show interaction.
		console.log("Searching for:", searchTerm);

		// Example logic:
		if (searchTerm.startsWith("0x")) {
			if (searchTerm.length === 42) {
				navigate(`/${chainId}/address/${searchTerm}`);
			} else if (searchTerm.length === 66) {
				navigate(`/${chainId}/tx/${searchTerm}`);
			}
		} else if (!isNaN(Number(searchTerm))) {
			navigate(`/${chainId}/block/${searchTerm}`);
		}
	};

	return (
		<div className="search-box-container">
			<form onSubmit={handleSearch} className="search-form">
				<input
					type="text"
					className="search-input"
					placeholder="Search by Address / Txn Hash / Block / Token"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<button type="submit" className="search-button">
					Scan
				</button>
			</form>
		</div>
	);
};

export default SearchBox;
