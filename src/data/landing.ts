export const BUSINESS = {
  name: "Cinquenta & Seis",
  legalName: "56 Cervejaria Hamburgueria",
  tagline: "Hamburgueria & Cervejaria",
  address: "R. José Ribeiro Vieira de Castro 140 Lj 5",
  city: "4820-273 Fafe",
  phone: "938 178 109",
  phoneHref: "tel:+351938178109",
  googleRating: 4.6,
  googleRatingLabel: "4,6",
  googleReviewCount: 141,
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=56+Cervejaria+Hamburgueria+Fafe",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=56+Cervejaria+Hamburgueria+Fafe&z=16&output=embed",
  instagramUrl: "https://www.instagram.com/56cervejaria_hamburgueria/",
  facebookUrl: "https://www.facebook.com/56HamburgueriaCervejaria",
  glovoUrl:
    "https://glovoapp.com/pt/pt/fafe/stores/56-cervejaria-hamburgueria-faf?utm_medium=organic&utm_campaign=google_reserve_place_order_action&utm_source=google",
  hours: [
    { days: "Segunda", time: "Encerrado" },
    { days: "Terça – Sexta", time: "08:30 – 00:00" },
    { days: "Sábado", time: "08:30 – 00:00" },
    { days: "Domingo", time: "17:00 – 00:00" },
  ],
};

export interface Review {
  author: string;
  rating: number;
  text: string;
  when?: string;
}

/** Críticas Google seleccionadas — as mais completas e positivas. */
export const FEATURED_REVIEWS: Review[] = [
  {
    author: "Sandra Gonçalves",
    rating: 5,
    text: "Hambúrgueres artesanais muito bons. Batata doce, a melhor que comemos até hoje. Atendimento 5 estrelas — pessoal simpático e bem disposto.",
    when: "há 1 ano",
  },
  {
    author: "Paulo Martins",
    rating: 4,
    text: "Hamburgueria com muito boa qualidade. Carne suculenta e tenra, molho 56 divinal, cerveja preta de pressão ótima. Rápido e bom atendimento.",
    when: "há 3 anos",
  },
  {
    author: "Manuela Moreira",
    rating: 5,
    text: "Variedade de hambúrgueres e pratos confecionados de forma diferente, com bom aspecto e delicioso ao palato. Boa apresentação do prato. Recomendo.",
    when: "há 1 ano",
  },
  {
    author: "Carla Fernandes",
    rating: 5,
    text: "Embora o kebab não seja o prato da casa, é excepcional. Hamburgers artesanais e finos de pressão à maneira. A qualidade e o sabor surpreendem.",
    when: "há 7 meses",
  },
  {
    author: "Daniel Martins",
    rating: 5,
    text: "Espaço confortável, seja para família ou amigos. Atendimento muito atencioso. Preços justos.",
    when: "há 10 meses",
  },
  {
    author: "Ricardo Valim",
    rating: 5,
    text: "Ótimo atendimento, boa comida e preço justo. Assim é que é.",
    when: "há 11 meses",
  },
  {
    author: "César",
    rating: 5,
    text: "O melhor hambúrguer em Fafe. Super recomendo.",
    when: "há 3 anos",
  },
  {
    author: "Cláudia Silva",
    rating: 4,
    text: "Recomendo. Preços muito competitivos e quantidades generosas.",
    when: "há 1 ano",
  },
  {
    author: "Henrique Coelho",
    rating: 5,
    text: "Para além da atendente ser muito simpática, a atmosfera e o estabelecimento são muito bons. Tanto os hambúrgueres como outras comidas são excelentes.",
    when: "há 2 anos",
  },
  {
    author: "Canal do Toledo",
    rating: 5,
    text: "Ótimo atendimento, comida saborosa, bons preços. Recomendo.",
    when: "há 1 ano",
  },
  {
    author: "José Coelho",
    rating: 4,
    text: "A francesinha, além de bom aspeto, tem um molho muito agradável — picante na medida certa, com um sabor muito bom.",
    when: "há 1 ano",
  },
  {
    author: "beatriz costa",
    rating: 5,
    text: "Super bem atendida. Comida boa, com preço super acessível. Fino tirado no ponto certo.",
    when: "há 2 anos",
  },
];

export const HERO_VIDEO = {
  src: "/video/hero-background.mp4",
  poster: "/fotos/11.webp",
} as const;
