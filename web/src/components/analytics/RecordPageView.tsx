"use client";

import { useEffect, useRef } from "react";

export function RecordPageView({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!slug?.trim() || sent.current) return;
    sent.current = true;
    void fetch("/api/public/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug.trim() }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
