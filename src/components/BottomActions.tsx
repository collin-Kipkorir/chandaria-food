import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Eye } from "lucide-react";
import { useNavigationLoader } from "@/components/NavigationLoader";

export default function BottomActions() {
  const loc = useLocation();
  const nav = useNavigate();
  const loader = useNavigationLoader();

  const onApply = () => {
    loader.start();
    if (loc.pathname.startsWith("/jobs/")) {
      const el = document.getElementById("apply");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => loader.done(), 700);
    } else {
      nav("/jobs");
      setTimeout(() => loader.done(), 600);
    }
  };

  const onView = () => {
    loader.start();
    // 'View' goes to stores page if not there already
    if (loc.pathname === "/" || loc.pathname === "") {
      const el = document.getElementById("stores");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => loader.done(), 600);
    } else {
      nav("/#stores");
      setTimeout(() => loader.done(), 600);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:flex-col">
      <button
        onClick={onView}
        aria-label="View stores"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 shadow-lg backdrop-blur transition hover:scale-[1.03]"
      >
        <Eye className="h-4 w-4" /> View
      </button>

      <button
        onClick={onApply}
        aria-label="Apply"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-brand-green-deep shadow-xl transition hover:scale-[1.03]"
      >
        Apply <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
