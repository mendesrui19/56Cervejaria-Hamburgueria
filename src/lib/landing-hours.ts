export function getOpenStatus(
  now = new Date(),
  locale: "pt" | "en" = "pt"
): {
  isOpen: boolean;
  label: string;
  detail: string;
} {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isEn = locale === "en";

  if (day === 1) {
    return {
      isOpen: false,
      label: isEn ? "Closed" : "Fechado",
      detail: isEn ? "Monday" : "Segunda-feira",
    };
  }

  if (day === 0) {
    const open = 17 * 60;
    const close = 24 * 60;
    const isOpen = minutes >= open && minutes < close;
    return {
      isOpen,
      label: isOpen
        ? isEn
          ? "Open now"
          : "Aberto agora"
        : isEn
          ? "Closed"
          : "Fechado",
      detail: isEn ? "Sunday · 5:00 PM – 12:00 AM" : "Domingo · 17:00 – 00:00",
    };
  }

  const open = 8 * 60 + 30;
  const close = 24 * 60;
  const isOpen = minutes >= open && minutes < close;
  return {
    isOpen,
    label: isOpen
      ? isEn
        ? "Open now"
        : "Aberto agora"
      : isEn
        ? "Closed"
        : "Fechado",
    detail: isEn ? "Tue–Sat · 8:30 AM – 12:00 AM" : "Ter–Sáb · 08:30 – 00:00",
  };
}
