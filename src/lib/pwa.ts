export interface StaffPwaConfig {
  id: string;
  title: string;
  shortName: string;
  description: string;
  startUrl: string;
  manifestPath: string;
  themeColor: string;
  backgroundColor: string;
}

export const SISTEMA_PWA: StaffPwaConfig = {
  id: "sistema",
  title: "Cinquenta & Seis — Staff",
  shortName: "Staff 56",
  description: "Empregado, cozinha, caixa e gestão — tablets Android.",
  startUrl: "/sistema",
  manifestPath: "/manifest-sistema.webmanifest",
  themeColor: "#ebe4d8",
  backgroundColor: "#ebe4d8",
};

export const FIDELIZACAO_PWA: StaffPwaConfig = {
  id: "app56",
  title: "Cinquenta & Seis — App 56",
  shortName: "App 56",
  description: "App 56. Junta selos e ganha recompensas.",
  startUrl: "/app",
  manifestPath: "/manifest-fidelizacao.webmanifest",
  themeColor: "#8f6814",
  backgroundColor: "#1a1410",
};
