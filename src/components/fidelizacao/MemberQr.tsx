"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { loyaltyQrPayload } from "@/lib/loyalty";

export function MemberQr({
  memberCode,
  large,
  showHint = true,
}: {
  memberCode: string;
  large?: boolean;
  showHint?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const size = large ? 280 : 220;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    void QRCode.toCanvas(canvas, loyaltyQrPayload(memberCode), {
      width: size,
      margin: 2,
      color: {
        dark: "#1a1410",
        light: "#ffffff",
      },
    }).catch(() => setError("Erro ao gerar QR"));
  }, [memberCode, size]);

  return (
    <div className={`loyalty-qr-wrap ${large ? "is-large" : ""}`}>
      {error ? (
        <p className="text-red-300 text-sm">{error}</p>
      ) : (
        <canvas ref={canvasRef} className="rounded-2xl" aria-label="QR Code" />
      )}
      {!large && <p className="loyalty-code-label">{memberCode}</p>}
      {showHint && !large && (
        <p className="text-xs text-white/50 mt-2 text-center max-w-[220px]">
          Mostra este código na caixa para ganhar selos
        </p>
      )}
    </div>
  );
}
