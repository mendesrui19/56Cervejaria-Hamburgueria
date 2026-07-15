const FETCH_OPTIONS: RequestInit = { credentials: "include" };

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...FETCH_OPTIONS, ...options });

  if (res.status === 401 && typeof window !== "undefined") {
    const dest = encodeURIComponent(window.location.pathname);
    window.location.href = `/sistema?next=${dest}`;
    throw new Error("Sessão expirada");
  }

  return res;
}

export async function loginWithPin(pin: string) {
  const res = await fetch("/api/auth/pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "PIN incorreto");
  }
  return res.json();
}

export async function logoutStaff() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (typeof window !== "undefined") {
    window.location.href = "/sistema";
  }
}

export async function fetchState() {
  const res = await apiFetch("/api/state", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar estado");
  return res.json();
}

export async function openTable(
  tableNumber: number,
  waiterName: string,
  guestCount?: number
) {
  const res = await apiFetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableNumber, waiterName, guestCount }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao abrir mesa");
  }
  return res.json();
}

export async function addItem(
  tableNumber: number,
  payload: {
    menuItemId: string;
    quantity: number;
    customizations: Array<{
      groupId: string;
      groupLabel: string;
      optionId: string;
      optionLabel: string;
    }>;
    notes: string;
    parentItemId?: string;
  }
) {
  const res = await apiFetch(`/api/orders/${tableNumber}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao adicionar item");
  }
  return res.json();
}

export async function removeItem(tableNumber: number, itemId: string) {
  const res = await apiFetch(`/api/orders/${tableNumber}/items/${itemId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao remover item");
  }
  return res.json();
}

export async function cancelItem(tableNumber: number, itemId: string) {
  const res = await apiFetch(`/api/orders/${tableNumber}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cancel: true }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao cancelar item");
  }
  return res.json();
}

export async function updateOrderItem(
  tableNumber: number,
  itemId: string,
  payload: {
    quantity?: number;
    customizations?: Array<{
      groupId: string;
      groupLabel: string;
      optionId: string;
      optionLabel: string;
    }>;
    notes?: string;
  }
) {
  const res = await apiFetch(`/api/orders/${tableNumber}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao atualizar item");
  }
  return res.json();
}

export async function transferTable(
  fromTableNumber: number,
  toTableNumber: number
) {
  const res = await apiFetch(`/api/tables/${fromTableNumber}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toTableNumber }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao transferir mesa");
  }
  return res.json();
}

export async function mergeTables(
  primaryTableNumber: number,
  withTableNumber: number
) {
  const res = await apiFetch(`/api/tables/${primaryTableNumber}/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ withTableNumber }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao juntar mesas");
  }
  return res.json();
}

export async function updateGuestCount(tableNumber: number, guestCount: number) {
  const res = await apiFetch(`/api/tables/${tableNumber}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestCount }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao actualizar pessoas");
  }
  return res.json();
}

export async function dismissKitchenAlert(orderId: string) {
  const res = await apiFetch(`/api/kitchen/orders/${orderId}/alert`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao limpar alerta");
  }
  return res.json();
}

export async function sendToKitchen(tableNumber: number, itemIds?: string[]) {
  const res = await apiFetch(`/api/orders/${tableNumber}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao enviar para cozinha");
  }
  return res.json();
}

export async function updateItemStatus(itemId: string, status: string) {
  const res = await apiFetch(`/api/kitchen/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao atualizar estado");
  }
  return res.json();
}

export async function requestBill(tableNumber: number) {
  const res = await apiFetch(`/api/tables/${tableNumber}/bill`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao pedir conta");
  }
  return res.json();
}

export async function reopenTableRound(tableNumber: number, actor?: string) {
  const res = await apiFetch(`/api/tables/${tableNumber}/reopen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao reabrir mesa");
  }
  return res.json();
}

export async function clearTable(tableNumber: number, actor?: string) {
  const res = await apiFetch(`/api/tables/${tableNumber}/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao fechar mesa");
  }
  return res.json();
}

export async function processPayment(
  tableNumber: number,
  payload: {
    paymentMethod: string;
    tip?: number;
    paymentCash?: number;
    paymentCard?: number;
    loyaltyDiscount?: number;
    loyaltyMemberId?: string;
    loyaltyRewardId?: number;
  }
) {
  const res = await apiFetch(`/api/cashier/${tableNumber}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao processar pagamento");
  }
  return res.json();
}

export async function fetchRecentPayments() {
  const res = await apiFetch("/api/cashier/recent", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar pagamentos recentes");
  return res.json();
}

export async function fetchDayClose() {
  const res = await apiFetch("/api/cashier/close", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar fecho do dia");
  return res.json();
}

export async function voidPayment(orderId: string) {
  const res = await apiFetch(`/api/cashier/orders/${orderId}/void`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao anular pagamento");
  }
  return res.json();
}

export async function fetchKitchen() {
  const res = await apiFetch("/api/kitchen", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar cozinha");
  return res.json();
}

export async function fetchCashier() {
  const res = await apiFetch("/api/cashier", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar caixa");
  return res.json();
}

export async function fetchAdminAnalytics(period: string, date?: string) {
  const params = new URLSearchParams({ period });
  if (date) params.set("date", date);
  const res = await apiFetch(`/api/admin/analytics?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao carregar KPIs");
  return res.json();
}

export async function fetchAdminHistory(
  period: string,
  options?: { date?: string; table?: number }
) {
  const params = new URLSearchParams({ period });
  if (options?.date) params.set("date", options.date);
  if (options?.table) params.set("table", String(options.table));
  const res = await apiFetch(`/api/admin/history?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao carregar histórico");
  return res.json();
}

export async function fetchAdminCatalog() {
  const res = await apiFetch("/api/admin/catalog", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar catálogo");
  return res.json();
}

export async function updateCatalogItem(
  id: string,
  payload: {
    name?: string;
    price?: number;
    active?: boolean;
    categoryId?: string;
    skipKitchen?: boolean;
    isAddon?: boolean;
    kitchenNotes?: string;
  }
) {
  const res = await apiFetch(`/api/admin/catalog/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao atualizar item");
  }
  return res.json();
}

export async function createCatalogItem(payload: {
  name: string;
  price: number;
  categoryId: string;
  skipKitchen?: boolean;
  isAddon?: boolean;
  kitchenNotes?: string;
}) {
  const res = await apiFetch("/api/admin/catalog/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao criar produto");
  }
  return res.json();
}

export async function deleteCatalogItem(id: string) {
  const res = await apiFetch(`/api/admin/catalog/items/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao remover produto");
  }
  return res.json();
}

export async function fetchAdminAudit() {
  const res = await apiFetch("/api/admin/audit", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar auditoria");
  return res.json();
}
