"use client";

import { useEffect } from "react";

export function AddToast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] animate-toast-in">
      <div className="rounded-full bg-green-50 border border-green-200 px-5 py-3 text-green-800 text-sm font-bold shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
