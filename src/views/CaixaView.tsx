"use client";

import { useCallback, useState } from "react";
import { AppHeader, SegmentedControl } from "@/components/AppHeader";
import { LogoutButton } from "@/components/LogoutButton";
import { ItemStatusBadge, TableStatusBadge } from "@/components/StatusBadge";
import { fetchCashier, fetchDayClose, fetchRecentPayments, processPayment, voidPayment } from "@/lib/api";
import { lookupLoyaltyMember } from "@/lib/loyalty-api";
import {
  suggestedLoyaltyDiscount,
  type LoyaltyMemberProfile,
  type LoyaltyRewardRow,
} from "@/lib/loyalty";
import { formatPrice, isExtraCustomization } from "@/lib/menu";
import { isBalcaoTable, tableFullLabel } from "@/lib/table-labels";
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
  const waitingBill = entry.table.status === "a_pagar";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all touch-manipulation rounded-xl border px-3 py-2.5 ${
        selected
          ? "border-brand-gold bg-amber-50 shadow-sm"
          : waitingBill
          ? "border-orange-400 bg-orange-50 shadow-sm ring-1 ring-orange-200"
          : "border-brand-line bg-white active:bg-brand-dark"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-brand-gold text-xl tabular-nums leading-none">
          {isBalcaoTable(entry.table.number) ? "Balcão" : entry.table.number}
        </span>
        <TableStatusBadge status={entry.table.status} />
      </div>
      <p className="font-black text-brand-gold text-lg mt-1 tabular-nums leading-none">
        {formatPrice(entry.subtotal)}
      </p>
      <p className="text-xs text-brand-muted mt-1 truncate">
        {waitingBill ? "Conta pedida · " : ""}
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
  loyaltyDiscount,
  loyaltyLabel,
  loyaltyCode,
  loyaltyLookingUp,
  loyaltyMember,
  loyaltyRewards,
  onTipChange,
  onMethodChange,
  onCashChange,
  onCardChange,
  onLoyaltyCodeChange,
  onLoyaltyLookup,
  onApplyReward,
  onClearLoyalty,
  onPay,
}: {
  subtotal: number;
  tip: number;
  paymentMethod: PaymentMethod;
  paymentCash: number;
  paymentCard: number;
  loading: boolean;
  loyaltyDiscount: number;
  loyaltyLabel?: string;
  loyaltyCode: string;
  loyaltyLookingUp: boolean;
  loyaltyMember: LoyaltyMemberProfile | null;
  loyaltyRewards: LoyaltyRewardRow[];
  onTipChange: (tip: number) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onCashChange: (cash: number) => void;
  onCardChange: (card: number) => void;
  onLoyaltyCodeChange: (code: string) => void;
  onLoyaltyLookup: () => void;
  onApplyReward: (reward: LoyaltyRewardRow) => void;
  onClearLoyalty: () => void;
  onPay: () => void;
}) {
  const total = Math.max(0, subtotal - loyaltyDiscount + tip);

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

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        <div className="rounded-xl border border-brand-line bg-brand-dark/20 p-3 space-y-2">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            App 56
          </p>
          <div className="flex gap-2">
            <input
              className="input !min-h-[40px] !py-2 text-sm flex-1"
              placeholder="Código / QR do cliente"
              value={loyaltyCode}
              onChange={(e) => onLoyaltyCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onLoyaltyLookup();
              }}
            />
            <button
              type="button"
              onClick={onLoyaltyLookup}
              disabled={loyaltyLookingUp || !loyaltyCode.trim()}
              className="btn-secondary !min-h-[40px] !px-3 text-xs shrink-0"
            >
              {loyaltyLookingUp ? "…" : "Ler"}
            </button>
          </div>

          {loyaltyMember && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-gold truncate">
                  {loyaltyMember.name}
                </p>
                <button
                  type="button"
                  onClick={onClearLoyalty}
                  className="text-[10px] font-bold text-brand-muted uppercase"
                >
                  Limpar
                </button>
              </div>
              {loyaltyDiscount > 0 && loyaltyLabel ? (
                <p className="text-xs font-semibold text-emerald-700">
                  {loyaltyLabel} (−{formatPrice(loyaltyDiscount)})
                </p>
              ) : loyaltyRewards.length === 0 ? (
                <p className="text-xs text-brand-muted">Sem recompensas disponíveis</p>
              ) : (
                <div className="space-y-1.5">
                  {loyaltyRewards.map((reward) => (
                    <button
                      key={reward.id}
                      type="button"
                      onClick={() => onApplyReward(reward)}
                      className="w-full text-left rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-900"
                    >
                      Aplicar: {reward.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <label className="block">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wide">
            Gorjeta
          </span>
          <input
            type="number"
            min={0}
            step={0.5}
            className="input mt-1 !min-h-[44px]"
            value={tip || ""}
            onChange={(e) => onTipChange(Number(e.target.value) || 0)}
          />
        </label>

        {paymentMethod === "misto" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-bold text-brand-muted">Dinheiro</span>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input mt-1 !min-h-[44px]"
                value={paymentCash || ""}
                onChange={(e) => onCashChange(Number(e.target.value) || 0)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-brand-muted">Cartão</span>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input mt-1 !min-h-[44px]"
                value={paymentCard || ""}
                onChange={(e) => onCardChange(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-brand-line p-3 space-y-2">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-brand-muted">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Desconto</span>
              <span className="tabular-nums">−{formatPrice(loyaltyDiscount)}</span>
            </div>
          )}
          {tip > 0 && (
            <div className="flex justify-between text-brand-muted">
              <span>Gorjeta</span>
              <span className="tabular-nums">{formatPrice(tip)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-brand-gold text-lg pt-1">
            <span>Total</span>
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
  loyaltyDiscount,
  loyaltyLabel,
  loyaltyCode,
  loyaltyLookingUp,
  loyaltyMember,
  loyaltyRewards,
  onTipChange,
  onMethodChange,
  onCashChange,
  onCardChange,
  onLoyaltyCodeChange,
  onLoyaltyLookup,
  onApplyReward,
  onClearLoyalty,
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
  loyaltyDiscount: number;
  loyaltyLabel?: string;
  loyaltyCode: string;
  loyaltyLookingUp: boolean;
  loyaltyMember: LoyaltyMemberProfile | null;
  loyaltyRewards: LoyaltyRewardRow[];
  onTipChange: (tip: number) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onCashChange: (cash: number) => void;
  onCardChange: (card: number) => void;
  onLoyaltyCodeChange: (code: string) => void;
  onLoyaltyLookup: () => void;
  onApplyReward: (reward: LoyaltyRewardRow) => void;
  onClearLoyalty: () => void;
  onPay: () => void;
  onBack?: () => void;
}) {
  const items = entry.order.items.filter(
    (i) => i.status !== "cancelado" && !i.isAddon
  );
  const payable = Math.max(0, entry.subtotal - loyaltyDiscount + tip);

  const paymentProps = {
    subtotal: entry.subtotal,
    tip,
    paymentMethod,
    paymentCash,
    paymentCard,
    loading,
    loyaltyDiscount,
    loyaltyLabel,
    loyaltyCode,
    loyaltyLookingUp,
    loyaltyMember,
    loyaltyRewards,
    onTipChange,
    onMethodChange,
    onCashChange,
    onCardChange,
    onLoyaltyCodeChange,
    onLoyaltyLookup,
    onApplyReward,
    onClearLoyalty,
    onPay,
  };

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
                {tableFullLabel(entry.table.number)}
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
            {formatPrice(payable)}
          </p>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_17rem] xl:grid-cols-[1fr_19rem] overflow-hidden">
          <div className="flex flex-col min-h-0 border-r border-brand-line bg-brand-dark/30">
            <p className="shrink-0 px-3 py-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-line/80 bg-white">
              Conta
            </p>
            {billItems}
          </div>
          <PaymentPanel {...paymentProps} />
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
              {tableFullLabel(entry.table.number)}
            </h2>
            <TableStatusBadge status={entry.table.status} />
          </div>
          <p className="text-xs text-brand-muted truncate">
            {entry.order.waiterName}
            {entry.table.guestCount ? ` · ${entry.table.guestCount}p` : ""}
          </p>
        </div>
        <p className="text-xl font-black text-brand-gold tabular-nums shrink-0">
          {formatPrice(payable)}
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <p className="shrink-0 px-3 py-1 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-line bg-white">
          Conta
        </p>
        {billItems}
      </div>

      <div className="shrink-0 border-t border-brand-line max-h-[50dvh] overflow-y-auto">
        <PaymentPanel {...paymentProps} />
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
  const [loyaltyCode, setLoyaltyCode] = useState("");
  const [loyaltyLookingUp, setLoyaltyLookingUp] = useState(false);
  const [loyaltyMember, setLoyaltyMember] = useState<LoyaltyMemberProfile | null>(
    null
  );
  const [loyaltyRewardId, setLoyaltyRewardId] = useState<number | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyLabel, setLoyaltyLabel] = useState<string | undefined>();

  const loyaltyRewards =
    loyaltyMember?.rewards.filter((r) => !r.redeemedAt) ?? [];

  const clearLoyalty = useCallback(() => {
    setLoyaltyCode("");
    setLoyaltyMember(null);
    setLoyaltyRewardId(null);
    setLoyaltyDiscount(0);
    setLoyaltyLabel(undefined);
  }, []);

  const syncMistoSplit = useCallback(
    (cash: number, card: number) => {
      setPaymentCash(cash);
      setPaymentCard(card);
    },
    []
  );

  const payableTotal = selected
    ? Math.max(0, selected.subtotal - loyaltyDiscount + tip)
    : 0;

  const handleMethodChange = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethod(method);
      if (method === "misto" && selected) {
        syncMistoSplit(payableTotal, 0);
      }
    },
    [selected, payableTotal, syncMistoSplit]
  );

  const handleCashChange = useCallback(
    (cash: number) => {
      if (!selected) return;
      syncMistoSplit(
        cash,
        Math.max(0, Math.round((payableTotal - cash) * 100) / 100)
      );
    },
    [selected, payableTotal, syncMistoSplit]
  );

  const handleCardChange = useCallback(
    (card: number) => {
      if (!selected) return;
      syncMistoSplit(
        Math.max(0, Math.round((payableTotal - card) * 100) / 100),
        card
      );
    },
    [selected, payableTotal, syncMistoSplit]
  );

  const handleLoyaltyLookup = useCallback(async () => {
    if (!loyaltyCode.trim()) return;
    setLoyaltyLookingUp(true);
    try {
      const member = await lookupLoyaltyMember(loyaltyCode.trim());
      setLoyaltyMember(member);
      setLoyaltyRewardId(null);
      setLoyaltyDiscount(0);
      setLoyaltyLabel(undefined);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cliente não encontrado");
      setLoyaltyMember(null);
    } finally {
      setLoyaltyLookingUp(false);
    }
  }, [loyaltyCode]);

  const handleApplyReward = useCallback(
    (reward: LoyaltyRewardRow) => {
      if (!selected) return;
      const items = selected.order.items.filter(
        (i) => i.status !== "cancelado" && !i.isAddon
      );
      const discount = Math.min(
        selected.subtotal,
        suggestedLoyaltyDiscount(reward.type, items)
      );
      setLoyaltyRewardId(reward.id);
      setLoyaltyDiscount(discount);
      setLoyaltyLabel(reward.label);
      if (paymentMethod === "misto") {
        const nextTotal = Math.max(0, selected.subtotal - discount + tip);
        syncMistoSplit(nextTotal, 0);
      }
    },
    [selected, paymentMethod, tip, syncMistoSplit]
  );

  const handlePay = useCallback(async () => {
    if (!selected) return;
    const total = Math.max(0, selected.subtotal - loyaltyDiscount + tip);
    if (
      !window.confirm(
        `Confirmar pagamento de ${tableFullLabel(selected.table.number)} — ${formatPrice(total)}?`
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
        ...(loyaltyDiscount > 0 && loyaltyMember && loyaltyRewardId
          ? {
              loyaltyDiscount,
              loyaltyMemberId: loyaltyMember.id,
              loyaltyRewardId,
            }
          : {}),
      });
      setSuccess(
        `${tableFullLabel(selected.table.number)} pago — ${formatPrice(result.total)}`
      );
      setSelected(null);
      setTip(0);
      setPaymentCash(0);
      setPaymentCard(0);
      clearLoyalty();
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
    loyaltyDiscount,
    loyaltyMember,
    loyaltyRewardId,
    clearLoyalty,
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
        const next = Math.max(0, selected.subtotal - loyaltyDiscount + newTip);
        syncMistoSplit(next, 0);
      }
    },
    [paymentMethod, selected, loyaltyDiscount, syncMistoSplit]
  );

  const handleSelectTable = useCallback(
    (entry: CashierEntry) => {
      setSelected(entry);
      clearLoyalty();
      if (paymentMethod === "misto") {
        setPaymentCash(entry.subtotal + tip);
        setPaymentCard(0);
      }
    },
    [paymentMethod, tip, clearLoyalty]
  );

  const activeTables =
    entries
      ?.slice()
      .sort((a, b) => {
        const aBill = a.table.status === "a_pagar" ? 0 : 1;
        const bBill = b.table.status === "a_pagar" ? 0 : 1;
        if (aBill !== bBill) return aBill - bBill;
        return a.table.number - b.table.number;
      }) ?? [];

  if (tab === "fecho") {
    return (
      <div className="staff-safe-screen h-dvh flex flex-col overflow-hidden">
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
      <div className="staff-safe-screen h-dvh flex flex-col overflow-hidden">
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
    <div className="staff-safe-screen h-dvh flex flex-col overflow-hidden">
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
                  loyaltyDiscount={loyaltyDiscount}
                  loyaltyLabel={loyaltyLabel}
                  loyaltyCode={loyaltyCode}
                  loyaltyLookingUp={loyaltyLookingUp}
                  loyaltyMember={loyaltyMember}
                  loyaltyRewards={loyaltyRewards}
                  onTipChange={handleTipChange}
                  onMethodChange={handleMethodChange}
                  onCashChange={handleCashChange}
                  onCardChange={handleCardChange}
                  onLoyaltyCodeChange={setLoyaltyCode}
                  onLoyaltyLookup={() => void handleLoyaltyLookup()}
                  onApplyReward={handleApplyReward}
                  onClearLoyalty={clearLoyalty}
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
              loyaltyDiscount={loyaltyDiscount}
              loyaltyLabel={loyaltyLabel}
              loyaltyCode={loyaltyCode}
              loyaltyLookingUp={loyaltyLookingUp}
              loyaltyMember={loyaltyMember}
              loyaltyRewards={loyaltyRewards}
              onTipChange={handleTipChange}
              onMethodChange={handleMethodChange}
              onCashChange={handleCashChange}
              onCardChange={handleCardChange}
              onLoyaltyCodeChange={setLoyaltyCode}
              onLoyaltyLookup={() => void handleLoyaltyLookup()}
              onApplyReward={handleApplyReward}
              onClearLoyalty={clearLoyalty}
              onPay={handlePay}
              onBack={() => {
                setSelected(null);
                clearLoyalty();
              }}
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
