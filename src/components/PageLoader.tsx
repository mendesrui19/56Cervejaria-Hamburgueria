import { StaffLoader } from "@/components/StaffLoader";

interface PageLoaderProps {
  title: string;
}

export function PageLoader({ title }: PageLoaderProps) {
  return <StaffLoader label={`A carregar ${title}…`} fullScreen />;
}
