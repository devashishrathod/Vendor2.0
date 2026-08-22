import CollectionCard from "./CollectionCard";

export default function CollectionRow({ title, collections, onOpen, onQuickPlay }) {
  if (!collections.length) return null;

  return (
    <section className="mb-8">
      <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {collections.map((c) => (
          <CollectionCard key={c.id} collection={c} onOpen={onOpen} onQuickPlay={onQuickPlay} />
        ))}
      </div>
    </section>
  );
}
