import Link from "next/link";

const roles = [
  {
    href: "/empregado",
    title: "Empregado de Mesa",
    abbr: "EMP",
    description:
      "Tomar pedidos, personalizar hambúrgueres, adicionar extras e enviar para a cozinha.",
    color: "from-amber-50 to-white",
  },
  {
    href: "/cozinha",
    title: "Cozinha",
    abbr: "CZ",
    description:
      "Ver todos os pedidos com ingredientes completos. Marcar como pronto.",
    color: "from-red-50 to-white",
  },
  {
    href: "/caixa",
    title: "Caixa",
    abbr: "CX",
    description:
      "Pagamentos, contas por mesa e gestão de mesas quando for preciso.",
    color: "from-green-50 to-white",
  },
  {
    href: "/admin",
    title: "Admin",
    abbr: "ADM",
    description:
      "Gerir catálogo e preços, histórico de mesas e KPIs do restaurante.",
    color: "from-blue-50 to-white",
  },
];

export default function SistemaPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 safe-bottom">
      <div className="text-center mb-8 sm:mb-12 max-w-lg">
        <Link
          href="/"
          className="inline-block text-brand-muted text-xs font-semibold uppercase tracking-widest mb-4 hover:text-brand-gold transition-colors"
        >
          Voltar ao site
        </Link>
        <p className="text-brand-gold text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">
          Sistema de Gestão
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-gold mb-3">
          Cinquenta & Seis
        </h1>
        <p className="text-brand-muted text-base sm:text-lg px-2">
          Pedidos em tempo real — do empregado à cozinha e à caixa.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-5 w-full max-w-2xl">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className={`card bg-gradient-to-r ${role.color} active:scale-[0.98] transition-transform touch-manipulation min-h-[80px] border-brand-line shadow-sm`}
          >
            <div className="flex items-center gap-4 sm:gap-5">
              <span className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center text-brand-gold font-display font-bold text-xs sm:text-sm tracking-wider">
                {role.abbr}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-brand-gold">
                  {role.title}
                </h2>
                <p className="text-brand-muted text-sm mt-0.5 leading-snug">
                  {role.description}
                </p>
              </div>
              <span className="text-brand-gold text-sm font-bold uppercase tracking-wider opacity-60">
                Abrir
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-brand-muted text-xs mt-8 sm:mt-10 text-center max-w-md px-4 leading-relaxed">
        Otimizado para telemóvel e tablet. PIN de staff partilhado — uma vez por
        turno, válido até às 04:00.
        <span className="block mt-2 text-brand-gold/80">
          Abre Empregado, Cozinha ou Caixa e instala no ecrã inicial (Android:
          Instalar · iPhone: Partilhar → Adicionar ao Ecrã Principal).
        </span>
      </p>
    </main>
  );
}
