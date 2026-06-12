import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Menu, X } from "lucide-react";

const NAV = [
  { label: "Home", to: "/", hash: false },
  { label: "About", to: "/#about", hash: true },
  { label: "Our Stores", to: "/#what-we-do", hash: true },
  { label: "Careers", to: "/jobs", hash: false },
];

export function AppHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-green-deep/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green-deep ring-2 ring-brand-gold/40 sm:h-11 sm:w-11">
            <Leaf className="h-5 w-5 text-brand-gold" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg tracking-wider text-white sm:text-xl">
              CHANDARANA <span className="text-brand-gold">FOODPLUS</span>
            </div>
            <div className="hidden text-[10px] uppercase tracking-[0.25em] text-white/60 sm:block">
              More than just food
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 md:flex">
          {NAV.map((n) =>
            n.hash ? (
              <a key={n.label} href={n.to} className="transition hover:text-brand-gold">
                {n.label}
              </a>
            ) : (
              <Link key={n.label} to={n.to} className="transition hover:text-brand-gold">
                {n.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/jobs"
            className="hidden items-center justify-center rounded-full bg-brand-gold px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep shadow-lg shadow-brand-gold/30 transition hover:scale-[1.03] hover:bg-brand-gold-dark sm:inline-flex"
          >
            Apply Now
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand-green-deep px-4 pb-5 pt-3 md:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
            {NAV.map((n) =>
              n.hash ? (
                <a
                  key={n.label}
                  href={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 hover:bg-white/5 hover:text-brand-gold"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 hover:bg-white/5 hover:text-brand-gold"
                >
                  {n.label}
                </Link>
              ),
            )}
            <Link
              to="/jobs"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-deep"
            >
              Apply Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
