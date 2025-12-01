import React from "react";

interface LoaderProps {
  size?: number;
  color?: string;
  text?: string;
}

const Loader: React.FC<LoaderProps> = React.memo(({ size = 40, color = "#10b981", text }) => {
  return (
    <div className="loader-container">
      <div
        className="loader-spinner"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `3px solid rgba(16, 185, 129, 0.2)`,
          borderTop: `3px solid ${color}`,
        }}
      />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
});

Loader.displayName = "Loader";

export default Loader;
