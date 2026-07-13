import type { Metadata, Viewport } from "next";
import type { StaffPwaConfig } from "./pwa";

export function staffPwaMetadata(app: StaffPwaConfig): Metadata {
  return {
    title: app.title,
    description: app.description,
    manifest: app.manifestPath,
    applicationName: app.shortName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: app.shortName,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: "/favicon.png",
      apple: "/apple-icon.png",
    },
  };
}

export function staffPwaViewport(app: StaffPwaConfig): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: app.themeColor,
  };
}
