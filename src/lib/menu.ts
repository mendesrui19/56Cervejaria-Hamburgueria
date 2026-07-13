import type { MenuCategory, MenuItem, OrderItemCustomization } from "./types";

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "apetite",
    name: "Para Abrir o Apetite",
  },
  {
    id: "batata-especial",
    name: "Batata Especial",
  },
  {
    id: "hamburguer",
    name: "Hambúrguer",
    note: "Batata frita NÃO incluída. Opção de carne de vaca ou frango. Escolher pão: Bolo do Caco ou Pão Normal.",
  },
  {
    id: "acompanhamentos",
    name: "Acompanhamentos",
    note: "Extras para adicionar ao pedido principal.",
  },
  {
    id: "snacks",
    name: "Snacks",
  },
  {
    id: "sobremesas",
    name: "Sobremesas",
  },
  {
    id: "bebidas",
    name: "Bebidas",
  },
  {
    id: "cervejas",
    name: "Cervejas",
  },
  {
    id: "cervejas-estrangeiras",
    name: "Cervejas Estrangeiras",
  },
  {
    id: "vinhos",
    name: "Vinhos",
  },
  {
    id: "sangrias",
    name: "Sangrias",
  },
  {
    id: "gins",
    name: "Gin's",
  },
];

const MEAT_OPTIONS = [
  { id: "vaca", label: "Vaca", default: true },
  { id: "frango", label: "Frango" },
];

const BREAD_OPTIONS = [
  { id: "caco", label: "Bolo do Caco", default: true },
  { id: "normal", label: "Pão Normal" },
];

const KIDS_OPTIONS = [
  { id: "tiras", label: "4 Tiras de Frango + Batata Frita", default: true },
  { id: "cheeseburger", label: "Cheeseburger (fiambre, ketchup) + Batata Frita" },
];

