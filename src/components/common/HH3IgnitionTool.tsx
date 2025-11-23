import React, { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { useZipJsonReader } from "../../hooks/useZipJsonReader";

const Artifacts: React.FC = () => {
	const [files, setFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const { jsonFiles, setJsonFiles } = useContext(AppContext);
	const { processZip, loading, error } = useZipJsonReader();
	const navigate = useNavigate();

	const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const droppedFiles = Array.from(e.dataTransfer.files);
			setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);

			// Process zip files and merge JSON data
			for (const file of droppedFiles) {
				if (file.name.endsWith(".zip")) {
					const jsonData = await processZip(file);
					// Merge new JSON files with existing ones
					setJsonFiles((prev: Record<string, any>) => ({
						...prev,
						...jsonData,
					}));
				}
			}
		},
		[processZip, setJsonFiles],
	);

	const handleFileInput = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				const selectedFiles = Array.from(e.target.files);
				setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

				// Process zip files and merge JSON data
				for (const file of selectedFiles) {
					if (file.name.endsWith(".zip")) {
						const jsonData = await processZip(file);
						// Merge new JSON files with existing ones
						setJsonFiles(jsonData);
					}
				}
			}
		},
		[processZip, setJsonFiles],
	);

	const handleRemoveFile = useCallback((index: number) => {
		setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
	}, []);

	const handleClearAll = useCallback(() => {
		setFiles([]);
	}, []);

	const handleClearArtifacts = useCallback(() => {
		setJsonFiles({});
	}, [setJsonFiles]);

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	return (
		<div
			className="info-box"
			style={{
				background: "#ffffff",
				borderRadius: "16px",
				padding: "24px",
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
				border: "1px solid rgba(16, 185, 129, 0.1)",
				display: "block",
			}}
		>
			<h3
				style={{
					fontSize: "1.1rem",
					fontWeight: "700",
					color: "#10b981",
					marginBottom: "8px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
					marginTop: 0,
				}}
			>
				🚀 Hardhat Ignition
			</h3>
			<p
				style={{
					marginBottom: 20,
					color: "#6b7280",
					fontSize: "1rem",
					marginTop: 0,
				}}
			>
				Provide a .zip file with the project’s <b>contracts/</b> and{" "}
				<b>ignition/</b> directories inside. This will be used as local
				verification method
			</p>

			<div
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				style={{
					border: isDragging
						? "2px dashed #10b981"
						: "2px dashed rgba(16, 185, 129, 0.3)",
					borderRadius: 12,
					padding: 40,
					textAlign: "center",
					backgroundColor: isDragging
						? "rgba(16, 185, 129, 0.05)"
						: "rgba(16, 185, 129, 0.02)",
					transition: "all 0.3s ease",
					cursor: "pointer",
					marginBottom: 20,
				}}
			>
				<div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
				<h4
					style={{
						marginBottom: 8,
						marginTop: 0,
						fontSize: "0.95rem",
						fontWeight: "600",
						color: "#1f2937",
					}}
				>
					{isDragging ? "Drop files here" : "Drag and drop ZIP files here"}
				</h4>
				<p
					style={{
						color: "#6b7280",
						marginBottom: 16,
						fontSize: "0.85rem",
						margin: "0 0 16px 0",
					}}
				>
					or
				</p>
				<label
					htmlFor="file-input"
					style={{
						display: "inline-block",
						padding: "10px 20px",
						background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
						color: "white",
						borderRadius: 8,
						cursor: "pointer",
						fontSize: "0.85rem",
						fontWeight: "600",
						border: "none",
					}}
				>
					Browse Files
				</label>
				<input
					id="file-input"
					type="file"
					multiple
					onChange={handleFileInput}
					style={{ display: "none" }}
				/>
			</div>

			{files.length > 0 && (
				<div>
					<div className="flex-between mb-medium">
						<h4
							style={{
								margin: 0,
								fontSize: "0.95rem",
								fontWeight: "600",
								color: "#1f2937",
							}}
						>
							Uploaded Files ({files.length})
						</h4>
						<button
							onClick={handleClearAll}
							style={{
								padding: "6px 12px",
								background: "#ef4444",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: "0.8rem",
								fontWeight: "600",
							}}
						>
							Clear All
						</button>
					</div>

					<div className="flex-column" style={{ gap: 12 }}>
						{files.map((file, index) => (
							<div
								key={`${file.name}-${index}`}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: 12,
									backgroundColor: "rgba(16, 185, 129, 0.02)",
									border: "1px solid rgba(16, 185, 129, 0.15)",
									borderRadius: 8,
									boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
								}}
							>
								<div style={{ flex: 1 }}>
									<div
										style={{
											fontWeight: 600,
											marginBottom: 4,
											wordBreak: "break-all",
											fontSize: "0.85rem",
											color: "#1f2937",
										}}
									>
										{file.name}
									</div>
									<div
										style={{
											fontSize: "0.75rem",
											color: "#6b7280",
											display: "flex",
											gap: 16,
										}}
									>
										<span>Size: {formatFileSize(file.size)}</span>
										<span>Type: {file.type || "Unknown"}</span>
									</div>
								</div>
								<button
									onClick={() => handleRemoveFile(index)}
									style={{
										padding: "6px 12px",
										background: "#ef4444",
										color: "white",
										border: "none",
										borderRadius: 6,
										cursor: "pointer",
										fontSize: "0.75rem",
										marginLeft: 16,
										fontWeight: "600",
									}}
								>
									Remove
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{files.length === 0 &&
				!loading &&
				Object.keys(jsonFiles).length === 0 && (
					<div
						style={{
							textAlign: "center",
							padding: 32,
							color: "#6b7280",
							backgroundColor: "rgba(16, 185, 129, 0.02)",
							borderRadius: 8,
							fontSize: "0.85rem",
						}}
					>
						No files uploaded yet. Drag and drop or browse to add files.
					</div>
				)}

			{loading && (
				<div
					style={{
						textAlign: "center",
						padding: 32,
						color: "#10b981",
						backgroundColor: "rgba(16, 185, 129, 0.05)",
						borderRadius: 8,
						marginTop: 20,
						border: "1px solid rgba(16, 185, 129, 0.2)",
					}}
				>
					<div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
					<div style={{ fontSize: "0.9rem", fontWeight: "600" }}>
						Processing ZIP file...
					</div>
				</div>
			)}

			{error && (
				<div
					style={{
						textAlign: "center",
						padding: 20,
						color: "#dc2626",
						backgroundColor: "rgba(239, 68, 68, 0.05)",
						borderRadius: 8,
						marginTop: 20,
						border: "1px solid rgba(239, 68, 68, 0.2)",
					}}
				>
					<div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
					<div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{error}</div>
				</div>
			)}

			{Object.keys(jsonFiles).length > 0 && (
				<div className="mt-large">
					<div className="flex-between mb-medium">
						<h4
							style={{
								margin: 0,
								fontSize: "0.95rem",
								fontWeight: "600",
								color: "#1f2937",
							}}
						>
							Extracted JSON Files ({Object.keys(jsonFiles).length})
						</h4>
						<button
							onClick={handleClearArtifacts}
							style={{
								padding: "6px 12px",
								background: "#ef4444",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: "0.8rem",
								fontWeight: "600",
							}}
						>
							Clear Artifacts
						</button>
					</div>
					<div className="flex-column" style={{ gap: 10 }}>
						{Object.entries(jsonFiles).map(([path, data]) => (
							<div
								key={path}
								style={{
									padding: 12,
									backgroundColor: "rgba(16, 185, 129, 0.02)",
									border: "1px solid rgba(16, 185, 129, 0.15)",
									borderRadius: 8,
									boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
								}}
							>
								<div
									onClick={() => navigate(`/31337/address/${path}`)}
									style={{
										fontWeight: 600,
										marginBottom: 8,
										color: "#10b981",
										wordBreak: "break-all",
										fontSize: "0.85rem",
										cursor: "pointer",
										textDecoration: "underline",
									}}
								>
									{path}
								</div>
								<details>
									<summary
										style={{
											cursor: "pointer",
											padding: "4px 0",
											color: "#6b7280",
											fontSize: "0.8rem",
											fontWeight: "600",
										}}
									>
										View JSON content
									</summary>
									<pre
										style={{
											backgroundColor: "rgba(16, 185, 129, 0.04)",
											padding: 12,
											borderRadius: 8,
											overflow: "auto",
											maxHeight: 400,
											fontSize: "0.75rem",
											marginTop: 8,
											border: "1px solid rgba(16, 185, 129, 0.1)",
											color: "#1f2937",
											fontFamily: "monospace",
											lineHeight: "1.5",
										}}
									>
										{JSON.stringify(data, null, 2)}
									</pre>
								</details>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default Artifacts;
