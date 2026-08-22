import { Dumbbell, Scissors, PartyPopper, BookOpen, Moon, Flower2, Mic2, Star } from "lucide-react";
import { makeSong } from "../utils/musicUtils";

export const MOOD_COLLECTIONS = [
  {
    id: "yoga",
    name: "Yoga Flow",
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
    gradient: "from-sky-400 to-blue-500",
    icon: BookOpen,
    songs: [makeSong("Deep Work", "Quiet Hours"), makeSong("Steady Mind", "Quiet Hours")],
  },
  {
    id: "sleep",
    name: "Sleep & Chill",
    gradient: "from-slate-400 to-slate-600",
    icon: Moon,
    songs: [makeSong("Slow Drift", "Night Notes"), makeSong("Soft Hours", "Night Notes")],
  },
];

export const LANGUAGE_COLLECTIONS = [
  {
    id: "hindi",
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
    id: "punjabi",
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
    id: "telugu",
    name: "Telugu Trending",
    gradient: "from-lime-400 to-green-600",
    icon: Mic2,
    songs: [makeSong("Cheliya", "Telugu Trending"), makeSong("Swing Zara", "Telugu Trending")],
  },
  {
    id: "tamil",
    name: "Tamil Kuthu",
    gradient: "from-red-400 to-rose-600",
    icon: Mic2,
    songs: [makeSong("Kuthu Beat", "Tamil Kuthu"), makeSong("Vaa Machi", "Tamil Kuthu")],
  },
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