export const MENU_ITEMS: MenuItem[] = [
  // PARA ABRIR O APETITE
  {
    id: "pao-alho",
    name: "Pão de Alho (Bolo do Caco)",
    price: 3.5,
    categoryId: "apetite",
    ingredients: ["Pão Bolo do Caco", "Manteiga de alho", "Ervas aromáticas"],
    kitchenNotes: "Tostar o caco com manteiga de alho até dourar.",
  },
  {
    id: "bolinhas-alheira",
    name: "Bolinhas de Alheira (6 un.)",
    price: 6.5,
    categoryId: "apetite",
    ingredients: ["Alheira", "Pão ralado", "Ovo", "Molho acompanhar"],
    kitchenNotes: "6 unidades. Fritar até dourar. Servir com molho.",
  },
  {
    id: "tiras-frango",
    name: "Tiras de Frango (6 un.)",
    price: 6.5,
    categoryId: "apetite",
    ingredients: ["Peito de frango", "Pão ralado", "Temperos", "Molho acompanhar"],
    kitchenNotes: "6 tiras panadas. Fritar até crocante.",
  },
  {
    id: "gambas-panadas",
    name: "Gambas Panadas (6 un.)",
    price: 6.5,
    categoryId: "apetite",
    ingredients: ["Gambas", "Pão ralado", "Limão", "Molho acompanhar"],
    kitchenNotes: "6 gambas panadas. Servir com limão.",
  },
  {
    id: "sticks-mozzarella",
    name: "Sticks Mozzarella (6 un.)",
    price: 6.5,
    categoryId: "apetite",
    ingredients: ["Mozzarella", "Pão ralado", "Molho marinara"],
    kitchenNotes: "6 sticks. Fritar até o queijo derreter. Molho marinara.",
  },
  {
    id: "asinhas",
    name: "Asinhas (6 un.)",
    price: 6.5,
    categoryId: "apetite",
    ingredients: ["Asas de frango", "Temperos", "Molho picante opcional"],
    kitchenNotes: "6 asinhas. Grelhar ou fritar conforme padrão da casa.",
  },

  // BATATA ESPECIAL
  {
    id: "batata-cheddar-bacon",
    name: "Batata Cheddar e Bacon",
    price: 6.5,
    categoryId: "batata-especial",
    ingredients: [
      "Batata frita",
      "Creme de cheddar",
      "Bacon crocante",
    ],
    kitchenNotes: "Batata coberta com creme de cheddar e bacon por cima.",
  },
  {
    id: "batata-alho-parmesao",
    name: "Batata Alho e Parmesão",
    price: 7.0,
    categoryId: "batata-especial",
    ingredients: [
      "Batata frita",
      "Salsa picada",
      "Parmesão ralado",
      "Molho de alho e parmesão",
    ],
    kitchenNotes: "Finalizar com salsa, parmesão e molho de alho.",
  },
  {
    id: "batata-mexicana",
    name: "Batata Mexicana",
    price: 7.0,
    categoryId: "batata-especial",
    ingredients: [
      "Batata frita",
      "Pico de gallo",
      "Mozzarella ralada",
      "Molho de abacate e lima",
    ],
    kitchenNotes: "Pico de gallo + mozzarella + molho abacate/lima por cima.",
  },

  // HAMBÚRGUERES
  {
    id: "burger-56",
    name: "56",
    price: 6.5,
    categoryId: "hamburguer",
    excludesFries: true,
    ingredients: [
      "Hambúrguer de vaca",
      "Cheddar",
      "Alface",
      "Tomate",
      "Pickle de cebola roxa",
      "Molho 56",
    ],
    kitchenNotes: "Montar com todos os ingredientes. BATATA NÃO INCLUÍDA.",
    optionGroups: [
      { id: "carne", label: "Tipo de Carne", required: true, options: MEAT_OPTIONS },
      { id: "pao", label: "Tipo de Pão", required: true, options: BREAD_OPTIONS },
    ],
  },
  {
    id: "burger-duplo-bacon",
    name: "Duplo Bacon",
    price: 8.0,
    categoryId: "hamburguer",
    excludesFries: true,
    ingredients: [
      "2x Hambúrguer de vaca",
      "Cheddar",
      "Bacon",
      "Maionese de bacon",
    ],
    kitchenNotes: "Duplo hambúrguer com bacon e maionese de bacon. BATATA NÃO INCLUÍDA.",
    optionGroups: [
      { id: "carne", label: "Tipo de Carne", required: true, options: MEAT_OPTIONS },
      { id: "pao", label: "Tipo de Pão", required: true, options: BREAD_OPTIONS },
    ],
  },
  {
    id: "burger-frango-panado",
    name: "Frango Panado",
    price: 7.0,
    categoryId: "hamburguer",
    excludesFries: true,
    ingredients: [
      "Frango panado",
      "Cheddar",
      "Alface",
      "Bacon",
      "Molho ranch",
    ],
    kitchenNotes: "Burger de frango panado. BATATA NÃO INCLUÍDA.",
    optionGroups: [
      { id: "pao", label: "Tipo de Pão", required: true, options: BREAD_OPTIONS },
    ],
  },
  {
    id: "burger-serrano",
    name: "Serrano",
    price: 7.0,
    categoryId: "hamburguer",
    excludesFries: true,
    ingredients: [
      "Hambúrguer de vaca",
      "Queijo amanteigado",
      "Presunto",
      "Alface",
      "Maionese de alho",
    ],
    kitchenNotes: "Com presunto e queijo amanteigado. BATATA NÃO INCLUÍDA.",
    optionGroups: [
      { id: "carne", label: "Tipo de Carne", required: true, options: MEAT_OPTIONS },
      { id: "pao", label: "Tipo de Pão", required: true, options: BREAD_OPTIONS },
    ],
  },
  {
    id: "burger-vegetariano",
    name: "Vegetariano",
    price: 7.0,
    categoryId: "hamburguer",
    excludesFries: true,
    ingredients: [
      "Hambúrguer vegetariano",
      "Alface",
      "Tomate",
      "Cenoura",
      "Molho alho-parmesão",
    ],
    kitchenNotes: "Burger vegetariano. BATATA NÃO INCLUÍDA.",
    optionGroups: [
      { id: "pao", label: "Tipo de Pão", required: true, options: BREAD_OPTIONS },
    ],
  },

  // ACOMPANHAMENTOS
  {
    id: "ovo",
    name: "Ovo",
    price: 1.0,
    categoryId: "acompanhamentos",
    isAddon: true,
    canBeAddon: true,
    ingredients: ["Ovo estrelado ou mexido"],
    kitchenNotes: "Preparar ovo conforme pedido.",
  },
  {
    id: "molho-francesinha",
    name: "Molho Especial Francesinha",
    price: 3.0,
    categoryId: "acompanhamentos",
    isAddon: true,
    canBeAddon: true,
    ingredients: ["Molho especial francesinha"],
    kitchenNotes: "Molho à parte.",
  },
  {
    id: "batata-frita",
    name: "Batata Frita (1 Dose)",
    price: 3.5,
    categoryId: "acompanhamentos",
    isAddon: true,
    canBeAddon: true,
    ingredients: ["Batata frita"],
    kitchenNotes: "1 dose de batata frita normal.",
  },
  {
    id: "batata-country",
    name: "Batata Frita Country (1 Dose)",
    price: 4.0,
    categoryId: "acompanhamentos",
    isAddon: true,
    canBeAddon: true,
    ingredients: ["Batata frita country (com pele)"],
    kitchenNotes: "1 dose de batata country.",
  },

  // SNACKS
  {
    id: "menu-infantil",
    name: "Menu Infantil",
    price: 7.0,
    categoryId: "snacks",
    ingredients: ["Opção A: 4 tiras de frango + batata", "Opção B: cheeseburger + fiambre + ketchup + batata"],
    kitchenNotes: "Ver opção escolhida. Inclui batata frita.",
    optionGroups: [
      { id: "opcao-infantil", label: "Opção do Menu Infantil", required: true, options: KIDS_OPTIONS },
    ],
  },
  {
    id: "prego-pao",
    name: "Prego no Pão",
    price: 7.0,
    categoryId: "snacks",
    ingredients: [
      "Bife da vazia (prego)",
      "Pão Bolo do Caco",
      "Queijo",
      "Fiambre",
    ],
    kitchenNotes: "Prego no caco com queijo e fiambre.",
  },
  {
    id: "prego-prato",
    name: "Prego no Prato",
    price: 11.0,
    categoryId: "snacks",
    ingredients: [
      "Bife da vazia (prego)",
      "Ovo",
      "Salada (alface, tomate, cenoura)",
      "Batata frita",
    ],
    kitchenNotes: "Prego com ovo, salada e batata.",
  },
  {
    id: "kebab-prato",
    name: "Kebab no Prato",
    price: 10.5,
    categoryId: "snacks",
    ingredients: [
      "Kebab de frango",
      "Molho de iogurte",
      "Molho samurai picante",
      "Cebola frita",
      "Salada de tomate",
      "Batata frita",
    ],
    kitchenNotes: "Kebab completo com ambos os molhos e batata.",
  },
  {
    id: "cachorro-especial",
    name: "Cachorro Especial",
    price: 11.0,
    categoryId: "snacks",
    ingredients: [
      "Salsicha cachorro",
      "Fiambre",
      "Queijo",
      "Molho cocktail",
      "Molho especial",
      "Batata frita",
    ],
    kitchenNotes: "Cachorro com todos os ingredientes e batata.",
  },
  {
    id: "francesinha-especial",
    name: "Francesinha Especial",
    price: 13.0,
    categoryId: "snacks",
    ingredients: [
      "Bife da vazia",
      "Queijo",
      "Fiambre",
      "Chouriço",
      "Salsicha",
      "Ovo",
      "Batata frita",
      "Molho francesinha (verificar extra)",
    ],
    kitchenNotes: "Montar francesinha completa. Verificar se pediram molho extra à parte.",
  },

  // SOBREMESAS
  {
    id: "doce-casa",
    name: "Doce da Casa",
    price: 4.0,
    categoryId: "sobremesas",
    ingredients: ["Doce do dia / sobremesa da casa"],
    kitchenNotes: "Servir doce da casa disponível.",
  },

  // BEBIDAS
  {
    id: "agua",
    name: "Água",
    price: 1.0,
    categoryId: "bebidas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "sumol",
    name: "Sumol",
    price: 1.8,
    categoryId: "bebidas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "coca-cola",
    name: "Coca-Cola",
    price: 1.8,
    categoryId: "bebidas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "ice-tea",
    name: "Ice Tea",
    price: 1.8,
    categoryId: "bebidas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "7up",
    name: "7UP",
    price: 1.8,
    categoryId: "bebidas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "brisa",
    name: "Brisa",
    price: 2.5,
    categoryId: "bebidas",
    ingredients: [],
    skipKitchen: true,
  },

  // CERVEJAS
  {
    id: "fino",
    name: "Fino",
    price: 1.3,
    categoryId: "cervejas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "caneca-cerveja",
    name: "Caneca de Cerveja",
    price: 2.0,
    categoryId: "cervejas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "bohemia-original",
    name: "Bohemia Original",
    price: 1.6,
    categoryId: "cervejas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "super-bock-sem-alcool",
    name: "Super Bock S/Álcool",
    price: 1.6,
    categoryId: "cervejas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "mini-super-bock",
    name: "Mini Super Bock",
    price: 1.2,
    categoryId: "cervejas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "bandida-do-pomar",
    name: "Bandida do Pomar",
    price: 2.5,
    categoryId: "cervejas",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "heineken-zero",
    name: "Heineken Zero",
    price: 1.3,
    categoryId: "cervejas",
    ingredients: [],
    skipKitchen: true,
  },

  // CERVEJAS ESTRANGEIRAS
  {
    id: "erdinger",
    name: "Erdinger",
    price: 6.0,
    categoryId: "cervejas-estrangeiras",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "gulden-draak",
    name: "Gulden Draak",
    price: 6.0,
    categoryId: "cervejas-estrangeiras",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "kasteel",
    name: "Kasteel",
    price: 6.0,
    categoryId: "cervejas-estrangeiras",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "kwak",
    name: "Kwak",
    price: 6.0,
    categoryId: "cervejas-estrangeiras",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "desperados",
    name: "Desperados",
    price: 4.0,
    categoryId: "cervejas-estrangeiras",
    ingredients: [],
    skipKitchen: true,
  },

  // VINHOS
  {
    id: "verde-da-casa",
    name: "Verde da Casa",
    price: 7.0,
    categoryId: "vinhos",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "almotrega",
    name: "Almotrega",
    price: 8.0,
    categoryId: "vinhos",
    ingredients: [],
    skipKitchen: true,
  },

  // SANGRIAS
  {
    id: "sangria-maracuja",
    name: "Sangria Maracujá",
    price: 16.0,
    categoryId: "sangrias",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "sangria-frutos-vermelhos",
    name: "Sangria Frutos Vermelhos",
    price: 16.0,
    categoryId: "sangrias",
    ingredients: [],
    skipKitchen: true,
  },

  // GIN'S
  {
    id: "opivm",
    name: "Opivm",
    price: 5.0,
    categoryId: "gins",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "buldog",
    name: "Buldog",
    price: 8.0,
    categoryId: "gins",
    ingredients: [],
    skipKitchen: true,
  },
  {
    id: "nordes",
    name: "Nordés",
    price: 9.0,
    categoryId: "gins",
    ingredients: [],
    skipKitchen: true,
  },
];

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id);
}

