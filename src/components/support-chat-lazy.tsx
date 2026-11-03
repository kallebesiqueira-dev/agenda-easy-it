"use client";

/**
 * Carica la chat di supporto FUORI dal bundle iniziale: è un widget sempre
 * montato ma non critico. Il chunk (regex FAQ it/en + avatar) viene scaricato
 * quando il browser è inattivo, così non pesa sul primo caricamento della
 * landing/pannello su nessun dispositivo.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SupportChat = dynamic(
  () => import("./support-chat").then((m) => m.SupportChat),
  { ssr: false },
);

export function SupportChatLazy() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => setShow(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setShow(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  return show ? <SupportChat /> : null;
}
