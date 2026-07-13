/** Fotos de comida — origem: /fotos */
export const FOOD_PHOTOS = [
  { src: "/fotos/11.webp", alt: "Hambúrguer gourmet com ovo e queijo" },
  { src: "/fotos/12.webp", alt: "Prato na assadeira 56" },
  { src: "/fotos/13.webp", alt: "Sandwich com cebola crocante" },
  { src: "/fotos/01.webp", alt: "Prato da casa" },
  { src: "/fotos/02.webp", alt: "Hambúrguer especial" },
  { src: "/fotos/03.webp", alt: "Burger artesanal" },
  { src: "/fotos/04.webp", alt: "Hambúrguer gourmet" },
  { src: "/fotos/05.webp", alt: "Francesinha" },
  { src: "/fotos/06.webp", alt: "Petiscos" },
  { src: "/fotos/07.webp", alt: "Prato especial" },
  { src: "/fotos/08.webp", alt: "Petiscos e cerveja" },
  { src: "/fotos/09.webp", alt: "Comida da casa" },
  { src: "/fotos/10.webp", alt: "Detalhe do prato" },
] as const;

export const FOOD_PHOTO_PATHS = FOOD_PHOTOS.map((p) => p.src);
