export type LandingLocale = "pt" | "en";

export const LANDING_LOCALE_KEY = "cs56-landing-locale";

export interface LandingCopy {
  nav: {
    about: string;
    menu: string;
    gallery: string;
    reviews: string;
    brewery: string;
    contact: string;
    staff: string;
    openMenu: string;
    book: string;
    bookNav: string;
    contactUs: string;
    glovo: string;
  };
  hero: {
    tagline: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    viewMenu: string;
    call: string;
    directions: string;
    openNow: string;
    closed: string;
    closedMonday: string;
    sundayHours: string;
    weekdayHours: string;
    since: string;
    sinceLabel: string;
    glovoOrder: string;
    scrollHint: string;
  };
  about: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    p1: string;
    p2: string;
    imageAlt: string;
  };
  menu: {
    eyebrow: string;
    title: string;
    subtitle: string;
    food: string;
    drinks: string;
    loading: string;
    unavailable: string;
    bookPage: string;
    qrHint: string;
    openFull: string;
    backToSite: string;
    tapToOpen: string;
    pagePrev: string;
    pageNext: string;
    foodCover: string;
    foodCoverSub: string;
    drinksCover: string;
    drinksCoverSub: string;
  };
  brewery: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    imageAlt: string;
  };
  gallery: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  glovo: {
    eyebrow: string;
    title: string;
    subtitle: string;
    note: string;
    cta: string;
    tapToOrder: string;
  };
  reviews: {
    eyebrow: string;
    title: string;
    subtitle: string;
    basedOn: string;
    reviews: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    book: string;
    contactUs: string;
    call: string;
    directions: string;
    glovo: string;
    hours: string;
    address: string;
    phone: string;
    follow: string;
    viewMap: string;
    closed: string;
  };
  footer: {
    rights: string;
    about: string;
    reviews: string;
    contact: string;
    staff: string;
  };
  mobileBar: {
    menu: string;
    book: string;
    contact: string;
    glovo: string;
  };
  hours: Array<{ days: string; time: string }>;
}

