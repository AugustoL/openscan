import { Link, useNavigate, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

const Navbar = () => {
	const { address } = useAccount();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchInput, setSearchInput] = useState("");

	// Extract chainId from the pathname (e.g., /1/blocks -> 1)
	const pathSegments = location.pathname.split("/").filter(Boolean);
	const chainId =
		pathSegments[0] && !isNaN(Number(pathSegments[0]))
			? pathSegments[0]
			: undefined;

	// Check if we should show the search box (on blocks, block, txs, tx pages)
	const shouldShowSearch =
		chainId &&
		pathSegments.length >= 2 &&
		pathSegments[1] &&
		["blocks", "block", "txs", "tx"].includes(pathSegments[1]);

	console.log(
		"Navbar chainId from URL:",
		chainId,
		"pathname:",
		location.pathname,
	);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchInput.trim() || !chainId) return;

		const input = searchInput.trim();

		// Check if it's a transaction hash (0x followed by 64 hex chars)
		if (/^0x[a-fA-F0-9]{64}$/.test(input)) {
			navigate(`/${chainId}/tx/${input}`);
		}
		// Check if it's an address (0x followed by 40 hex chars)
		else if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
			navigate(`/${chainId}/address/${input}`);
		}
		// Check if it's a block number
		else if (/^\d+$/.test(input)) {
			navigate(`/${chainId}/block/${input}`);
		}
		// Check if it's a block hash (0x followed by 64 hex chars - same as tx)
		else if (/^0x[a-fA-F0-9]{64}$/.test(input)) {
			navigate(`/${chainId}/block/${input}`);
		}

		setSearchInput("");
	};

	const goToSettings = () => {
		navigate("/settings");
	};

	return (
		<nav className="navbar">
			<div className="navbar-inner">
				<ul>
					<li>
						<Link to="/">Home</Link>
					</li>
					{chainId && (
						<>
							<li>
								<Link to={`/${chainId}/blocks`}>BLOCKS</Link>
							</li>
							<li>
								<Link to={`/${chainId}/txs`}>TRANSACTIONS</Link>
							</li>
						</>
					)}
				</ul>

				{/* Search Box */}
				{shouldShowSearch && (
					<div className="search-container">
						<form onSubmit={handleSearch} className="search-form">
							<input
								type="text"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder="Search by Address / Tx Hash / Block"
								className="search-input"
							/>
							<button
								type="submit"
								className="search-button"
								aria-label="Search"
								title="Search"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<circle
										cx="11"
										cy="11"
										r="8"
										stroke="currentColor"
										strokeWidth="2"
									/>
									<path
										d="M21 21l-4.35-4.35"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
									/>
								</svg>
							</button>
						</form>
					</div>
				)}

				<ul>
					<li>
						<Link to={`/devtools`}>DEV TOOLs</Link>
					</li>
					<li>
						<button
							onClick={() => navigate("/about")}
							className="navbar-toggle-btn"
							aria-label="About"
							title="About"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="2"
								/>
								<path
									d="M12 16v-4"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M12 8h.01"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
					</li>
					<li>
						<button
							onClick={() => goToSettings()}
							className="navbar-toggle-btn"
							aria-label="Settings"
							title="Settings"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="12"
									cy="12"
									r="3"
									stroke="currentColor"
									strokeWidth="2"
								/>
								<path
									d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
									stroke="currentColor"
									strokeWidth="2"
								/>
							</svg>
						</button>
					</li>
					{/* <li>
            <ConnectButton
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </li> */}
				</ul>
			</div>
		</nav>
	);
};

export default Navbar;
