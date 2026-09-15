export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.q} className="soft-card rounded-[1.6rem] bg-white px-5 py-4">
          <summary className="cursor-pointer font-bold">{item.q}</summary>
          <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
