// components/TickerCard.tsx
export default function TickerCard({
  symbol,
  price,
}: {
  symbol: string;
  price: string;
}) {
  return (
    <div className="tickerCard">
      <div className="tickerSymbol strong">{symbol}</div>
      <div className="tickerPrice green">{price}</div>
    </div>
  );
}
