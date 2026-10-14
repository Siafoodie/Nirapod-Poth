import { useLanguage } from "../context/LanguageContext";

function LanguageSwitcher() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        border: "1.5px solid #7B5CFF",
        color: "#7B5CFF",
        background: "white",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      {lang === "en" ? "বাংলা" : "English"}
    </button>
  );
}

export default LanguageSwitcher; 