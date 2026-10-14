import React from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      {/* Language Switcher*/}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "10px 16px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "white",
        }}
      >
        <LanguageSwitcher />
      </div>

      {children}
    </div>
  );
}  