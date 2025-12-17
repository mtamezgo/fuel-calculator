import { useLanguage, type Language } from "~/lib/i18n/context";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => handleChange("en")}
        className={`px-2 py-1 rounded transition-colors ${
          language === "en"
            ? "bg-[#0095f6] text-white"
            : "text-[#8e8e8e] hover:text-[#262626]"
        }`}
      >
        EN
      </button>
      <span className="text-[#dbdbdb]">|</span>
      <button
        onClick={() => handleChange("es-MX")}
        className={`px-2 py-1 rounded transition-colors ${
          language === "es-MX"
            ? "bg-[#0095f6] text-white"
            : "text-[#8e8e8e] hover:text-[#262626]"
        }`}
      >
        ES
      </button>
    </div>
  );
}
