import { Asset } from '@/types/Stocks/Parqet';

export default async function Page() {
  const isin = 'DE0007664039';
  const data = await fetch(
    `https://api.parqet.com/v1/assets/${isin}?currency=EUR&expand=details&expand=yieldTTM`
  ).then((res) => res.json());

  const parsed = Asset.safeParse(data);

  console.log(parsed.error);

  return (
    <div>
      My Post: {isin}
      <pre>{JSON.stringify(parsed, null, 4)}</pre>
      <pre>{JSON.stringify(data, null, 4)}</pre>
    </div>
  );
}
// Dividends
// https://api.parqet.com/v1/assets/dividends?expand=futureDividends&expand=historicalDividends&identifier=IE00B3RBWM25&identifier=IE00B8GKDB10&identifier=IE00B8GKDB10&identifier=US5949181045&identifier=IE00BWTN6Y99&identifier=IE00B1FZS350&identifier=IE00B1FZS350&identifier=US0378331005&identifier=DE0006047004&identifier=US7561091049&identifier=US5801351017&identifier=US4781601046&identifier=GB00B10RZP78&identifier=DE0005552004&identifier=US92826C8394&identifier=US8552441094&identifier=US88579Y1010&identifier=DE000PAH0038&identifier=US56035L1044&identifier=DE0006069008&identifier=US8825081040&identifier=US7134481081&identifier=US09290D1019&identifier=DE0005557508&identifier=US22160K1051&identifier=US4370761029&identifier=DE0007037129&identifier=IE00BWTN6Y99&identifier=US1912161007&identifier=IE00BZ163G84&identifier=DE0007100000&identifier=IE00BZ163K21&identifier=GB00BP6MXD84&identifier=DE0005201602&identifier=FR0000121014

// News
// GET https://api.parqet.com/v1/feed/mostDiscussed
// GET https://api.parqet.com/v1/feed/topStories?locale=de

// Quotes
// POST https://api.parqet.com/v1/quotes?skipNormalization=true&currency=EUR&resolution=10
// Body: [{"identifier":"US64110L1061","timeframe":"1d"}]
