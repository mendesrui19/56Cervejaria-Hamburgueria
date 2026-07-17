"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/PageLoader";

const AdminView = dynamic(() => import("@/views/AdminView"), {
  ssr: false,
  loading: () => <PageLoader title="Gestor56" />,
});

export default function Gestor56Page() {
  return <AdminView />;
}
