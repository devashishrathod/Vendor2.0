import { Dumbbell, Scissors, PartyPopper, BookOpen, Moon, Flower2, Mic2, Star } from "lucide-react";
import { makeSong } from "../utils/musicUtils";

// `image` — real royalty-free photos from Pixabay (cdn.pixabay.com direct
// links, confirmed reachable), used as each card's thumbnail instead of a
// flat gradient. `gradient` stays as the fallback tint/overlay behind it.
export const MOOD_COLLECTIONS = [
  {
    id: "yoga",
    name: "Yoga Flow",
    image: "https://cdn.pixabay.com/photo/2016/03/01/08/13/harmony-1229893_640.jpg",
    gradient: "from-emerald-400 to-teal-500",
    icon: Flower2,
    songs: [
      makeSong("Morning Stillness", "Calm Sessions"),
      makeSong("Breath & Balance", "Calm Sessions"),
      makeSong("Sunrise Stretch", "Calm Sessions"),
    ],
  },
  {
    id: "gym",
    name: "Gym Power",
    image: "https://cdn.pixabay.com/photo/2017/07/02/19/24/dumbbells-2465478_640.jpg",
    gradient: "from-orange-400 to-red-500",
    icon: Dumbbell,
    songs: [
      makeSong("Max Reps", "Beast Mode"),
      makeSong("Iron Grind", "Beast Mode"),
      makeSong("Last Set", "Beast Mode"),
    ],
  },
  {
    id: "salon",
    name: "Salon Vibes",
    image: "https://cdn.pixabay.com/photo/2015/04/06/20/37/salon-710047_640.jpg",
    gradient: "from-pink-400 to-rose-500",
    icon: Scissors,
    songs: [
      makeSong("Glow Up", "Studio Lounge"),
      makeSong("Mirror Talk", "Studio Lounge"),
      makeSong("Fresh Cut", "Studio Lounge"),
    ],
  },
  {
    id: "party",
    name: "Party Anthems",
    image: "https://cdn.pixabay.com/photo/2018/05/10/11/34/concert-3387324_1280.jpg",
    gradient: "from-purple-400 to-indigo-500",
    icon: PartyPopper,
    songs: [
      makeSong("Night Lights", "Weekend Crew"),
      makeSong("Dance Floor", "Weekend Crew"),
      makeSong("Turn It Up", "Weekend Crew"),
    ],
  },
  {
    id: "study",
    name: "Focus & Study",
    image: "https://cdn.pixabay.com/photo/2016/03/26/22/21/books-1281581_640.jpg",
    gradient: "from-sky-400 to-blue-500",
    icon: BookOpen,
    songs: [makeSong("Deep Work", "Quiet Hours"), makeSong("Steady Mind", "Quiet Hours")],
  },
  {
    id: "sleep",
    name: "Sleep & Chill",
    image: "https://cdn.pixabay.com/photo/2020/04/30/20/14/sky-5114499_640.jpg",
    gradient: "from-slate-400 to-slate-600",
    icon: Moon,
    songs: [makeSong("Slow Drift", "Night Notes"), makeSong("Soft Hours", "Night Notes")],
  },
];

