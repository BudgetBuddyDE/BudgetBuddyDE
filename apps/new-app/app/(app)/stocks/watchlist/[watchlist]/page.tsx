export default async function StockWatchlistPage({
  watchlist,
}: {
  watchlist: Promise<{ watchlist: string }>;
}) {
  const { watchlist: watchlistName } = await watchlist;
  return (
    <div>
      <h1>Stock Watchlist</h1>
      <p>This is the stock watchlist page.</p>
      <p>Segment: {watchlistName}</p>
    </div>
  );
}
