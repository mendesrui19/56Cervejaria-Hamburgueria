"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/PageLoader";

const CozinhaView = dynamic(() => import("@/views/CozinhaView"), {
  ssr: false,
  loading: () => <PageLoader title="Cozinha" />,
});

export default function CozinhaPage() {
  return <CozinhaView />;
}