// `label` is the short pill text ("Hindi"); `name` is the full collection
// name used as the player's queue label ("Hindi Hits") — kept separate so
// neither has to be string-mangled to produce the other.
export const LANGUAGE_COLLECTIONS = [
  {
    id: "hindi",
    label: "Hindi",
    name: "Hindi Hits",
    gradient: "from-amber-400 to-orange-500",
    icon: Mic2,
    songs: [
      makeSong("Dil Ki Dhun", "Hindi Hits"),
      makeSong("Yeh Pal", "Hindi Hits"),
      makeSong("Raat Ki Baat", "Hindi Hits"),
    ],
  },
  {
    id: "telugu",
    label: "Telugu",
    name: "Telugu Trending",
    gradient: "from-lime-400 to-green-600",
    icon: Mic2,
    songs: [makeSong("Cheliya", "Telugu Trending"), makeSong("Swing Zara", "Telugu Trending")],
  },
  {
    id: "tamil",
    label: "Tamil",
    name: "Tamil Kuthu",
    gradient: "from-red-400 to-rose-600",
    icon: Mic2,
    songs: [makeSong("Kuthu Beat", "Tamil Kuthu"), makeSong("Vaa Machi", "Tamil Kuthu")],
  },
  {
    id: "kannada",
    label: "Kannada",
    name: "Kannada Beats",
    gradient: "from-fuchsia-400 to-purple-600",
    icon: Mic2,
    songs: [makeSong("Ee Sanje", "Kannada Beats"), makeSong("Gaana Beku", "Kannada Beats")],
  },
  {
    id: "malayalam",
    label: "Malayalam",
    name: "Malayalam Melodies",
    gradient: "from-cyan-400 to-teal-600",
    icon: Mic2,
    songs: [makeSong("Kaatte", "Malayalam Melodies"), makeSong("Munthiri", "Malayalam Melodies")],
  },
  {
    id: "punjabi",
    label: "Punjabi",
    name: "Punjabi Beats",
    gradient: "from-yellow-400 to-amber-600",
    icon: Mic2,
    songs: [
      makeSong("Bhangra Nights", "Punjabi Beats"),
      makeSong("Dhol Di Awaaz", "Punjabi Beats"),
      makeSong("Munda Style", "Punjabi Beats"),
    ],
  },
  {
    id: "english",
    label: "English",
    name: "English Favorites",
    gradient: "from-blue-400 to-indigo-600",
    icon: Mic2,
    songs: [makeSong("Golden Hour", "English Favorites"), makeSong("City Lights", "English Favorites")],
  },
  {
    id: "instrumental",
    label: "Instrumental",
    name: "Instrumental Picks",
    gradient: "from-slate-400 to-gray-600",
    icon: Mic2,
    songs: [makeSong("Piano Drift", "Instrumental Picks"), makeSong("Soft Strings", "Instrumental Picks")],
  },
];

// Individual standalone songs (not grouped into a collection) for the
// "Trending Songs" row — a flat, mixed-genre list rather than one mood or
// language.
export const TRENDING_SONGS = [
  makeSong("Golden Hour", "Ambient Collective"),
  makeSong("Midnight Drive", "Night Sessions"),
  makeSong("Sunset Groove", "Coastal Beats"),
  makeSong("Neon Rain", "Night Sessions"),
  makeSong("Desert Wind", "Wanderlust"),
  makeSong("Velvet Sky", "Wanderlust"),
];

// "Artist specials" — per-actor/singer collections. Add more entries here (or
// fetch them from a real catalog service) to grow this row.
export const ARTIST_COLLECTIONS = [
  {
    id: "salman",
    name: "Salman Khan Hits",
    gradient: "from-blue-400 to-cyan-500",
    icon: Star,
    songs: [makeSong("Bhai Ka Style", "Fan Tribute Mix"), makeSong("Dabangg Beat", "Fan Tribute Mix")],
  },
  {
    id: "akshay",
    name: "Akshay Kumar Hits",
    gradient: "from-indigo-400 to-blue-600",
    icon: Star,
    songs: [makeSong("Khiladi Groove", "Fan Tribute Mix"), makeSong("Action Anthem", "Fan Tribute Mix")],
  },
  {
    id: "srk",
    name: "Shah Rukh Khan Hits",
    gradient: "from-rose-400 to-pink-600",
    icon: Star,
    songs: [makeSong("Baadshah Tune", "Fan Tribute Mix"), makeSong("King Khan Mix", "Fan Tribute Mix")],
  },
  {
    id: "allu",
    name: "Allu Arjun Specials",
    gradient: "from-teal-400 to-emerald-600",
    icon: Star,
    songs: [makeSong("Icon Step", "Fan Tribute Mix"), makeSong("Pushpa Raj Beat", "Fan Tribute Mix")],
  },
];
