export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ changelog: string }>;
}) {
  const { changelog } = await params;
  return (
    <div>
      <h1>Changelog</h1>
      <p>This is the changelog page.</p>
      <p>View an specific changelog here.</p>
      <p>Segment: {changelog}</p>
    </div>
  );
}
