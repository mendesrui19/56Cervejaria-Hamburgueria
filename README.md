# Cinquenta & Seis — Site + Sistema + App 56

Monorepo Next.js para a hamburgueria & cervejaria **Cinquenta & Seis** (Fafe): site público, carta digital, POS staff e App 56.

## Arrancar

```bash
npm install
cp .env.example .env   # preencher DATABASE_URL, STAFF_PIN, etc.
npm run db:push        # schema PostgreSQL (Neon)
npm run db:setup       # seed inicial (se aplicável)
npm run dev            # http://localhost:3056
```

Produção:

```bash
npm run build
npm start              # porta 3056
```

## O que inclui

### Público
| Rota | Descrição |
|------|-----------|
| `/` | Landing (PT/EN), hero, sobre, menu, galeria, reviews, Glovo, contacto |
| `/carta` | Carta digital em livro (page-flip), catálogo activo |

### Staff (`/sistema` — PIN)
| Rota | Descrição |
|------|-----------|
| `/sistema` | Hub + login PIN + PWA |
| `/empregado` | Mesas (1–20) + Balcão (21), pedidos, personalização, enviar cozinha, pedir conta / nova ronda |
| `/cozinha` | Tickets, zonas, pronto/entregue, alertas, sons |
| `/caixa` | Contas a pagar, pagamentos, loyalty, void, fecho do dia |
| `/admin` | Relatórios, histórico, auditoria, catálogo, mapa live, stats App 56 |
| `/app/scanner` | Ler QR/código e adicionar selos |

### App 56 (cliente)
| Rota | Descrição |
|------|-----------|
| `/app` | PWA: cartão, desafios, QR, perfil |
| `/app-promo` | Landing promocional da App 56 |

## Fluxo operacional

1. Empregado abre mesa (ou Balcão) → adiciona itens → envia à cozinha  
2. Cozinha prepara → **Pronto** / **Entregue**  
3. Empregado **pede conta** → mesa `a_pagar` (caixa destaca)  
4. Com conta pedida: **bebidas** ainda podem ser adicionadas (mesa continua `a_pagar`)  
5. Para **comida nova**: **Nova ronda** → mesa volta a `ocupada` → depois voltar a pedir conta  
6. Caixa paga (dinheiro / multibanco / MB Way / misto + loyalty opcional) → mesa livre  

## Dados e sync

- **PostgreSQL** (Neon) via Drizzle — mesas, pedidos, menu, auditoria, loyalty  
- Sync entre dispositivos por **polling HTTP** (não WebSockets)  
- Auth staff: cookie de sessão + PIN (`STAFF_PIN`, default em `.env.example`)  
- Idioma landing/carta: `localStorage` `cs56-landing-locale` (PT/EN)  

## Variáveis de ambiente

Ver `.env.example` (mínimo: `DATABASE_URL`, `STAFF_PIN` / secret de sessão).

## Notas

- Um único PIN staff abre todas as áreas (RBAC por papel ainda não existe)  
- Nomes de pratos na carta vêm do catálogo (não traduzidos no i18n da landing)  
