export default async function Page({ params }: { params: Promise<{ isin: string }> }) {
  const { isin } = await params;
  if (!isin || isin.length !== 12 || !/^[A-Z0-9]+$/.test(isin)) {
    return <div>Invalid ISIN</div>;
  }
  const data = await fetch(
    `https://api.parqet.com/v1/assets/${isin}?currency=EUR&expand=details&expand=yieldTTM`
  ).then((res) => res.json());
  console.log(data);
  return <div>My Post: {isin}</div>;
}
