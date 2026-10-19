/**
 * @typedef {Object} CatalogTrack
 * @property {string} title
 * @property {string} artist
 * @property {string} film       Film or album name
 * @property {string} duration   "m:ss"
 * @property {string} [src]      Playable audio URL — tracks without one can't play in-app yet
 */

/**
 * @typedef {Object} CatalogPlaylist
 * @property {string} id
 * @property {"year"|"actor"|"singer"|"language"} category
 * @property {string} [era]          Decade, for category "year" (matches MUSIC_ERAS)
 * @property {"female"|"male"} [gender]  For categories "actor" and "singer"
 * @property {string} mark           Short text shown on the cover
 * @property {string} title
 * @property {string} vibe
 * @property {string} description
 * @property {string} [spotifyId]    Spotify playlist id, enables "Open in Spotify"
 * @property {CatalogTrack[]} tracks
 */

const t = (title, artist, film, duration) => ({ title, artist, film, duration });

// Static catalog until the music API is ready — musicService.fetchPlaylistCatalog()
// is the only reader, so swapping this for a backend call touches one place.
/** @type {CatalogPlaylist[]} */
export const PLAYLIST_CATALOG = [
  {
    id: "y90", category: "year", era: "90s", mark: "90s", title: "90s Yaadein", vibe: "Nostalgic",
    description: "Evergreen Hindi songs for a relaxed, nostalgic ambience.",
    spotifyId: "1UR7GhwklC22Dx6deuweNH",
    tracks: [
      t("Tujhe Dekha To", "Kumar Sanu, Lata Mangeshkar", "Dilwale Dulhania Le Jayenge", "5:03"),
      t("Pehla Nasha", "Udit Narayan, Sadhana Sargam", "Jo Jeeta Wohi Sikandar", "4:48"),
      t("Ek Ladki Ko Dekha", "Kumar Sanu", "1942: A Love Story", "4:12"),
      t("Chura Ke Dil Mera", "Kumar Sanu, Alka Yagnik", "Main Khiladi Tu Anari", "5:22"),
      t("Tum Paas Aaye", "Udit Narayan, Alka Yagnik", "Kuch Kuch Hota Hai", "4:58"),
      t("Dil To Pagal Hai", "Lata Mangeshkar, Udit Narayan", "Dil To Pagal Hai", "5:34"),
    ],
  },
  {
    id: "y70", category: "year", era: "70s", mark: "70s", title: "70s Golden Classics", vibe: "Classic",
    description: "Timeless melodies from the golden era of Hindi film music.",
    tracks: [
      t("Chura Liya Hai Tumne", "Asha Bhosle, Mohammed Rafi", "Yaadon Ki Baaraat", "4:31"),
      t("Kabhi Kabhie Mere Dil Mein", "Mukesh", "Kabhi Kabhie", "4:44"),
      t("Dum Maro Dum", "Asha Bhosle", "Hare Rama Hare Krishna", "4:59"),
      t("Pal Pal Dil Ke Paas", "Kishore Kumar", "Blackmail", "4:46"),
      t("Mehbooba Mehbooba", "R. D. Burman", "Sholay", "3:52"),
      t("Yeh Dosti", "Kishore Kumar, Manna Dey", "Sholay", "5:20"),
    ],
  },
  {
    id: "y80", category: "year", era: "80s", mark: "80s", title: "80s Disco Nights", vibe: "Retro",
    description: "Upbeat retro hits for a fun, lively room.",
    tracks: [
      t("I Am a Disco Dancer", "Vijay Benedict", "Disco Dancer", "5:44"),
      t("Jimmy Jimmy Aaja", "Parvati Khan", "Disco Dancer", "4:21"),
      t("Hawa Hawai", "Kavita Krishnamurthy", "Mr. India", "5:10"),
      t("Ek Do Teen", "Alka Yagnik", "Tezaab", "6:06"),
      t("Papa Kehte Hain", "Udit Narayan", "Qayamat Se Qayamat Tak", "4:57"),
      t("Mere Haathon Mein", "Lata Mangeshkar", "Chandni", "5:29"),
    ],
  },
  {
    id: "y00", category: "year", era: "2000s", mark: "00s", title: "2000s Bollywood Hits", vibe: "Feel-good",
    description: "The songs every customer can hum along to.",
    tracks: [
      t("Kal Ho Naa Ho", "Sonu Nigam", "Kal Ho Naa Ho", "5:21"),
      t("Kajra Re", "Alisha Chinai, Shankar Mahadevan, Javed Ali", "Bunty Aur Babli", "8:02"),
      t("Dhoom Machale", "Sunidhi Chauhan", "Dhoom", "4:22"),
      t("Tum Se Hi", "Mohit Chauhan", "Jab We Met", "5:23"),
      t("Tujh Mein Rab Dikhta Hai", "Roop Kumar Rathod", "Rab Ne Bana Di Jodi", "4:42"),
      t("Chak De India", "Sukhwinder Singh", "Chak De! India", "4:45"),
    ],
  },
  {
    id: "y10", category: "year", era: "2010s", mark: "10s", title: "2010s Party Mix", vibe: "Party",
    description: "High-energy tracks for busy evenings.",
    tracks: [
      t("Badtameez Dil", "Benny Dayal", "Yeh Jawaani Hai Deewani", "4:12"),
      t("Balam Pichkari", "Vishal Dadlani, Shalmali Kholgade", "Yeh Jawaani Hai Deewani", "4:49"),
      t("London Thumakda", "Labh Janjua, Sonu Kakkar, Neha Kakkar", "Queen", "3:50"),
      t("Kar Gayi Chull", "Badshah, Neha Kakkar", "Kapoor & Sons", "3:07"),
      t("The Breakup Song", "Arijit Singh, Badshah, Jonita Gandhi", "Ae Dil Hai Mushkil", "4:11"),
      t("Gallan Goodiyaan", "Shankar Mahadevan, Yashita Sharma", "Dil Dhadakne Do", "4:50"),
    ],
  },
  {
    id: "y20", category: "year", era: "2020s", mark: "20s", title: "Fresh 2020s", vibe: "Trending",
    description: "The latest chart-toppers, refreshed often.",
    tracks: [
      t("Kesariya", "Arijit Singh", "Brahmastra", "4:28"),
      t("Tum Kya Mile", "Arijit Singh, Shreya Ghoshal", "Rocky Aur Rani Kii Prem Kahaani", "4:35"),
      t("Chaleya", "Arijit Singh, Shilpa Rao", "Jawan", "3:20"),
      t("Raataan Lambiyan", "Jubin Nautiyal, Asees Kaur", "Shershaah", "3:50"),
      t("Apna Bana Le", "Arijit Singh", "Bhediya", "4:21"),
      t("Jhoome Jo Pathaan", "Arijit Singh, Sukriti Kakar", "Pathaan", "3:28"),
    ],
  },
  {
    id: "a1", category: "actor", gender: "female", mark: "MD", title: "Madhuri Dixit Hits", vibe: "Dance",
    description: "Iconic songs picturised on Madhuri Dixit.",
    tracks: [
      t("Ek Do Teen", "Alka Yagnik", "Tezaab", "6:06"),
      t("Dhak Dhak Karne Laga", "Anuradha Paudwal, Udit Narayan", "Beta", "5:10"),
      t("Choli Ke Peeche", "Alka Yagnik, Ila Arun", "Khalnayak", "6:20"),
      t("Didi Tera Devar Deewana", "Lata Mangeshkar, S. P. Balasubrahmanyam", "Hum Aapke Hain Koun..!", "7:01"),
      t("Maar Dala", "Kavita Krishnamurthy, KK", "Devdas", "5:22"),
      t("Dil To Pagal Hai", "Lata Mangeshkar, Udit Narayan", "Dil To Pagal Hai", "5:34"),
    ],
  },
  {
    id: "a2", category: "actor", gender: "female", mark: "SD", title: "Sridevi Classics", vibe: "Classic",
    description: "Much-loved songs from Sridevi films.",
    tracks: [
      t("Hawa Hawai", "Kavita Krishnamurthy", "Mr. India", "5:10"),
      t("Kaate Nahin Kat Te", "Kishore Kumar, Alisha Chinai", "Mr. India", "5:40"),
      t("Mere Haathon Mein", "Lata Mangeshkar", "Chandni", "5:29"),
      t("Chandni O Meri Chandni", "Jolly Mukherjee, Sridevi", "Chandni", "4:36"),
      t("Main Teri Dushman", "Lata Mangeshkar", "Nagina", "6:05"),
    ],
  },
  {
    id: "a3", category: "actor", gender: "female", mark: "DP", title: "Deepika Padukone", vibe: "Festive",
    description: "Modern hits from Deepika Padukone films.",
    tracks: [
      t("Ghoomar", "Shreya Ghoshal, Swaroop Khan", "Padmaavat", "4:41"),
      t("Nagada Sang Dhol", "Shreya Ghoshal, Osman Mir", "Goliyon Ki Raasleela Ram-Leela", "5:02"),
      t("Deewani Mastani", "Shreya Ghoshal", "Bajirao Mastani", "5:50"),
      t("Badtameez Dil", "Benny Dayal", "Yeh Jawaani Hai Deewani", "4:12"),
      t("Lungi Dance", "Yo Yo Honey Singh", "Chennai Express", "3:59"),
      t("Besharam Rang", "Shilpa Rao, Caralisa Monteiro", "Pathaan", "4:18"),
    ],
  },
  {
    id: "a4", category: "actor", gender: "male", mark: "SRK", title: "Shah Rukh Khan Romance", vibe: "Romantic",
    description: "Romantic favourites from Shah Rukh Khan films.",
    tracks: [
      t("Tujhe Dekha To", "Kumar Sanu, Lata Mangeshkar", "Dilwale Dulhania Le Jayenge", "5:03"),
      t("Tum Paas Aaye", "Udit Narayan, Alka Yagnik", "Kuch Kuch Hota Hai", "4:58"),
      t("Suraj Hua Maddham", "Sonu Nigam, Alka Yagnik", "Kabhi Khushi Kabhie Gham", "7:08"),
      t("Kal Ho Naa Ho", "Sonu Nigam", "Kal Ho Naa Ho", "5:21"),
      t("Tujh Mein Rab Dikhta Hai", "Roop Kumar Rathod", "Rab Ne Bana Di Jodi", "4:42"),
      t("Chaleya", "Arijit Singh, Shilpa Rao", "Jawan", "3:20"),
    ],
  },
  {
    id: "a5", category: "actor", gender: "male", mark: "AB", title: "Amitabh Bachchan Classics", vibe: "Classic",
    description: "Evergreen songs from Amitabh Bachchan films.",
    tracks: [
      t("Khaike Paan Banaraswala", "Kishore Kumar", "Don", "5:38"),
      t("Rang Barse", "Amitabh Bachchan", "Silsila", "6:21"),
      t("Yeh Dosti", "Kishore Kumar, Manna Dey", "Sholay", "5:20"),
      t("Kabhi Kabhie Mere Dil Mein", "Mukesh", "Kabhi Kabhie", "4:44"),
      t("Pag Ghungroo Baandh", "Kishore Kumar", "Namak Halaal", "9:54"),
    ],
  },
  {
    id: "a6", category: "actor", gender: "male", mark: "R", title: "Rajinikanth Mass", vibe: "Mass",
    description: "Crowd-pleasing Tamil songs from Rajinikanth films.",
    tracks: [
      t("Oruvan Oruvan Mudhalali", "S. P. Balasubrahmanyam", "Muthu", "5:30"),
      t("Kilimanjaro", "Javed Ali, Chinmayi", "Enthiran", "5:15"),
      t("Neruppu Da", "Arunraja Kamaraj", "Kabali", "2:52"),
      t("Marana Mass", "Anirudh Ravichander, S. P. Balasubrahmanyam", "Petta", "4:02"),
      t("Hukum", "Anirudh Ravichander", "Jailer", "3:27"),
      t("Kaavaalaa", "Shilpa Rao, Anirudh Ravichander", "Jailer", "3:30"),
    ],
  },
  {
    id: "s1", category: "singer", gender: "female", mark: "LM", title: "Lata Mangeshkar", vibe: "Soulful",
    description: "The nightingale of India, at her very best.",
    tracks: [
      t("Lag Jaa Gale", "Lata Mangeshkar", "Woh Kaun Thi?", "4:16"),
      t("Ajeeb Dastan Hai Yeh", "Lata Mangeshkar", "Dil Apna Aur Preet Parai", "4:08"),
      t("Pyar Kiya To Darna Kya", "Lata Mangeshkar", "Mughal-e-Azam", "6:10"),
      t("Tere Liye", "Lata Mangeshkar, Roop Kumar Rathod", "Veer-Zaara", "5:32"),
      t("Didi Tera Devar Deewana", "Lata Mangeshkar, S. P. Balasubrahmanyam", "Hum Aapke Hain Koun..!", "7:01"),
      t("Tujhe Dekha To", "Kumar Sanu, Lata Mangeshkar", "Dilwale Dulhania Le Jayenge", "5:03"),
    ],
  },
  {
    id: "s2", category: "singer", gender: "female", mark: "SG", title: "Shreya Ghoshal", vibe: "Melodious",
    description: "Soulful melodies for a calm, warm space.",
    tracks: [
      t("Teri Ore", "Rahat Fateh Ali Khan, Shreya Ghoshal", "Singh Is Kinng", "5:06"),
      t("Agar Tum Mil Jao", "Shreya Ghoshal", "Zeher", "5:18"),
      t("Ghoomar", "Shreya Ghoshal, Swaroop Khan", "Padmaavat", "4:41"),
      t("Deewani Mastani", "Shreya Ghoshal", "Bajirao Mastani", "5:50"),
      t("Tum Kya Mile", "Arijit Singh, Shreya Ghoshal", "Rocky Aur Rani Kii Prem Kahaani", "4:35"),
    ],
  },
  {
    id: "s3", category: "singer", gender: "female", mark: "AB", title: "Asha Bhosle", vibe: "Playful",
    description: "Playful, versatile classics.",
    tracks: [
      t("Dum Maro Dum", "Asha Bhosle", "Hare Rama Hare Krishna", "4:59"),
      t("Piya Tu Ab To Aaja", "Asha Bhosle", "Caravan", "5:23"),
      t("Chura Liya Hai Tumne", "Asha Bhosle, Mohammed Rafi", "Yaadon Ki Baaraat", "4:31"),
      t("In Aankhon Ki Masti", "Asha Bhosle", "Umrao Jaan", "4:15"),
      t("Rangeela Re", "Asha Bhosle", "Rangeela", "4:12"),
    ],
  },
  {
    id: "s4", category: "singer", gender: "male", mark: "KK", title: "Kishore Kumar", vibe: "Feel-good",
    description: "Feel-good classics everyone knows.",
    tracks: [
      t("Mere Sapno Ki Rani", "Kishore Kumar", "Aradhana", "4:46"),
      t("Roop Tera Mastana", "Kishore Kumar", "Aradhana", "3:54"),
      t("Pal Pal Dil Ke Paas", "Kishore Kumar", "Blackmail", "4:46"),
      t("Zindagi Ek Safar", "Kishore Kumar", "Andaz", "4:35"),
      t("Ek Ladki Bheegi Bhaagi Si", "Kishore Kumar", "Chalti Ka Naam Gaadi", "3:12"),
      t("Khaike Paan Banaraswala", "Kishore Kumar", "Don", "5:38"),
    ],
  },
  {
    id: "s5", category: "singer", gender: "male", mark: "AS", title: "Arijit Singh", vibe: "Romantic",
    description: "Today’s most-loved romantic voice.",
    tracks: [
      t("Tum Hi Ho", "Arijit Singh", "Aashiqui 2", "4:22"),
      t("Channa Mereya", "Arijit Singh", "Ae Dil Hai Mushkil", "4:49"),
      t("Agar Tum Saath Ho", "Alka Yagnik, Arijit Singh", "Tamasha", "5:41"),
      t("Kesariya", "Arijit Singh", "Brahmastra", "4:28"),
      t("Apna Bana Le", "Arijit Singh", "Bhediya", "4:21"),
      t("Chaleya", "Arijit Singh, Shilpa Rao", "Jawan", "3:20"),
    ],
  },
  {
    id: "s6", category: "singer", gender: "male", mark: "DD", title: "Diljit Dosanjh", vibe: "Punjabi beats",
    description: "Punjabi energy for a buzzing outlet.",
    tracks: [
      t("Lover", "Diljit Dosanjh", "MoonChild Era", "3:08"),
      t("G.O.A.T.", "Diljit Dosanjh", "G.O.A.T.", "3:52"),
      t("Born to Shine", "Diljit Dosanjh", "G.O.A.T.", "3:20"),
      t("Do You Know", "Diljit Dosanjh", "Single", "3:34"),
      t("Proper Patola", "Diljit Dosanjh, Badshah", "Single", "3:21"),
    ],
  },
  {
    id: "l1", category: "language", mark: "TA", title: "Tamil Playlist", vibe: "Energetic",
    description: "Tamil favourites for a lively outlet atmosphere.",
    spotifyId: "04wyLWYsskgWjn9827AQj3",
    tracks: [
      t("Vaathi Coming", "Anirudh Ravichander", "Master", "3:48"),
      t("Rowdy Baby", "Dhanush, Dhee", "Maari 2", "4:43"),
      t("Why This Kolaveri Di", "Dhanush", "3", "4:10"),
      t("Arabic Kuthu", "Anirudh Ravichander, Jonita Gandhi", "Beast", "4:40"),
      t("Enjoy Enjaami", "Dhee, Arivu", "Single", "4:39"),
      t("Kaavaalaa", "Shilpa Rao, Anirudh Ravichander", "Jailer", "3:30"),
    ],
  },
  {
    id: "l2", category: "language", mark: "PA", title: "Punjabi Playlist", vibe: "Energetic",
    description: "Punjabi hits to bring energy to your outlet.",
    spotifyId: "1qpyCtjj5fW0g1FaKEFAOo",
    tracks: [
      t("Brown Munde", "AP Dhillon, Gurinder Gill, Shinda Kahlon", "Single", "4:27"),
      t("Excuses", "AP Dhillon, Gurinder Gill", "Single", "2:56"),
      t("Lover", "Diljit Dosanjh", "MoonChild Era", "3:08"),
      t("Laung Laachi", "Mannat Noor", "Laung Laachi", "3:50"),
      t("Lehanga", "Jass Manak", "Single", "3:24"),
    ],
  },
];
