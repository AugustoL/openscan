import type React from "react";
import { useMemo, useState } from "react";
import { ENVIRONMENT } from "../../utils/constants";

interface VersionWarningIconProps {
  readonly className?: string;
}

// Constants outside component to avoid recreating
const TOOLTIP_TEXT = "This is not a production verified version";
const ICON_COLORS = {
  development: "#ef4444",
  staging: "#f59e0b",
  default: "#6b7280",
} as const;

const VersionWarningIcon: React.FC<VersionWarningIconProps> = ({ className = "" }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Memoize color calculation
  const iconColor = useMemo(() => {
    return ICON_COLORS[ENVIRONMENT as keyof typeof ICON_COLORS] || ICON_COLORS.default;
  }, []);

  if (ENVIRONMENT === "production") {
    return null;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: <TODO>
    <div
      className={`version-warning-icon ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/** biome-ignore lint/a11y/noSvgWithoutTitle: <TODO> */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 9v3m0 3h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showTooltip && <div className="version-warning-tooltip">{TOOLTIP_TEXT}</div>}
    </div>
  );
};

export default VersionWarningIcon;
