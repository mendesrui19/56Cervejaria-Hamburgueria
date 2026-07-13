"use client";

import { useCallback, useState } from "react";
import { AppHeader, SegmentedControl } from "@/components/AppHeader";
import { LogoutButton } from "@/components/LogoutButton";
import { ItemStatusBadge, TableStatusBadge } from "@/components/StatusBadge";
import { fetchCashier, fetchDayClose, fetchRecentPayments, processPayment, voidPayment } from "@/lib/api";
import { formatPrice, isExtraCustomization } from "@/lib/menu";
import type { DayCloseSummary, Order, OrderItem, PaymentMethod, RecentPaymentEntry, Table } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { WaiterTableFlow } from "@/views/shared/WaiterTableFlow";

interface CashierEntry {
  table: Table;
  order: Order;
  subtotal: number;
  itemCount: number;
}

type CaixaTab = "pagamentos" | "mesas" | "fecho";

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "multibanco", label: "Multibanco" },
  { id: "mbway", label: "MB Way" },
  { id: "misto", label: "Misto" },
];

const CAIXA_TABS = [
  { id: "pagamentos", label: "Pagamentos" },
  { id: "mesas", label: "Mesas" },
  { id: "fecho", label: "Fecho" },
] as const;

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  multibanco: "Multibanco",
  mbway: "MB Way",
  misto: "Misto",
};

function formatRecentPayment(entry: RecentPaymentEntry): string {
  if (entry.paymentMethod === "misto") {
    return `Misto · ${formatPrice(entry.paymentCash ?? 0)} + ${formatPrice(entry.paymentCard ?? 0)}`;
  }
  return PAYMENT_LABELS[entry.paymentMethod ?? "multibanco"];
}

const CAIXA_SPLIT = "(min-width: 1024px)";

function formatItemModifiers(item: OrderItem): string | null {
  const parts: string[] = [];

  for (const c of item.customizations) {
    if (isExtraCustomization(c.groupId)) {
      parts.push(`+${c.optionLabel}`);
    } else {
      parts.push(c.optionLabel);
    }
  }

  if (item.skipKitchen) parts.push("Bar");

  return parts.length > 0 ? parts.join(" · ") : null;
}

