// components/TickerCard.tsx
export default function TickerCard({
  symbol,
  price,
}: {
  symbol: string;
  price: string;
}) {
  return (
    <div className="ticker-card">
      <span className="pair">{symbol}</span>
      <span className="price">{price}</span>
    </div>
  );
}
