# PATCH 02 — runbook de integração Testnet

Este runbook não contém valores secretos. Cadastre segredos exclusivamente nas áreas protegidas dos provedores ou na tela interna `/robos`.

## Ambientes separados

- Vercel Preview: `BOT_WORKER_ENABLED=false`.
- Worker persistente: imagem `Dockerfile.worker` com `BOT_WORKER_ENABLED=true`.
- Ambos usam o mesmo PostgreSQL dedicado a Preview/Testnet, nunca o banco de produção.
- `TRADING_MODE` permanece `SIM` até banco, worker e credenciais Testnet estarem saudáveis.

## PostgreSQL Preview/Testnet

Defina `DATABASE_URL` com TLS e pooling compatível com o provedor. Execute uma única vez no ambiente dedicado:

```sh
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npx prisma migrate status
```

O seed é idempotente, cria dois bots SIM em `STOPPED` e não cria credenciais, ordens, fills ou posições.

## Segredos do frontend Preview

- `DATABASE_URL`
- `AUTH_SECRET` com pelo menos 32 caracteres
- `INTERNAL_API_TOKEN`
- `ENCRYPTION_KEY` em hexadecimal com 64 caracteres ou Base64 que decodifique para 32 bytes
- `TRADING_MODE=SIM` inicialmente
- `BOT_WORKER_ENABLED=false`

Não é necessário colocar a API Key ou o Secret da Binance em variáveis da Vercel: após login, use a área protegida em `/robos`, que criptografa ambos antes de persistir e nunca devolve o Secret.

## Worker persistente

Crie um único serviço a partir de `Dockerfile.worker`. Configure nele:

- as mesmas `DATABASE_URL`, `ENCRYPTION_KEY` e `TRADING_MODE` do Preview;
- `BOT_WORKER_ENABLED=true`;
- `BOT_WORKER_POLL_MS=5000`;
- `BOT_WORKER_RETRY_LIMIT=5`;
- `BOT_WORKER_MAX_BACKOFF_MS=60000`.

O comando de start é `npm run worker`. O worker inicia sem ativar bots, registra heartbeat no PostgreSQL, reconcilia ordens antes dos ciclos e encerra graciosamente em `SIGTERM`/`SIGINT`.

## Habilitação Testnet

1. Confirme health do banco e worker em `/robos`.
2. Cadastre credenciais criadas exclusivamente em Binance Spot Testnet, sem permissão de saque.
3. A validação executará apenas horário, `exchangeInfo`, símbolo, saldo e ordens abertas.
4. Somente após a validação, altere Preview e worker para `TRADING_MODE=TESTNET` e reinicie ambos.
5. Mantenha todos os bots parados.

## Primeira ordem manual

A rota `POST /api/testnet/orders` exige sessão interna, cabeçalho `x-radarcrypto-csrf: 1` e a confirmação literal `I_AUTHORIZE_BINANCE_SPOT_TESTNET_ORDER`. Antes de enviar, ela revalida banco, worker, Binance, Spot, símbolo, filtros, saldo, kill switch, limites do bot e ausência de ordem equivalente.

Não invoque a rota até o operador autorizar explicitamente a ordem, o símbolo e o valor mínimo. Se a resposta for perdida, a ordem fica `UNKNOWN`; o worker consulta primeiro pelo `clientOrderId` e nunca reenvia automaticamente.

O cancelamento controlado usa `POST /api/testnet/orders/{id}/cancel` com a confirmação `I_AUTHORIZE_BINANCE_SPOT_TESTNET_CANCEL`.

## Testes PostgreSQL

Use somente uma base cujo nome contenha `test` ou `patch02`:

```sh
DATABASE_URL="$TEST_DATABASE_URL" TEST_DATABASE_URL="$TEST_DATABASE_URL" npm run test:integration
```

A suíte recusa bancos sem essa identificação.
