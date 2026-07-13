export type StaffPwaId = "empregado" | "cozinha" | "caixa";

export interface StaffPwaConfig {
  id: StaffPwaId;
  title: string;
  shortName: string;
  description: string;
  startUrl: string;
  manifestPath: string;
  themeColor: string;
  backgroundColor: string;
}

export const STAFF_PWA_APPS: Record<StaffPwaId, StaffPwaConfig> = {
  empregado: {
    id: "empregado",
    title: "Cinquenta & Seis — Empregado",
    shortName: "Empregado",
    description: "Tomar pedidos, mesas e enviar à cozinha.",
    startUrl: "/empregado",
    manifestPath: "/manifest-empregado.webmanifest",
    themeColor: "#B8860B",
    backgroundColor: "#F8F6F2",
  },
  cozinha: {
    id: "cozinha",
    title: "Cinquenta & Seis — Cozinha",
    shortName: "Cozinha",
    description: "Pedidos, alertas e marcar pratos como prontos.",
    startUrl: "/cozinha",
    manifestPath: "/manifest-cozinha.webmanifest",
    themeColor: "#B91C1C",
    backgroundColor: "#F8F6F2",
  },
  caixa: {
    id: "caixa",
    title: "Cinquenta & Seis — Caixa",
    shortName: "Caixa",
    description: "Pagamentos, fecho do dia e gestão de contas.",
    startUrl: "/caixa",
    manifestPath: "/manifest-caixa.webmanifest",
    themeColor: "#047857",
    backgroundColor: "#F8F6F2",
  },
};