function TableListButton({
  entry,
  selected,
  onClick,
}: {
  entry: CashierEntry;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all touch-manipulation rounded-xl border px-3 py-2.5 ${
        selected
          ? "border-brand-gold bg-amber-50 shadow-sm"
          : "border-brand-line bg-white active:bg-brand-dark"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-brand-gold text-2xl tabular-nums leading-none">
          {entry.table.number}
        </span>
        <TableStatusBadge status={entry.table.status} />
      </div>
      <p className="font-black text-brand-gold text-lg mt-1 tabular-nums leading-none">
        {formatPrice(entry.subtotal)}
      </p>
      <p className="text-xs text-brand-muted mt-1 truncate">
        {entry.itemCount} itens · {entry.order.waiterName}
      </p>
    </button>
  );
}

function BillItemRow({ item }: { item: OrderItem }) {
  const mods = formatItemModifiers(item);

  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-2 border-b border-brand-line/70 last:border-0 items-start">
      <div className="min-w-0">
        <p className="font-bold text-base text-stone-900 leading-tight">
          {item.quantity > 1 && (
            <span className="text-brand-gold mr-1">{item.quantity}×</span>
          )}
          {item.name}
        </p>
        {mods && (
          <p className="text-sm text-brand-muted truncate mt-0.5">{mods}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-black text-base text-brand-gold tabular-nums leading-tight">
          {formatPrice(item.price * item.quantity)}
        </p>
        {!item.skipKitchen && item.status !== "entregue" && (
          <div className="mt-1 flex justify-end">
            <ItemStatusBadge status={item.status} />
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentPanel({
  subtotal,
  tip,
  paymentMethod,
  paymentCash,
  paymentCard,
  loading,
  onTipChange,
  onMethodChange,
  onCashChange,
  onCardChange,
  onPay,
}: {
  subtotal: number;
  tip: number;
  paymentMethod: PaymentMethod;
  paymentCash: number;
  paymentCard: number;
  loading: boolean;
  onTipChange: (tip: number) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onCashChange: (cash: number) => void;
  onCardChange: (card: number) => void;
  onPay: () => void;
}) {
  const total = subtotal + tip;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="shrink-0 p-3 border-b border-brand-line">
        <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-2">
          Pagamento
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onMethodChange(m.id)}
              className={`rounded-lg border px-2 py-2.5 text-sm font-bold min-h-[44px] touch-manipulation ${
                paymentMethod === m.id
                  ? "border-brand-gold bg-amber-50 text-brand-gold"
                  : "border-brand-line text-brand-muted active:bg-brand-dark"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {paymentMethod === "misto" && (
        <div className="shrink-0 px-3 py-2 border-b border-brand-line space-y-2">
          <div>
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wide block mb-1">
              Dinheiro
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              className="input !min-h-[44px] !py-2 text-base font-bold"
              value={paymentCash || ""}
              onChange={(e) => onCashChange(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wide block mb-1">
              Cartão (MB / MB Way)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              className="input !min-h-[44px] !py-2 text-base font-bold"
              value={paymentCard || ""}
              onChange={(e) => onCardChange(parseFloat(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-brand-muted">
            Soma: {formatPrice(paymentCash + paymentCard)} / Total:{" "}
            {formatPrice(total)}
          </p>
        </div>
      )}

      <div className="shrink-0 px-3 py-2 border-b border-brand-line">
        <label className="text-xs font-bold text-brand-muted uppercase tracking-wide block mb-1.5">
          Gorjeta
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          inputMode="decimal"
          className="input !min-h-[44px] !py-2 text-base font-bold"
          value={tip || ""}
          onChange={(e) => onTipChange(parseFloat(e.target.value) || 0)}
          placeholder="0,00"
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-end p-3 gap-2 safe-bottom">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-brand-muted font-medium">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-brand-muted font-medium">
              <span>Gorjeta</span>
              <span className="tabular-nums">{formatPrice(tip)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black text-brand-gold pt-1">
            <span>TOTAL</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onPay}
          disabled={loading}
          className="btn-primary w-full text-base py-3.5 min-h-[52px]"
        >
          Confirmar — {formatPrice(total)}
        </button>
      </div>
    </div>
  );
}

function CaixaTabBar({
  active,
  onChange,
}: {
  active: CaixaTab;
  onChange: (tab: CaixaTab) => void;
}) {
  return (
    <div className="border-b border-brand-line bg-white/95 backdrop-blur-md px-3 py-1.5 shrink-0">
      <SegmentedControl
        options={CAIXA_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
        active={active}
        onChange={(id) => onChange(id as CaixaTab)}
      />
    </div>
  );
}

function BillPanel({
  entry,
  tip,
  paymentMethod,
  paymentCash,
  paymentCard,
  loading,
  isSplit,
  onTipChange,
  onMethodChange,
  onCashChange,
  onCardChange,
  onPay,
  onBack,
}: {
  entry: CashierEntry;
  tip: number;
  paymentMethod: PaymentMethod;
  paymentCash: number;
  paymentCard: number;
  loading: boolean;
  isSplit: boolean;
  onTipChange: (tip: number) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onCashChange: (cash: number) => void;
  onCardChange: (card: number) => void;
  onPay: () => void;
  onBack?: () => void;
}) {
  const items = entry.order.items.filter(
    (i) => i.status !== "cancelado" && !i.isAddon
  );

  const billItems = (
    <div className="min-h-0 overflow-y-auto scrollbar-thin px-3 py-1">
      {items.length === 0 ? (
        <p className="text-brand-muted text-sm py-6 text-center">Conta vazia</p>
      ) : (
        items.map((item) => <BillItemRow key={item.id} item={item} />)
      )}
    </div>
  );

  if (isSplit) {
    return (
      <div className="flex flex-col min-h-0 h-full overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-brand-line bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl font-black text-brand-gold leading-none">
                Mesa {entry.table.number}
              </h2>
              <TableStatusBadge status={entry.table.status} />
            </div>
            <p className="text-sm text-brand-muted mt-1 truncate">
              {entry.order.waiterName}
              {entry.table.guestCount
                ? ` · ${entry.table.guestCount} pessoas`
                : ""}
              {" · "}
              {items.length} itens
            </p>
          </div>
          <p className="text-2xl font-black text-brand-gold tabular-nums shrink-0">
            {formatPrice(entry.subtotal + tip)}
          </p>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_17rem] xl:grid-cols-[1fr_19rem] overflow-hidden">
          <div className="flex flex-col min-h-0 border-r border-brand-line bg-brand-dark/30">
            <p className="shrink-0 px-3 py-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-line/80 bg-white">
              Conta
            </p>
            {billItems}
          </div>
          <PaymentPanel
            subtotal={entry.subtotal}
            tip={tip}
            paymentMethod={paymentMethod}
            paymentCash={paymentCash}
            paymentCard={paymentCard}
            loading={loading}
            onTipChange={onTipChange}
            onMethodChange={onMethodChange}
            onCashChange={onCashChange}
            onCardChange={onCardChange}
            onPay={onPay}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-brand-line bg-white">
        <div className="min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-bold text-brand-muted uppercase mb-1"
            >
              ← Mesas
            </button>
          )}
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-black text-brand-gold">
              Mesa {entry.table.number}
            </h2>
            <TableStatusBadge status={entry.table.status} />
          </div>
          <p className="text-xs text-brand-muted truncate">
            {entry.order.waiterName}
            {entry.table.guestCount ? ` · ${entry.table.guestCount}p` : ""}
          </p>
        </div>
        <p className="text-xl font-black text-brand-gold tabular-nums shrink-0">
          {formatPrice(entry.subtotal + tip)}
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <p className="shrink-0 px-3 py-1 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-line bg-white">
          Conta
        </p>
        {billItems}
      </div>

      <div className="shrink-0 border-t border-brand-line max-h-[45dvh] overflow-y-auto">
        <PaymentPanel
          subtotal={entry.subtotal}
          tip={tip}
          paymentMethod={paymentMethod}
          paymentCash={paymentCash}
          paymentCard={paymentCard}
          loading={loading}
          onTipChange={onTipChange}
          onMethodChange={onMethodChange}
          onCashChange={onCashChange}
          onCardChange={onCardChange}
          onPay={onPay}
        />
      </div>
    </div>
  );
}

function DayClosePanel({
  summary,
  voidingId,
  onVoid,
}: {
  summary: DayCloseSummary;
  voidingId: string | null;
  onVoid: (entry: RecentPaymentEntry) => void;
}) {
  const rows = [
    { label: "Dinheiro", value: summary.dinheiro },
    { label: "Multibanco", value: summary.multibanco },
    { label: "MB Way", value: summary.mbway },
    { label: "Misto — dinheiro", value: summary.mistoCash },
    { label: "Misto — cartão", value: summary.mistoCard },
  ].filter((row) => row.value > 0);

  const cashInDrawer = summary.dinheiro + summary.mistoCash;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 max-w-lg mx-auto w-full pb-6">
      <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">
        Fecho do dia
      </p>
      <p className="text-sm text-brand-muted mb-4">{summary.serviceDayLabel}</p>

      <div className="rounded-2xl border border-brand-gold/25 bg-white p-4 space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-brand-muted">Contas fechadas</span>
          <span className="font-bold">{summary.orderCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-brand-muted">Gorjetas</span>
          <span className="font-bold tabular-nums">{formatPrice(summary.tips)}</span>
        </div>
        <div className="flex justify-between text-2xl font-black text-brand-gold pt-2 border-t border-brand-line">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(summary.total)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-4 space-y-2 mb-4">
        <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">
          Por método
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-brand-muted">Sem pagamentos hoje</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span>{row.label}</span>
              <span className="font-bold text-brand-gold tabular-nums">
                {formatPrice(row.value)}
              </span>
            </div>
          ))
        )}
      </div>

      {cashInDrawer > 0 && (
        <div className="rounded-2xl border-2 border-brand-gold/40 bg-amber-50 p-4 mb-4">
          <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">
            Na gaveta (dinheiro)
          </p>
          <p className="text-3xl font-black text-brand-gold tabular-nums">
            {formatPrice(cashInDrawer)}
          </p>
          <p className="text-xs text-brand-muted mt-1">
            Dinheiro + parte em dinheiro do misto
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-brand-line bg-white p-4">
        <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-3">
          Mesas pagas hoje ({summary.payments.length})
        </p>
        {summary.payments.length === 0 ? (
          <p className="text-sm text-brand-muted">Nenhuma conta fechada ainda</p>
        ) : (
          <div className="space-y-2">
            {summary.payments.map((entry) => (
              <div
                key={entry.orderId}
                className="rounded-xl border border-brand-line/80 px-3 py-2.5"
              >
                <div className="flex justify-between gap-3 items-start">
                  <div className="min-w-0">
                    <p className="font-black text-brand-gold">
                      Mesa {entry.tableNumber}
                    </p>
                    <p className="text-xs text-brand-muted truncate">
                      {entry.waiterName}
                    </p>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      {new Date(entry.paidAt).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {formatRecentPayment(entry)}
                      {entry.tip ? ` · gorjeta ${formatPrice(entry.tip)}` : ""}
                    </p>
                  </div>
                  <p className="font-black text-brand-gold tabular-nums shrink-0">
                    {formatPrice(entry.total)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={voidingId === entry.orderId}
                  onClick={() => onVoid(entry)}
                  className="text-[11px] font-semibold text-red-600 mt-2 py-0.5"
                >
                  {voidingId === entry.orderId ? "A anular…" : "Anular pagamento"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecentPaymentsList({
  payments,
  voidingId,
  onVoid,
}: {
  payments: RecentPaymentEntry[];
  voidingId: string | null;
  onVoid: (entry: RecentPaymentEntry) => void;
}) {
  if (payments.length === 0) return null;

  return (
    <div className="border-t border-brand-line p-2 mt-1">
      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest px-1 mb-2">
        Pagamentos recentes
      </p>
      <div className="space-y-1.5">
        {payments.map((entry) => (
          <div
            key={entry.orderId}
            className="rounded-lg border border-brand-line px-2 py-2 bg-white"
          >
            <div className="flex justify-between gap-2 items-start">
              <div className="min-w-0">
                <p className="font-black text-brand-gold text-sm">
                  Mesa {entry.tableNumber}
                </p>
                <p className="text-[10px] text-brand-muted truncate">
                  {new Date(entry.paidAt).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {formatRecentPayment(entry)}
                </p>
              </div>
              <p className="font-bold text-sm text-brand-gold tabular-nums shrink-0">
                {formatPrice(entry.total)}
              </p>
            </div>
            <button
              type="button"
              disabled={voidingId === entry.orderId}
              onClick={() => onVoid(entry)}
              className="text-[10px] font-semibold text-red-600 mt-1.5 py-1"
            >
              {voidingId === entry.orderId ? "A anular…" : "Anular pagamento"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CaixaView() {
  const isSplit = useMediaQuery(CAIXA_SPLIT);
  const [tab, setTab] = useState<CaixaTab>("pagamentos");
  const { data: entries, refresh } = usePolling<CashierEntry[]>(
    fetchCashier,
    3000
  );
  const { data: recentPayments, refresh: refreshRecent } = usePolling<
    RecentPaymentEntry[]
  >(fetchRecentPayments, 5000);
  const { data: dayClose, refresh: refreshClose } = usePolling<DayCloseSummary>(
    fetchDayClose,
    10000
  );
  const [selected, setSelected] = useState<CashierEntry | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("multibanco");
  const [tip, setTip] = useState(0);
  const [paymentCash, setPaymentCash] = useState(0);
  const [paymentCard, setPaymentCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const syncMistoSplit = useCallback(
    (cash: number, card: number) => {
      setPaymentCash(cash);
      setPaymentCard(card);
    },
    []
  );

  const handleMethodChange = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethod(method);
      if (method === "misto" && selected) {
        const total = selected.subtotal + tip;
        syncMistoSplit(total, 0);
      }
    },
    [selected, tip, syncMistoSplit]
  );

  const handleCashChange = useCallback(
    (cash: number) => {
      if (!selected) return;
      const total = selected.subtotal + tip;
      syncMistoSplit(cash, Math.max(0, Math.round((total - cash) * 100) / 100));
    },
    [selected, tip, syncMistoSplit]
  );

  const handleCardChange = useCallback(
    (card: number) => {
      if (!selected) return;
      const total = selected.subtotal + tip;
      syncMistoSplit(Math.max(0, Math.round((total - card) * 100) / 100), card);
    },
    [selected, tip, syncMistoSplit]
  );

  const handlePay = useCallback(async () => {
    if (!selected) return;
    const total = selected.subtotal + tip;
    if (
      !window.confirm(
        `Confirmar pagamento da mesa ${selected.table.number} — ${formatPrice(total)}?`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const result = await processPayment(selected.table.number, {
        paymentMethod,
        tip,
        ...(paymentMethod === "misto"
          ? { paymentCash, paymentCard }
          : {}),
      });
      setSuccess(
        `Mesa ${selected.table.number} paga — ${formatPrice(result.total)}`
      );
      setSelected(null);
      setTip(0);
      setPaymentCash(0);
      setPaymentCard(0);
      refresh();
      refreshRecent();
      refreshClose();
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [
    selected,
    paymentMethod,
    tip,
    paymentCash,
    paymentCard,
    refresh,
    refreshRecent,
    refreshClose,
  ]);

  const handleVoid = useCallback(
    async (entry: RecentPaymentEntry) => {
      if (
        !window.confirm(
          `Anular pagamento da mesa ${entry.tableNumber} (${formatPrice(entry.total)})? A mesa volta ao pedido.`
        )
      ) {
        return;
      }
      setVoidingId(entry.orderId);
      try {
        await voidPayment(entry.orderId);
        setSuccess(`Pagamento mesa ${entry.tableNumber} anulado`);
        refresh();
        refreshRecent();
        refreshClose();
        setTimeout(() => setSuccess(null), 4000);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro");
      } finally {
        setVoidingId(null);
      }
    },
    [refresh, refreshRecent, refreshClose]
  );

  const handleTipChange = useCallback(
    (newTip: number) => {
      setTip(newTip);
      if (paymentMethod === "misto" && selected) {
        syncMistoSplit(selected.subtotal + newTip, 0);
      }
    },
    [paymentMethod, selected, syncMistoSplit]
  );

  const handleSelectTable = useCallback((entry: CashierEntry) => {
    setSelected(entry);
    if (paymentMethod === "misto") {
      setPaymentCash(entry.subtotal + tip);
      setPaymentCard(0);
    }
  }, [paymentMethod, tip]);

  const activeTables =
    entries?.slice().sort((a, b) => a.table.number - b.table.number) ?? [];

  if (tab === "fecho") {
    return (
      <div className="h-dvh flex flex-col overflow-hidden">
        <AppHeader
          title="Caixa"
          subtitle="Fecho do dia"
          backHref="/sistema"
          actions={<LogoutButton />}
        />
        <CaixaTabBar active={tab} onChange={setTab} />
        {dayClose ? (
          <DayClosePanel
            summary={dayClose}
            voidingId={voidingId}
            onVoid={handleVoid}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-brand-muted text-sm">
            A carregar…
          </div>
        )}
      </div>
    );
  }

  if (tab === "mesas") {
    return (
      <div className="h-dvh flex flex-col overflow-hidden">
        <AppHeader
          title="Caixa"
          subtitle="Gestão de mesas"
          backHref="/sistema"
          actions={<LogoutButton />}
        />
        <CaixaTabBar active={tab} onChange={setTab} />
        <div className="flex-1 min-h-0 overflow-hidden">
          <WaiterTableFlow
            showPortalLink={false}
            namePlaceholder="O seu nome"
            nested
          />
        </div>
      </div>
    );
  }

  const showMobileDetail = !isSplit && selected !== null;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <AppHeader
        title="Caixa"
        subtitle={`${activeTables.length} mesa${activeTables.length !== 1 ? "s" : ""} ativa${activeTables.length !== 1 ? "s" : ""}`}
        onBack={showMobileDetail ? () => setSelected(null) : undefined}
        backHref="/sistema"
        backLabel={showMobileDetail ? "Pagamentos" : undefined}
        actions={<LogoutButton />}
      />

      <CaixaTabBar active={tab} onChange={setTab} />

      {success && (
        <div className="mx-3 mt-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-green-800 text-sm font-semibold shrink-0">
          {success}
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        {isSplit ? (
          <>
            <aside className="w-44 lg:w-52 xl:w-56 border-r border-brand-line overflow-y-auto scrollbar-thin p-2 flex flex-col gap-1.5 flex-shrink-0 bg-white">
              {activeTables.length > 0 ? (
                activeTables.map((entry) => (
                  <TableListButton
                    key={entry.table.number}
                    entry={entry}
                    selected={selected?.table.number === entry.table.number}
                    onClick={() => handleSelectTable(entry)}
                  />
                ))
              ) : (
                <p className="text-brand-muted text-xs text-center py-8 px-2">
                  Sem mesas ativas
                </p>
              )}
              <RecentPaymentsList
                payments={recentPayments ?? []}
                voidingId={voidingId}
                onVoid={handleVoid}
              />
            </aside>
            <main className="flex-1 min-h-0 overflow-hidden bg-brand-dark/20">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-brand-muted gap-2">
                  <p className="text-sm font-semibold uppercase tracking-widest">
                    Caixa
                  </p>
                  <p className="text-base">Selecione uma mesa</p>
                </div>
              ) : (
                <BillPanel
                  entry={selected}
                  tip={tip}
                  paymentMethod={paymentMethod}
                  paymentCash={paymentCash}
                  paymentCard={paymentCard}
                  loading={loading}
                  isSplit
                  onTipChange={handleTipChange}
                  onMethodChange={handleMethodChange}
                  onCashChange={handleCashChange}
                  onCardChange={handleCardChange}
                  onPay={handlePay}
                />
              )}
            </main>
          </>
        ) : showMobileDetail && selected ? (
          <main className="flex-1 min-h-0 overflow-hidden w-full">
            <BillPanel
              entry={selected}
              tip={tip}
              paymentMethod={paymentMethod}
              paymentCash={paymentCash}
              paymentCard={paymentCard}
              loading={loading}
              isSplit={false}
              onTipChange={setTip}
              onMethodChange={handleMethodChange}
              onCashChange={handleCashChange}
              onCardChange={handleCardChange}
              onPay={handlePay}
              onBack={() => setSelected(null)}
            />
          </main>
        ) : (
          <aside className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 flex flex-col gap-2 w-full">
            {activeTables.length > 0 ? (
              activeTables.map((entry) => (
                <TableListButton
                  key={entry.table.number}
                  entry={entry}
                  selected={false}
                  onClick={() => handleSelectTable(entry)}
                />
              ))
            ) : (
              <p className="text-brand-muted text-sm text-center py-12">
                Sem mesas ativas
              </p>
            )}
            <RecentPaymentsList
              payments={recentPayments ?? []}
              voidingId={voidingId}
              onVoid={handleVoid}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
