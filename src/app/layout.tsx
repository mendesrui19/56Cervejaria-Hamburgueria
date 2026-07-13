import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { RestaurantJsonLd } from "@/components/landing/RestaurantJsonLd";
import { SiteLoader } from "@/components/SiteLoader";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3056"
  ),
  title: "Cinquenta & Seis — Hamburgueria & Cervejaria",
  description:
    "Hamburgueria e cervejaria artesanal. Burgers gourmet, cervejas especiais e um ambiente acolhedor.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Cinquenta & Seis — Hamburgueria & Cervejaria",
    description:
      "Hamburgueria e cervejaria artesanal. Burgers gourmet, cervejas especiais e um ambiente acolhedor.",
    images: ["/brand/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F8F6F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=location.pathname;if(p==="/"||p==="/carta")document.documentElement.classList.add("site-loading")})();`,
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${playfair.variable} antialiased safe-x`}
        suppressHydrationWarning
      >
        <RestaurantJsonLd />
        <SiteLoader />
        {children}
      </body>
    </html>
  );
}
