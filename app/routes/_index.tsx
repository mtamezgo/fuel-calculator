import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSession, signOut } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Calculator } from "~/components/Calculator";
import { BlendCalculator } from "~/components/BlendCalculator";
import { GasPriceWidget } from "~/components/GasPriceWidget";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { useTranslation } from "~/lib/i18n/context";
import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fuel Calculator" },
    { name: "description", content: "Calculate fuel margins and convert prices" },
  ];
}

export default function Index() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"margin" | "blend">("margin");

  useEffect(() => {
    if (!isPending && !session?.user) {
      navigate("/login");
    }
  }, [session, isPending, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-[#8e8e8e]">{t("common.loading")}</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-[#dbdbdb] sticky top-0 z-10">
        <div className="max-w-[935px] mx-auto px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#262626]">
            {t("calculator.title")}
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <span className="text-xs sm:text-sm text-[#8e8e8e] truncate max-w-[150px] sm:max-w-none">
              {session.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-[#0095f6] hover:text-[#1877f2] text-xs sm:text-sm"
            >
              {t("common.signOut")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[935px] mx-auto px-3 sm:px-5 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Gas Price Widget - Full Width at Top */}
        <GasPriceWidget />

        {/* Tab Navigation */}
        <div className="bg-white border border-[#dbdbdb] rounded-sm shadow-sm">
          <div className="flex border-b border-[#dbdbdb]">
            <button
              onClick={() => setActiveTab("margin")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "margin"
                  ? "text-[#0095f6] border-b-2 border-[#0095f6] -mb-px"
                  : "text-[#8e8e8e] hover:text-[#262626]"
              }`}
            >
              {t("calculator.title")}
            </button>
            <button
              onClick={() => setActiveTab("blend")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "blend"
                  ? "text-[#0095f6] border-b-2 border-[#0095f6] -mb-px"
                  : "text-[#8e8e8e] hover:text-[#262626]"
              }`}
            >
              {t("blendCalculator.title")}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-6">
            {activeTab === "margin" ? <Calculator /> : <BlendCalculator />}
          </div>
        </div>
      </main>
    </div>
  );
}
