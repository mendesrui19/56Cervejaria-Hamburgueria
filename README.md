# Hamburgaria — Sistema de Gestão de Pedidos

Sistema completo para restaurante com três vistas sincronizadas em tempo real:

- **Empregado de Mesa** — tomar pedidos com personalização completa
- **Cozinha** — ver ingredientes e composição de cada prato
- **Caixa** — consultar contas e processar pagamentos

## Arrancar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Vistas

| Vista | URL | Dispositivo sugerido |
|-------|-----|---------------------|
| Início | `/` | Qualquer |
| Empregado | `/empregado` | Tablet |
| Cozinha | `/cozinha` | Ecrã na cozinha |
| Caixa | `/caixa` | PC / tablet caixa |

## Fluxo de trabalho

1. **Empregado** seleciona mesa → abre mesa → adiciona itens do menu
2. Para hambúrgueres: escolhe carne (vaca/frango) e pão (caco/normal) — obrigatório
3. Para menu infantil: escolhe tiras ou cheeseburger — obrigatório
4. Pode adicionar extras (ovo, batata, molho) como acompanhamentos
5. Envia itens pendentes à **Cozinha**
6. **Cozinha** vê ingredientes completos + notas → marca "Pronto"
7. Empregado pede conta → mesa fica "A Pagar"
8. **Caixa** processa pagamento → mesa fica livre

## Menu incluído

Todo o menu da carta está configurado com preços, ingredientes e opções de personalização.

## Sincronização

Os dados sincronizam automaticamente a cada 2-3 segundos entre dispositivos na mesma rede (mesmo servidor).

Os dados são guardados em `data/restaurant-state.json`.

## Produção

```bash
npm run build
npm start
```

Para uso em produção com múltiplos dispositivos, correr o servidor num PC da rede local e aceder via IP (ex: `http://192.168.1.10:3000`).
