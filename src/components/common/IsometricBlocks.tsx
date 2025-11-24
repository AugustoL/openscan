import React, { useState, useEffect, useCallback, useMemo } from "react";

// Network colors matching the logo - Ethereum weighted more heavily
const NETWORKS = [
	{ color: "#627EEA", weight: 70 }, // Ethereum - most common
	{ color: "#FFF100", weight: 6 }, // Hardhat/Local
	{ color: "#28A0F0", weight: 6 }, // Arbitrum
	{ color: "#FF0420", weight: 6 }, // Optimism
	{ color: "#0052FF", weight: 6 }, // Base
	{ color: "#CFB4FF", weight: 6 }, // Sepolia
];

// Create weighted array for random selection
const WEIGHTED_COLORS = NETWORKS.flatMap((n) =>
	Array(n.weight).fill(n.color),
);

interface CubeData {
	id: number;
	x: number;
	y: number;
	color: string;
	opacity: number;
}

interface IsometricCubeProps {
	x: number;
	y: number;
	size: number;
	color: string;
	opacity: number;
}

const IsometricCube: React.FC<IsometricCubeProps> = ({
	x,
	y,
	size,
	color,
	opacity,
}) => {
	// Isometric cube dimensions
	const h = size * 0.5; // height offset for 3D effect

	// Top face (brightest)
	const topPoints = `${x},${y - h} ${x + size},${y} ${x},${y + h} ${x - size},${y}`;

	// Left face (medium)
	const leftPoints = `${x - size},${y} ${x},${y + h} ${x},${y + h + size} ${x - size},${y + size}`;

	// Right face (darkest)
	const rightPoints = `${x},${y + h} ${x + size},${y} ${x + size},${y + size} ${x},${y + h + size}`;

	return (
		<g opacity={opacity}>
			{/* Right face - darkest */}
			<polygon
				points={rightPoints}
				fill={color}
				opacity={0.6}
				stroke={color}
				strokeWidth={0.5}
			/>
			{/* Left face - medium */}
			<polygon
				points={leftPoints}
				fill={color}
				opacity={0.8}
				stroke={color}
				strokeWidth={0.5}
			/>
			{/* Top face - brightest */}
			<polygon
				points={topPoints}
				fill={color}
				opacity={1}
				stroke={color}
				strokeWidth={0.5}
			/>
		</g>
	);
};

interface IsometricBlocksProps {
	width: number;
	height: number;
	cubeSize?: number;
	maxCubes?: number;
	spawnInterval?: number;
}

export const IsometricBlocks: React.FC<IsometricBlocksProps> = ({
	width,
	height,
	cubeSize = 24,
	maxCubes = 100,
	spawnInterval = 150,
}) => {
	const [cubes, setCubes] = useState<CubeData[]>([]);
	const [nextId, setNextId] = useState(0);

	// Calculate grid positions for isometric layout
	const gridPositions = useMemo(() => {
		const positions: { x: number; y: number }[] = [];
		const stepX = cubeSize * 2;
		const stepY = cubeSize * 1.5;

		for (let row = -2; row < height / stepY + 2; row++) {
			const offsetX = (row % 2) * cubeSize;
			for (let col = -2; col < width / stepX + 2; col++) {
				positions.push({
					x: col * stepX + offsetX + cubeSize,
					y: row * stepY + cubeSize,
				});
			}
		}
		return positions;
	}, [width, height, cubeSize]);

	// Spawn new cubes periodically
	const spawnCube = useCallback(() => {
		const pos = gridPositions[Math.floor(Math.random() * gridPositions.length)];
		if (!pos) return;
		const network = WEIGHTED_COLORS[Math.floor(Math.random() * WEIGHTED_COLORS.length)];
		if (!network) return;

		const newCube: CubeData = {
			id: nextId,
			x: pos.x,
			y: pos.y,
			color: network,
			opacity: 0,
		};

		setCubes((prev) => {
			const updated = [...prev, newCube];
			// Remove oldest cubes if we exceed max
			if (updated.length > maxCubes) {
				return updated.slice(-maxCubes);
			}
			return updated;
		});
		setNextId((prev) => prev + 1);
	}, [gridPositions, nextId, maxCubes]);

	// Fade in animation
	useEffect(() => {
		const fadeInterval = setInterval(() => {
			setCubes((prev) =>
				prev.map((cube) => ({
					...cube,
					opacity: Math.min(cube.opacity + 0.1, 0.7),
				})),
			);
		}, 50);

		return () => clearInterval(fadeInterval);
	}, []);

	// Spawn cubes periodically
	useEffect(() => {
		const spawn = setInterval(spawnCube, spawnInterval);
		return () => clearInterval(spawn);
	}, [spawnCube, spawnInterval]);

	return (
		<svg
			width={width}
			height={height}
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				pointerEvents: "none",
			}}
		>
			{cubes.map((cube) => (
				<IsometricCube
					key={cube.id}
					x={cube.x}
					y={cube.y}
					size={cubeSize}
					color={cube.color}
					opacity={cube.opacity}
				/>
			))}
		</svg>
	);
};

export default IsometricBlocks;