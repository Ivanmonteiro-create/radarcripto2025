 = () => {
    setHistory((h) => [{ side: 'SELL', symbol, price, ts: Date.now() }, ...h]);
  };
  const handleReset = () => {
    setHistory([]);
  };

  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        /* Mantém tudo visível em 100% zoom; se faltar espaço, rola apenas o painel */
        maxHeight: 'calc(100vh - 24px)',
        overflow: 'auto',
      }}
    >
      {/* ===== ÚNICO cabeçalho ===== */}
      <div className="compactHeader" style={{ marginBottom: 10 }}>
        <h3 className="compactTitle" style={{ margin: 0 }}>
          Controles de Trade
        </h3>
        <a href="/" className="btn btn-goBack">
          Voltar ao início
        </a>
      </div>

      {/* Faixa superior (Preço / Equity / PnL / Par) */}
      <div className="cardMini" style={{ marginBottom: 10 }}>
        <div className="twoCols">
          <div>
            <div className="lbl">Preço</div>
            <div className="green">{price.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div className="lbl">Equity</div>
            <div>10000.00 USDT</div>
          </div>
        </div>
        <div className="twoCols">
          <div>
            <div className="lbl">PNL flutuante</div>
            <div>0.00 USDT (0.00%)</div>
          </div>
          <div>
            <div className="lbl">Par</div>
            <select
              className="inp"
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
            >
              <option>BTCUSDT</option>
              <option>ETHUSDT</option>
              <option>SOLUSDT</option>
              <option>BNBUSDT</option>
              <option>XRPUSDT</option>
              <option>ADAUSDT</option>
              <option>LINKUSDT</option>
              <option>DOGEUSDT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="compactGrid">
        {/* COLUNA A */}
        <div className="colA">
          {/* TP / SL */}
          <div className="twoCols">
            <div className="cardMini">
              <div className="cardTitle">Take Profit (%)</div>
              <div className="twoCols">
                <input
                  className="inp"
                  type="number"
                  placeholder="%"
                  value={tpPct === '' ? '' : tpPct}
                  onChange={(e) =>
                    setTpPct(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
                <button className="btn" onClick={() => setTpPct('')}>
                  Zerar
                </button>
              </div>
            </div>
            <div className="cardMini">
              <div className="cardTitle">Stop Loss (%)</div>
              <div className="twoCols">
                <input
                  className="inp"
                  type="number"
                  placeholder="%"
                  value={slPct === '' ? '' : slPct}
                  onChange={(e) =>
                    setSlPct(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
                <button className="btn" onClick={() => setSlPct('')}>
                  Zerar
                </button>
              </div>
            </div>
          </div>

          {/* Saldo / Risco / USDT ref */}
          <div className="threeCols">
            <div className="cardMini">
              <div className="cardTitle">Saldo (USDT)</div>
              <input
                className="inp"
                type="number"
                min={0}
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
              />
              <div className="xs muted">Equity simulado total</div>
            </div>
            <div className="cardMini">
              <div className="cardTitle">Risco por trade (%)</div>
              <input
                className="inp"
                type="number"
                min={0}
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
              />
              <div className="xs muted">Tamanho sug.: {sizeSuggestion}</div>
            </div>
            <div className="cardMini">
              <div className="cardTitle">USDT p/ referência</div>
              <input
                className="inp"
                type="number"
                min={0}
                value={qtyRef}
                onChange={(e) => setQtyRef(Number(e.target.value))}
              />
              <div className="xs muted">Usado só como fallback p/ qty</div>
            </div>
          </div>

          {/* Ações */}
          <div className="twoCols">
            <button className="btn btnBuy" onClick={handleBuy}>
              Comprar
            </button>
            <button className="btn btnSell" onClick={handleSell}>
              Vender
            </button>
          </div>
          <button className="btn" onClick={handleReset}>
            Resetar
          </button>
        </div>

        {/* COLUNA B */}
        <div className="colB">
          {/* Histórico ÚNICO */}
          <div className="cardMini historyCard" style={{ minHeight: 0 }}>
            <div className="cardTitle">Histórico</div>
            <div className="histWrap">
              {history.length === 0 && (
                <div className="histRow">Sem operações ainda.</div>
              )}
              {history.map((h, i) => (
                <div className="histRow" key={i}>
                  {new Date(h.ts).toLocaleString('pt-BR')} — {h.side} {h.symbol} @{' '}
                  {h.price.toLocaleString('pt-BR')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
