import React from "react";

export default function AdminHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-brand-green p-3 shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-brand-cream"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-green-deep">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
