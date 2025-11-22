import React, { useState, useCallback, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useZipJsonReader } from '../../hooks/useZipJsonReader';

const Artifacts: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { jsonFiles, setJsonFiles } = useContext(AppContext);
  const { processZip, loading, error } = useZipJsonReader();

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

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prevFiles => [...prevFiles, ...droppedFiles]);

    // Process zip files and merge JSON data
    for (const file of droppedFiles) {
      if (file.name.endsWith('.zip')) {
        const jsonData = await processZip(file);
        // Merge new JSON files with existing ones
        setJsonFiles((prev: Record<string, any>) => ({ ...prev, ...jsonData }));
      }
    }
  }, [processZip, setJsonFiles]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);

      // Process zip files and merge JSON data
      for (const file of selectedFiles) {
        if (file.name.endsWith('.zip')) {
          const jsonData = await processZip(file);
          // Merge new JSON files with existing ones
          setJsonFiles((prev: Record<string, any>) => ({ ...prev, ...jsonData }));
        }
      }
    }
  }, [processZip, setJsonFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const handleClearArtifacts = useCallback(() => {
    setJsonFiles({});
  }, [setJsonFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h2>Artifacts</h2>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Upload and manage your files
      </p>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed #0066cc' : '2px dashed #ccc',
          borderRadius: 8,
          padding: 48,
          textAlign: 'center',
          backgroundColor: isDragging ? '#f0f8ff' : '#f9f9f9',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          marginBottom: 24
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
        <h3 style={{ marginBottom: 8 }}>
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </h3>
        <p style={{ color: '#666', marginBottom: 16 }}>or</p>
        <label
          htmlFor="file-input"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Browse Files
        </label>
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h3>Uploaded Files ({files.length})</h3>
            <button
              onClick={handleClearAll}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 500,
                    marginBottom: 4,
                    wordBreak: 'break-all'
                  }}>
                    {file.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#666',
                    display: 'flex',
                    gap: 16
                  }}>
                    <span>Size: {formatFileSize(file.size)}</span>
                    <span>Type: {file.type || 'Unknown'}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    marginLeft: 16
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && !loading && Object.keys(jsonFiles).length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: '#999',
          backgroundColor: '#f9f9f9',
          borderRadius: 8
        }}>
          No files uploaded yet. Drag and drop or browse to add files.
        </div>
      )}

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: '#0066cc',
          backgroundColor: '#f0f8ff',
          borderRadius: 8,
          marginTop: 24
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <div>Processing ZIP file...</div>
        </div>
      )}

      {error && (
        <div style={{
          textAlign: 'center',
          padding: 24,
          color: '#dc3545',
          backgroundColor: '#ffe5e5',
          borderRadius: 8,
          marginTop: 24,
          border: '1px solid #dc3545'
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 500 }}>{error}</div>
        </div>
      )}

      {Object.keys(jsonFiles).length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h3>Extracted JSON Files ({Object.keys(jsonFiles).length})</h3>
            <button
              onClick={handleClearArtifacts}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Clear Artifacts
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(jsonFiles).map(([path, data]) => (
              <div
                key={path}
                style={{
                  padding: 16,
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{
                  fontWeight: 500,
                  marginBottom: 8,
                  color: '#0066cc',
                  wordBreak: 'break-all'
                }}>
                  {path}
                </div>
                <details>
                  <summary style={{
                    cursor: 'pointer',
                    padding: '4px 0',
                    color: '#666',
                    fontSize: 14
                  }}>
                    View JSON content
                  </summary>
                  <pre style={{
                    backgroundColor: '#f6f8fa',
                    padding: 12,
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 400,
                    fontSize: 12,
                    marginTop: 8
                  }}>
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
