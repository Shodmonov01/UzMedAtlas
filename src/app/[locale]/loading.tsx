export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-sand" />
      <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-2xl bg-sand" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-3xl bg-sand" />
        ))}
      </div>
    </div>
  );
}
