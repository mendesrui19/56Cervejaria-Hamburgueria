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
      email: false,
      address: false,
    },
    icons: {
      icon: [
        { url: "/favicon.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-icon.png",
    },
    other: {
      "mobile-web-app-capable": "yes",
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
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: app.backgroundColor },
      { media: "(prefers-color-scheme: dark)", color: app.backgroundColor },
    ],
    colorScheme: "light",
  };
}
