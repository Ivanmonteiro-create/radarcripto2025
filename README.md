# RadarCrypto — fundação SIM e Binance Spot Testnet

Fundação experimental para simulação Spot e execução automatizada exclusivamente na Binance Spot Testnet. Não existe adapter Live, Futures, Margin ou alavancagem neste repositório.

## Limites de segurança

- `TRADING_MODE` aceita somente `SIM` ou `TESTNET` e usa `SIM` por padrão.
- `BinanceTestnetExchange` funciona apenas no servidor e recusa qualquer host diferente de `testnet.binance.vision`.
- Credenciais nunca usam prefixo `NEXT_PUBLIC_` e não são retornadas pelas APIs.
- O worker só inicia com `BOT_WORKER_ENABLED=true`.
- Estratégias produzem sinais; somente o serviço de execução, após o gestor de risco, pode enviar ordens.
- O kill switch pausa todos os bots e bloqueia novas entradas.

## Arquitetura

```text
Navegador (painel e simulador manual)
  ├─> Next.js / APIs autenticadas por cookie HttpOnly
  │    └─> PostgreSQL / Prisma
  └─> Binance pública (somente preços e gráfico)

Worker persistente (processo separado da Vercel)
  └─> bots RUNNING no PostgreSQL
       └─> estratégia isolada por bot/símbolo
            └─> StrategySignal
                 └─> RiskManager + kill switch + idempotência
                      └─> ExecutionService
                           ├─> SimExchange
                           └─> BinanceTestnetExchange (Spot Testnet apenas)
                                └─> reconciliação de Order/Fill/Position/Trade
```

O worker não deve ser executado dentro de uma função serverless. Em produção, use um serviço persistente separado (por exemplo, container/VM/serviço de worker) com o mesmo banco PostgreSQL da aplicação web.

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL

## Configuração

```bash
cp .env.example .env.local
npm install
```

Variáveis privadas:

| Variável | Uso |
|---|---|
| `TRADING_MODE` | `SIM` ou `TESTNET`; padrão `SIM` |
| `DATABASE_URL` | URL PostgreSQL |
| `BINANCE_TESTNET_API_KEY` | chave Spot Testnet, apenas servidor/worker |
| `BINANCE_TESTNET_API_SECRET` | segredo Spot Testnet, apenas servidor/worker |
| `BINANCE_TESTNET_BASE_URL` | deve ser `https://testnet.binance.vision` |
| `BOT_WORKER_ENABLED` | `true` somente no processo de worker |
| `BOT_WORKER_POLL_MS` | intervalo, mínimo 1000 ms |
| `ENCRYPTION_KEY` | 32 bytes em base64 ou 64 caracteres hex |
| `INTERNAL_API_TOKEN` | credencial usada no login interno |
| `AUTH_SECRET` | segredo de sessão com pelo menos 32 caracteres |

Nenhuma dessas variáveis deve começar com `NEXT_PUBLIC_`.

## Banco

Desenvolvimento, após configurar `DATABASE_URL`:

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

Produção:

```bash
npm run prisma:migrate
```

O schema inclui usuários internos, contas de exchange com campos criptografados, bots, runtime, estratégias, ordens, fills, posições, trades, snapshots, eventos de risco, logs e controle global.

## Executar

Terminal do frontend/API:

```bash
npm run dev
```

Terminal separado do worker:

```bash
BOT_WORKER_ENABLED=true npm run worker
```

Entre em `/login` usando o valor de `INTERNAL_API_TOKEN`. O navegador recebe somente um cookie HttpOnly assinado; o token não é incorporado ao bundle.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Os testes cobrem compra, venda Spot, oversell, fechamento total e parcial, preço médio, PNL realizado/não realizado, Equity, TP, SL, taxas, slippage, isolamento por símbolo, warm-up EMA, limites de risco, duplicidade e bloqueio de endpoint Live.

## Fluxo de uma ordem

```text
preço -> estratégia -> sinal -> gestor de risco -> ordem PENDING persistida
      -> adapter SIM/Testnet -> resposta da exchange -> fills
      -> reconciliação transacional -> posição/trade/runtime/log
```

Uma ordem enviada não é considerada executada: os estados `PENDING`, `OPEN`, `PARTIALLY_FILLED`, `FILLED`, `CANCELLED` e `REJECTED` são distintos.

## Limitações desta fundação

- Nenhum adapter Live existe.
- A Testnet exige credenciais válidas e PostgreSQL configurado; os testes não enviam ordens.
- O worker usa polling; streaming de candles e fila distribuída ficam para o próximo patch.
- A autenticação atual é de um único operador interno, não uma plataforma multiusuário pública.
- A gestão de chaves tem primitivas de criptografia, mas ainda não possui tela/endpoint de cadastro de conta.
- Reconciliação periódica de ordens parcialmente preenchidas após reinício deve ser ampliada antes de uso prolongado na Testnet.
