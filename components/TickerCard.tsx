// components/TickerCard.tsx
export default function TickerCard({
  symbol,
  price,
  delta,
}: {
  symbol: string;
  price: string;
  delta?: string;
}) {
  return (
    <div className="tickerCard">
      <div className="tickerSymbol">{symbol}</div>
      <div className="tickerPrice">{price}</div>
      {delta ? <div className="tickerDelta muted">{delta}</div> : null}
    </div>
  );
}
