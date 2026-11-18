"use client";

import { useState, useTransition } from "react";
import { signInDemo } from "@/app/login/demo-action";

export function DemoButton({
  label,
  pendingLabel,
  errorLabel,
  className = "",
  full = false,
}: {
  label: string;
  pendingLabel: string;
  errorLabel: string;
  className?: string;
  /** Il bottone occupa tutta la larghezza del contenitore (login). */
  full?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className={full ? "w-full" : "w-fit"}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await signInDemo();
            if (result?.error) setError(errorLabel);
          });
        }}
        className={className}
      >
        {pending ? pendingLabel : label}
      </button>
      {error && (
        <p role="alert" className="auth-alert mt-2 text-center text-[13px] text-[var(--red)]">
          {error}
        </p>
      )}
    </div>
  );
}
