import React, { useState } from "react";

interface LongStringProps {
	value: string;
	start?: number;
	end?: number;
	style?: React.CSSProperties;
}

const LongString: React.FC<LongStringProps> = ({
	value,
	start = 10,
	end = 8,
	style = {},
}) => {
	const [isHovered, setIsHovered] = useState(false);

	const truncate = (str: string) => {
		if (!str) return "";
		if (str.length <= start + end) return str;
		return `${str.slice(0, start)}...${str.slice(-end)}`;
	};

	const shouldTruncate = value && value.length > start + end;

	return (
		<span
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				wordBreak: isHovered && shouldTruncate ? "break-all" : "normal",
				transition: "all 0.2s ease",
				cursor: shouldTruncate ? "pointer" : "default",
				...style,
			}}
			title={shouldTruncate ? value : undefined}
		>
			{isHovered && shouldTruncate ? value : truncate(value)}
		</span>
	);
};

export default LongString;
