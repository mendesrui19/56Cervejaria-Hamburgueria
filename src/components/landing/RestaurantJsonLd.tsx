import { BUSINESS } from "@/data/landing";

export function RestaurantJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: BUSINESS.name,
    alternateName: BUSINESS.legalName,
    description: "Hamburgueria e cervejaria em Fafe",
    telephone: `+351${BUSINESS.phone.replace(/\s/g, "")}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address,
      addressLocality: "Fafe",
      postalCode: "4820-273",
      addressCountry: "PT",
    },
    servesCuisine: ["Hamburgueria", "Cervejaria", "Portuguesa"],
    priceRange: "€€",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3056",
    sameAs: [BUSINESS.instagramUrl, BUSINESS.facebookUrl],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
