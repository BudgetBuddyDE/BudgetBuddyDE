export default async function StockPage({ params }: { params: Promise<{ isin: string }> }) {
  const { isin } = await params;
  return (
    <div>
      <h1>Stock</h1>
      <p>This is the stock page.</p>
      <p>Segment: {isin}</p>
    </div>
  );
}
