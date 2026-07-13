"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/PageLoader";

const AdminView = dynamic(() => import("@/views/AdminView"), {
  ssr: false,
  loading: () => <PageLoader title="Admin" />,
});

export default function AdminPage() {
  return <AdminView />;
}
