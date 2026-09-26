import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

export function Row({ children, className = "", icon, onClick, ...props }) {
  return (
    <div
      className={`row ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      {...props}
    >
      {icon}
      {children}
    </div>
  );
}

export function Button({ children, className = "", ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
}