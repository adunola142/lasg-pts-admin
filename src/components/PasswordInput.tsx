"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** A password `<input>` with a show/hide toggle. Takes the same props as
    a plain `<input type="password">` (minus `type`, which is fixed) plus
    an optional `className` override for the input itself — the toggle
    button is always positioned to match. */
export function PasswordInput({
  className = "w-full rounded-xl border border-border px-4 py-3.5 text-base outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:text-foreground"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
