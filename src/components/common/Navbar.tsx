import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NetworkBlockIndicator } from "./NetworkBlockIndicator";
import VersionWarningIcon from "./VersionWarningIcon";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchInput, setSearchInput] = useState("");

  // Extract chainId from the pathname (e.g., /1/blocks -> 1)
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const chainId =
    pathSegments[0] && !Number.isNaN(Number(pathSegments[0])) ? pathSegments[0] : undefined;

  // Check if we should show the search box (on blocks, block, txs, tx pages)
  const shouldShowSearch =
    chainId &&
    pathSegments.length >= 2 &&
    pathSegments[1] &&
    ["blocks", "block", "txs", "tx", "address"].includes(pathSegments[1]);

  console.log("Navbar chainId from URL:", chainId, "pathname:", location.pathname);

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
    // biome-ignore lint/suspicious/noDuplicateElseIf: <TODO>
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
            <Link to="/" className="home-cube-link" title="Home">
              {/** biome-ignore lint/a11y/noSvgWithoutTitle: <TODO> */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Top face - brightest */}
                <polygon points="20,6 34,14 20,22 6,14" fill="#067455ff" />
                {/* Left face - medium */}
                <polygon points="6,14 20,22 20,36 6,28" fill="#07634aff" />
                {/* Right face - darkest */}
                <polygon points="20,22 34,14 34,28 20,36" fill="#065743ff" />
              </svg>
            </Link>
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
              <button type="submit" className="search-button" aria-label="Search" title="Search">
                {/** biome-ignore lint/a11y/noSvgWithoutTitle: <TODO> */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
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

        <div className="navbar-right">
          <NetworkBlockIndicator />
          <VersionWarningIcon />
          <ul>
            <li>
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                onClick={() => navigate("/devtools")}
                className="navbar-toggle-btn"
                aria-label="Dev Tools"
                title="Dev Tools"
              >
                {/** biome-ignore lint/a11y/noSvgWithoutTitle: <TODO> */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
            <li>
              {/* biome-ignore lint/a11y/useButtonType: nav buttons don't submit forms */}
              <button
                onClick={() => navigate("/subscriptions")}
                className="navbar-toggle-btn"
                aria-label="Subscriptions"
                title="Subscriptions"
              >
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: aria-label on button provides accessible name */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
            <li>
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                onClick={() => navigate("/about")}
                className="navbar-toggle-btn"
                aria-label="About"
                title="About"
              >
                {/** biome-ignore lint/a11y/noSvgWithoutTitle: <TODO> */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
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
              {/** biome-ignore lint/a11y/useButtonType: <TODO> */}
              <button
                onClick={() => goToSettings()}
                className="navbar-toggle-btn"
                aria-label="Settings"
                title="Settings"
              >
                {/** biome-ignore lint/a11y/noSvgWithoutTitle: <TODO> */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
