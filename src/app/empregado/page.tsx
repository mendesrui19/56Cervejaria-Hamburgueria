"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/PageLoader";

const EmpregadoView = dynamic(() => import("@/views/EmpregadoView"), {
  ssr: false,
  loading: () => <PageLoader title="Empregado" />,
});

export default function EmpregadoPage() {
  return <EmpregadoView />;
}