export const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  pt: {
    nav: {
      about: "Sobre",
      menu: "Menu",
      gallery: "Galeria",
      reviews: "Opiniões",
      brewery: "Cervejaria",
      contact: "Contacto",
      staff: "Staff",
      openMenu: "Menu",
      book: "Efetuar reserva",
      bookNav: "Reservar",
      contactUs: "Contactar",
      glovo: "Glovo",
    },
    hero: {
      tagline: "Hamburgueria & Cervejaria · Fafe",
      titleLine1: "Sabor de verdade.",
      titleLine2: "Ambiente de casa.",
      description:
        "Hambúrgueres artesanais, francesinhas, pregos e cerveja bem tirada — no centro de Fafe, desde 2019.",
      viewMenu: "Ver carta",
      call: "Ligar",
      directions: "Como chegar",
      openNow: "Aberto agora",
      closed: "Fechado",
      closedMonday: "Segunda-feira",
      sundayHours: "Domingo · 17:00 – 00:00",
      weekdayHours: "Ter–Sáb · 08:30 – 00:00",
      since: "2019",
      sinceLabel: "Em Fafe",
      glovoOrder: "Pedir no",
      scrollHint: "Descobrir",
    },
    about: {
      eyebrow: "Sobre nós",
      titleLine1: "Em Fafe",
      titleLine2: "desde 2019.",
      p1: "A Cinquenta & Seis começou com vontade de servir boa comida num espaço simples e acolhedor. Hoje há cerveja nacional e estrangeira, hambúrgueres de frango e vitela, francesinhas, pregos, kebab e petiscos para partilhar.",
      p2: "Há mesa por dentro, esplanada por fora, e também podes levar ou pedir por telefone. O que interessa é saíres satisfeito.",
      imageAlt: "Interior Cinquenta & Seis",
    },
    menu: {
      eyebrow: "Carta",
      title: "Menu digital",
      subtitle: "A nossa carta em formato de livro — como na mesa.",
      food: "Comida",
      drinks: "Bebidas",
      loading: "A abrir a carta…",
      unavailable: "Carta indisponível de momento.",
      bookPage: "Carta digital",
      qrHint: "Escaneia o QR na mesa para veres a carta no telemóvel.",
      openFull: "Ver carta completa",
      backToSite: "Voltar ao site",
      tapToOpen: "Toca para abrir",
      pagePrev: "Página anterior",
      pageNext: "Página seguinte",
      foodCover: "Comida",
      foodCoverSub: "Hambúrgueres, petiscos e sobremesas",
      drinksCover: "Bebidas",
      drinksCoverSub: "Cervejas, vinhos, sangrias e gins",
    },
    brewery: {
      eyebrow: "Cervejaria",
      titleLine1: "Cerveja",
      titleLine2: "para acompanhar",
      description:
        "Cerveja de pressão, garrafas especiais e sugestões que combinam com o que pedires. A carta muda de vez em quando, mas a ideia é sempre a mesma: algo fresco para acompanhar a comida.",
      imageAlt: "Cervejas no bar da Cinquenta & Seis",
    },
    gallery: {
      eyebrow: "Galeria",
      title: "Momentos à mesa",
      subtitle: "Fotos reais do que saem da cozinha.",
    },
    glovo: {
      eyebrow: "Entrega",
      title: "Pedir no Glovo",
      subtitle:
        "Hambúrgueres, francesinhas e petiscos — à tua porta em Fafe.",
      note: "Disponível na app Glovo. O mesmo sabor da casa, entregue em casa.",
      cta: "Abrir no",
      tapToOrder: "Toca para pedir",
    },
    reviews: {
      eyebrow: "Opiniões",
      title: "O que dizem os clientes",
      subtitle: "Críticas reais no Google.",
      basedOn: "Com base em",
      reviews: "opiniões",
    },
    contact: {
      eyebrow: "Contacto",
      title: "Onde estamos",
      subtitle:
        "No centro de Fafe. Reserva por telefone ou aparece connosco — mesa, esplanada ou take-away.",
      book: "Reservar",
      contactUs: "Contactar",
      call: "Ligar",
      directions: "Direções",
      glovo: "Pedir no Glovo",
      hours: "Horário",
      address: "Morada",
      phone: "Telefone",
      follow: "Segue-nos",
      viewMap: "Ver no mapa",
      closed: "Encerrado",
    },
    footer: {
      rights: "© 2026 Cinquenta & Seis. Todos os direitos reservados.",
      about: "Sobre",
      reviews: "Opiniões",
      contact: "Contacto",
      staff: "Área staff",
    },
    mobileBar: {
      menu: "Carta",
      book: "Reserva",
      contact: "Contacto",
      glovo: "Glovo",
    },
    hours: [
      { days: "Segunda", time: "Encerrado" },
      { days: "Terça – Sexta", time: "08:30 – 00:00" },
      { days: "Sábado", time: "08:30 – 00:00" },
      { days: "Domingo", time: "17:00 – 00:00" },
    ],
  },
  en: {
    nav: {
      about: "About",
      menu: "Menu",
      gallery: "Gallery",
      reviews: "Reviews",
      brewery: "Brewery",
      contact: "Contact",
      staff: "Staff",
      openMenu: "Menu",
      book: "Book a table",
      bookNav: "Book",
      contactUs: "Contact us",
      glovo: "Glovo",
    },
    hero: {
      tagline: "Burger House & Brewery · Fafe",
      titleLine1: "Real flavour.",
      titleLine2: "Feels like home.",
      description:
        "Craft burgers, francesinhas, steak sandwiches and well-poured beer — in the heart of Fafe since 2019.",
      viewMenu: "View menu",
      call: "Call",
      directions: "Directions",
      openNow: "Open now",
      closed: "Closed",
      closedMonday: "Monday",
      sundayHours: "Sunday · 5:00 PM – 12:00 AM",
      weekdayHours: "Tue–Sat · 8:30 AM – 12:00 AM",
      since: "2019",
      sinceLabel: "In Fafe",
      glovoOrder: "Order on",
      scrollHint: "Explore",
    },
    about: {
      eyebrow: "About us",
      titleLine1: "In Fafe",
      titleLine2: "since 2019.",
      p1: "Cinquenta & Seis started with a simple goal: great food in a welcoming space. Today you'll find Portuguese and international beers, chicken and beef burgers, francesinhas, steak sandwiches, kebab and sharing plates.",
      p2: "Indoor seating, outdoor terrace, takeaway and phone orders. What matters is that you leave happy.",
      imageAlt: "Cinquenta & Seis interior",
    },
    menu: {
      eyebrow: "Menu",
      title: "Digital menu",
      subtitle: "Our menu as a book — just like at the table.",
      food: "Food",
      drinks: "Drinks",
      loading: "Opening menu…",
      unavailable: "Menu unavailable at the moment.",
      bookPage: "Digital menu",
      qrHint: "Scan the QR at your table to view the menu on your phone.",
      openFull: "View full menu",
      backToSite: "Back to website",
      tapToOpen: "Tap to open",
      pagePrev: "Previous page",
      pageNext: "Next page",
      foodCover: "Food",
      foodCoverSub: "Burgers, starters and desserts",
      drinksCover: "Drinks",
      drinksCoverSub: "Beers, wines, sangrias and gins",
    },
    brewery: {
      eyebrow: "Brewery",
      titleLine1: "Beer",
      titleLine2: "to pair with food",
      description:
        "Draft beer, special bottles and suggestions that match what you order. The list changes from time to time, but the idea stays the same: something fresh to go with your meal.",
      imageAlt: "Beers at Cinquenta & Seis bar",
    },
    gallery: {
      eyebrow: "Gallery",
      title: "Moments at the table",
      subtitle: "Real photos from our kitchen.",
    },
    glovo: {
      eyebrow: "Delivery",
      title: "Order on Glovo",
      subtitle:
        "Burgers, francesinhas and snacks — delivered to your door in Fafe.",
      note: "Available on the Glovo app. The same house flavour, brought home.",
      cta: "Open on",
      tapToOrder: "Tap to order",
    },
    reviews: {
      eyebrow: "Reviews",
      title: "What customers say",
      subtitle: "Real Google reviews.",
      basedOn: "Based on",
      reviews: "reviews",
    },
    contact: {
      eyebrow: "Contact",
      title: "Find us",
      subtitle:
        "In the centre of Fafe. Book by phone or drop by — dine in, terrace or takeaway.",
      book: "Book",
      contactUs: "Contact us",
      call: "Call",
      directions: "Directions",
      glovo: "Order on Glovo",
      hours: "Hours",
      address: "Address",
      phone: "Phone",
      follow: "Follow us",
      viewMap: "View on map",
      closed: "Closed",
    },
    footer: {
      rights: "© 2026 Cinquenta & Seis. All rights reserved.",
      about: "About",
      reviews: "Reviews",
      contact: "Contact",
      staff: "Staff area",
    },
    mobileBar: {
      menu: "Menu",
      book: "Book",
      contact: "Contact",
      glovo: "Glovo",
    },
    hours: [
      { days: "Monday", time: "Closed" },
      { days: "Tuesday – Friday", time: "8:30 AM – 12:00 AM" },
      { days: "Saturday", time: "8:30 AM – 12:00 AM" },
      { days: "Sunday", time: "5:00 PM – 12:00 AM" },
    ],
  },
};
