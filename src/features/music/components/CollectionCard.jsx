import { Play } from "lucide-react";

export default function CollectionCard({ collection, onOpen, onQuickPlay }) {
  const Icon = collection.icon;
  return (
    <button
      onClick={() => onOpen(collection)}
      className={`group relative flex-shrink-0 w-44 rounded-2xl bg-gradient-to-br ${collection.gradient} p-4 text-left overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
    >
      <Icon size={72} className="absolute -right-3 -bottom-4 text-white/15" strokeWidth={1.5} />

      <div className="relative h-20 flex items-start">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
      </div>

      <p className="relative text-white font-semibold text-sm leading-tight drop-shadow-sm">{collection.name}</p>
      <p className="relative text-white/75 text-[11px] mt-1">{collection.songs.length} songs</p>

      <div
        role="button"
        onClick={(e) => {
          e.stopPropagation();
          onQuickPlay(collection);
        }}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
        aria-label={`Play ${collection.name}`}
      >
        <Play size={15} fill="black" className="text-black ml-0.5" />
      </div>
    </button>
  );
}
