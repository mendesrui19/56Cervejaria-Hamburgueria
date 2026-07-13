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
  shortName: "Staff",
  description: "Empregado, cozinha, caixa e gestão do restaurante.",
  startUrl: "/sistema",
  manifestPath: "/manifest-sistema.webmanifest",
  themeColor: "#B8860B",
  backgroundColor: "#F8F6F2",
};
