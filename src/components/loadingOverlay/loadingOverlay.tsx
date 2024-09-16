import React from "react";
import "./LoadingOverlay.css";

const LoadingOverlay = ({ message = "Loading..." }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
      <div className="loading-text">{message}</div>
    </div>
  );
};

export default LoadingOverlay;