export function getCategoryItems(categoryId: string): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.categoryId === categoryId);
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(".", ",")}€`;
}

export function needsCustomization(item: MenuItem): boolean {
  return !!(item.optionGroups && item.optionGroups.length > 0);
}

export function getDefaultCustomizations(
  item: MenuItem
): OrderItemCustomization[] {
  if (!item.optionGroups) return [];

  return item.optionGroups.map((group) => {
    const option =
      group.options.find((o) => o.default) ?? group.options[0];
    return {
      groupId: group.id,
      groupLabel: group.label,
      optionId: option.id,
      optionLabel: option.label,
    };
  });
}

export const FOOD_CATEGORY_IDS = [
  "apetite",
  "batata-especial",
  "hamburguer",
  "snacks",
  "sobremesas",
] as const;

export const DRINK_CATEGORY_IDS = [
  "bebidas",
  "cervejas",
  "cervejas-estrangeiras",
  "vinhos",
  "sangrias",
  "gins",
] as const;

export type MenuSection = "comida" | "bebida";

export const CATEGORY_SHORT: Record<string, string> = {
  apetite: "Apetite",
  "batata-especial": "Batatas",
  hamburguer: "Burgers",
  acompanhamentos: "Extras",
  snacks: "Snacks",
  sobremesas: "Doces",
  bebidas: "Bebidas",
  cervejas: "Cervejas",
  "cervejas-estrangeiras": "Estrang.",
  vinhos: "Vinhos",
  sangrias: "Sangrias",
  gins: "Gin's",
};

export function needsKitchen(item: MenuItem | { skipKitchen?: boolean; isAddon?: boolean }): boolean {
  return !item.skipKitchen && !item.isAddon;
}

export function getAddonItems(): MenuItem[] {
  return MENU_ITEMS.filter((i) => i.canBeAddon);
}

export function supportsItemAddons(item: MenuItem): boolean {
  return item.categoryId === "hamburguer" || !!item.optionGroups?.length;
}

export function isExtraCustomization(groupId: string): boolean {
  return groupId.startsWith("extra-");
}

/** Preço base + extras seleccionados */
export function calculateItemPrice(
  item: MenuItem,
  customizations: OrderItemCustomization[],
  resolveItem: (id: string) => MenuItem | undefined = getMenuItem
): number {
  let price = item.price;
  for (const c of customizations) {
    if (isExtraCustomization(c.groupId)) {
      const addon = resolveItem(c.optionId);
      if (addon) price += addon.price;
    }
  }
  return price;
}

/**
 * O que a cozinha precisa ver: tudo o que o empregado escolhe no pedido
 * (tipo de carne, tipo de pão, extras, etc.). Nunca a receita/ingredientes base.
 */
export function buildKitchenChoices(
  item: MenuItem,
  customizations: OrderItemCustomization[]
): string[] {
  const choices: string[] = [];

  for (const c of customizations) {
    if (isExtraCustomization(c.groupId)) {
      choices.push(`+ ${c.optionLabel}`);
      continue;
    }

    const group = item.optionGroups?.find((g) => g.id === c.groupId);
    if (!group) continue;

    choices.push(`${group.label}: ${c.optionLabel}`);
  }

  return choices;
}

/** Fallback quando o item do catálogo não está disponível. */
export function buildKitchenChoicesFromCustomizations(
  customizations: OrderItemCustomization[]
): string[] {
  return customizations.map((c) =>
    isExtraCustomization(c.groupId)
      ? `+ ${c.optionLabel}`
      : `${c.groupLabel}: ${c.optionLabel}`
  );
}

/** Linhas para o ecrã da cozinha — só escolhas do cliente, nunca a receita base. */
export function getKitchenDisplayChoices(
  orderItem: {
    menuItemId: string;
    customizations: OrderItemCustomization[];
    ingredients: string[];
    kitchenNotes?: string;
  },
  resolveItem: (id: string) => MenuItem | undefined = getMenuItem
): string[] {
  const menuItem = resolveItem(orderItem.menuItemId);
  const choices = menuItem
    ? buildKitchenChoices(menuItem, orderItem.customizations)
    : buildKitchenChoicesFromCustomizations(orderItem.customizations);

  if (!orderItem.kitchenNotes) return choices;

  return choices.filter((line) => line !== orderItem.kitchenNotes);
}

export function buildKitchenDescription(
  item: MenuItem,
  customizations: OrderItemCustomization[]
): string[] {
  const lines = buildKitchenChoices(item, customizations);
  if (item.kitchenNotes) {
    lines.push(item.kitchenNotes);
  }
  return lines;
}

/** @deprecated Use buildKitchenChoices — mantido para compatibilidade */
export function resolveIngredientsWithCustomizations(
  item: MenuItem,
  customizations: { groupId: string; optionLabel: string }[]
): string[] {
  return buildKitchenChoices(
    item,
    customizations as OrderItemCustomization[]
  );
}
