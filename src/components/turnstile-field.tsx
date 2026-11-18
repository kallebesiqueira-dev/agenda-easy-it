"use client";

/**
 * Widget Turnstile. Sem NEXT_PUBLIC_TURNSTILE_SITE_KEY não renderiza nada,
 * e o servidor também não exige o token.
 */

import Script from "next/script";
import { useEffect, useRef } from "react";
import type { Lang } from "@/lib/i18n";
import type { TurnstileAction } from "@/lib/turnstile";

type WidgetId = string;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "light";
      size: "flexible";
      language: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => WidgetId;
  reset: (widgetId: WidgetId) => void;
  remove: (widgetId: WidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

export function turnstileRequired() {
  return SITE_KEY.length > 0;
}

export function TurnstileField({
  action,
  lang,
  resetKey,
  onToken,
  onBypass,
}: {
  action: TurnstileAction;
  lang: Lang;
  resetKey: number;
  onToken: (token: string) => void;
  /** Widget não carregou, expirou ou deu erro: o formulário segue sem token. */
  onBypass: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<WidgetId | null>(null);
  const onTokenRef = useRef(onToken);
  const onBypassRef = useRef(onBypass);
  useEffect(() => {
    onTokenRef.current = onToken;
    onBypassRef.current = onBypass;
  }, [onToken, onBypass]);

  function render() {
    const api = window.turnstile;
    const node = box.current;
    if (!api || !node || widgetId.current) return;
    widgetId.current = api.render(node, {
      sitekey: SITE_KEY,
      action,
      theme: "light",
      size: "flexible",
      language: lang === "en" ? "en" : "it",
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => {
        onTokenRef.current("");
        onBypassRef.current();
      },
      "error-callback": () => {
        onTokenRef.current("");
        onBypassRef.current();
      },
    });
  }

  useEffect(() => {
    render();
    const timer = window.setTimeout(() => onBypassRef.current(), 4000);
    return () => {
      window.clearTimeout(timer);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
    // O widget nasce uma vez por montagem. A língua e a ação não mudam no meio do form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return;
    window.turnstile.reset(widgetId.current);
    onTokenRef.current("");
  }, [resetKey]);

  if (!SITE_KEY) return null;

  return (
    <div className="turnstile-slot">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={box} />
    </div>
  );
}
