import type React from "react";
import { ENVIRONMENT } from "../../utils/constants";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  // Get commit hash from environment variable, fallback to 'development'
  const commitHash = process.env.REACT_APP_COMMIT_HASH || "development";

  // Format commit hash - show first 7 characters if it's a full hash
  const formattedCommitHash = commitHash.length > 7 ? commitHash.substring(0, 7) : commitHash;

  // Get version from environment variable or fallback
  const appVersion = process.env.REACT_APP_VERSION || "0.1.0";

  // Get the GitHub repository URL from package.json or environment
  const repoUrl =
    process.env.REACT_APP_GITHUB_REPO || "https://github.com/openscan-explorer/explorer";

  // Determine footer version class based on environment
  const getVersionClass = () => {
    if (ENVIRONMENT === "staging") return "footer-version-staging";
    if (ENVIRONMENT === "development") return "footer-version-development";
    return "";
  };
  return (
    <footer className={`app-footer ${className}`}>
      <div className="footer-content">
        <div className="footer-left">
          <a href="/subscriptions" className="footer-link">
            Subscribe
          </a>
        </div>
        <div className={`footer-version ${getVersionClass()}`}>
          <span className="version-label">Version:</span>
          <a
            href={`${repoUrl}/commit/${commitHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="commit-link"
            title={`View commit ${formattedCommitHash} on GitHub`}
          >
            {appVersion} {formattedCommitHash}
          </a>
          {ENVIRONMENT !== "production" && (
            <span className="commit-link environment-tag">{ENVIRONMENT}</span>
          )}
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="github-btn-footer"
            title="View on GitHub"
          >
            {/** biome-ignore lint/a11y/noSvgWithoutTitle: <TODO> */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
