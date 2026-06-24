import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/Logo1.jpg"; 

// ─── Static Data ───────────────────────────────────────────────────────────────
const MERCHANT_DATA = {
  token: "A4FG1WJOIUN20",
  address:
    "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
  mapsLink: "https://maps.app.goo.gl/PgwWnUXuiNy5XuVg7",
  latitude: "13.0827",
  longitude: "80.2707",
};

const CATEGORIES = [
  "Food & Drinks","Health & Wellness","Beauty & Spa",
  "Education","Entertainment","Fitness",
];
const SUB_CATEGORIES = {
  "Food & Drinks":    ["Buffet Restaurants","Cafes","Bakeries","Fast Food","Fine Dining"],
  "Health & Wellness":["Yoga","Meditation","Ayurveda","Naturopathy"],
  "Beauty & Spa":     ["Salon","Spa","Nail Studio","Skin Clinic"],
  Education:          ["Coaching","Workshops","Online Classes"],
  Entertainment:      ["Events","Gaming","Movies"],
  Fitness:            ["Gym","Crossfit","Zumba","Swimming"],
};

// Description guidelines content
const GUIDELINES = {
  logo: {
    title: "Brand Logo Guidelines",
    sections: [
      { heading: "Pixel Size Rules", body: "Upload your logo at a minimum of 500×500 px. Recommended: 1000×1000 px for best quality across all placements." },
      { heading: "Aspect Ratio", body: "Use a 1:1 (square) aspect ratio. Logos with transparent backgrounds (.PNG) are preferred." },
      { heading: "File Size Limit", body: "Maximum file size: 1.5 MB. Compress without losing clarity." },
      { heading: "Do's", body: "✅ Use high-contrast logos\n✅ Ensure text is legible at small sizes\n✅ Use PNG with transparent background" },
      { heading: "Don'ts", body: "❌ No blurry or pixelated images\n❌ No extra whitespace or padding around the logo\n❌ No watermarks" },
    ],
  },
  brandName: {
    title: "Brand Name Guidelines",
    sections: [
      { heading: "What to Enter", body: "Enter the official trading name of your business — exactly how customers should see it on the Trydood app." },
      { heading: "Character Limit", body: "Keep it between 3–60 characters. Avoid unnecessary abbreviations." },
      { heading: "Allowed Characters", body: "Letters, numbers, spaces, &, -, and ' are allowed. Special characters like @, #, $ are not permitted." },
      { heading: "Do's", body: "✅ Use your registered brand/trade name\n✅ Match the name on your GST certificate\n✅ Use Title Case (e.g. Toni & Guy)" },
      { heading: "Don'ts", body: "❌ No generic names like 'Shop' or 'Store'\n❌ No competitor brand names\n❌ No all-caps unless it's your registered name" },
    ],
  },
  location: {
    title: "Map & Location Guidelines",
    sections: [
      { heading: "Why Location Matters", body: "Accurate location helps customers find you on the map and improves your discoverability in nearby searches." },
      { heading: "Google Maps Link", body: "Paste the exact share link from Google Maps (starts with https://maps.app.goo.gl/ or https://www.google.com/maps/)." },
      { heading: "Latitude & Longitude", body: "Enter decimal degree format. Example: Latitude 13.0827, Longitude 80.2707. Avoid using ° N/E notation in the fields." },
      { heading: "Do's", body: "✅ Pin the exact entrance of your outlet\n✅ Verify pin on the map preview before saving\n✅ Keep coordinates to at least 4 decimal places" },
      { heading: "Don'ts", body: "❌ Do not use approximate area coordinates\n❌ Do not leave coordinates blank if maps link is added\n❌ Do not use DMS format (e.g. 13°04'57\"N)" },
    ],
  },
  ambiencePhoto: {
    title: "Ambience Photo Guidelines",
    sections: [
      { heading: "Pixel Size Rules", body: "Minimum 900×1200 px (portrait). Upload in 3:4 aspect ratio for best display." },
      { heading: "File Size Limit", body: "Maximum 1.5 MB per image. Use JPG or PNG format." },
      { heading: "What to Capture", body: "Show your outlet's interior, seating, décor, lighting, and overall ambience. Natural light photos perform best." },
      { heading: "Do's", body: "✅ Bright, well-lit, high-resolution shots\n✅ Show the actual outlet space\n✅ Multiple angles encouraged" },
      { heading: "Don'ts", body: "❌ No stock photos or images from the internet\n❌ No blurry or dark images\n❌ No photos with people's faces without consent" },
    ],
  },
  ambienceVideo: {
    title: "Ambience Video Guidelines",
    sections: [
      { heading: "Size & Format", body: "Resolution: 900×1200 px (portrait, 3:4). Format: .mp4 or .gif only." },
      { heading: "Duration", body: "10 to 60 seconds. Videos under 30s typically get better engagement." },
      { heading: "File Size Limit", body: "Maximum 5 MB. Compress before uploading if needed." },
      { heading: "What to Record", body: "Capture the atmosphere — entrance walk-through, seating areas, signature dishes/services, or staff in action." },
      { heading: "Do's", body: "✅ Stable shots or smooth gimbal movement\n✅ Good ambient sound or background music\n✅ Show what makes your outlet unique" },
      { heading: "Don'ts", body: "❌ No shaky handheld footage\n❌ No copyright music\n❌ No promotional overlays or watermarks" },
    ],
  },
};

// ─── Guidelines Modal ──────────────────────────────────────────────────────────
function GuidelinesModal({ type, onClose }) {
  const g = GUIDELINES[type];
  if (!g) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-bold text-gray-900">{g.title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {g.sections.map((s, i) => (
            <div key={i}>
              <p className="text-sm font-bold text-gray-800 mb-1">{s.heading}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#2d2d5e] transition-colors">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Media Preview Modal ───────────────────────────────────────────────────────
function MediaPreviewModal({ src, type, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-sm font-semibold flex items-center gap-1 hover:opacity-80"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
        {type === "video" ? (
          <video src={src} controls autoPlay className="w-full rounded-xl max-h-[75vh] object-contain bg-black" />
        ) : (
          <img src={src} alt="Preview" className="w-full rounded-xl max-h-[75vh] object-contain bg-black" />
        )}
      </div>
    </div>
  );
}

// ─── Map Preview Modal ─────────────────────────────────────────────────────────
function MapModal({ lat, lng, onClose }) {
  const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">Map Preview</p>
            <p className="text-xs text-gray-500">Lat: {lat} · Lng: {lng}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <iframe
          title="Outlet Map"
          src={mapSrc}
          width="100%"
          height="420"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d5e] transition-colors">
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Components ────────────────────────────────────────────────────────
function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, guidelineKey, onGuidelineClick }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {guidelineKey && (
        <button
          onClick={() => onGuidelineClick(guidelineKey)}
          className="text-sm text-blue-500 hover:underline whitespace-nowrap ml-4 mt-0.5 flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Description guidelines
        </button>
      )}
    </div>
  );
}

// ─── Upload Box with Preview ───────────────────────────────────────────────────
function UploadBox({ accept = "image/*", mediaType = "image", sizeRule, sizeLimit, extraCols = [] }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <>
      <div className="bg-[#f3f6fb] rounded-xl p-4 flex flex-wrap items-center gap-4">
        {/* Info cols */}
        <div className="grid gap-1 text-sm min-w-[120px]">
          <span className="font-semibold text-gray-700">Pixel Size Rules</span>
          <span className="text-gray-500">{sizeRule || "3:4 ratio (50×50 px)"}</span>
        </div>
        <div className="grid gap-1 text-sm min-w-[100px]">
          <span className="font-semibold text-gray-700">Upload Size Limit</span>
          <span className="text-gray-500">{sizeLimit || "1.5 MB"}</span>
        </div>
        {extraCols.map((col, i) => (
          <div key={i} className="grid gap-1 text-sm min-w-[80px]">
            <span className="font-semibold text-gray-700">{col.label}</span>
            <span className="text-gray-500">{col.value}</span>
          </div>
        ))}

        {/* Thumbnail if uploaded */}
        {preview && mediaType === "image" && (
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
            <img src={preview} alt="thumb" className="w-full h-full object-cover" />
          </div>
        )}
        {preview && mediaType === "video" && (
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        )}

        {file && (
          <span className="text-xs text-gray-500 max-w-[120px] truncate">{file.name}</span>
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Eye icon — only when file is uploaded */}
          {preview && (
            <button
              onClick={() => setShowPreview(true)}
              title="Preview"
              className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}

          {/* Upload button */}
          <button
            onClick={() => inputRef.current.click()}
            className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d2d5e] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {file ? "Re-upload" : "Upload"}
          </button>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && preview && (
        <MediaPreviewModal src={preview} type={mediaType} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateBrandOutlet() {
  const [brandName,      setBrandName]      = useState("");
  const [category,       setCategory]       = useState("");
  const [subCategory,    setSubCategory]    = useState("");
  const [gstSameAsOutlet,setGstSameAsOutlet]= useState(false);
  const [mapsLink,       setMapsLink]       = useState(MERCHANT_DATA.mapsLink);
  const [latitude,       setLatitude]       = useState("");
  const [longitude,      setLongitude]      = useState("");
  const [saving,         setSaving]         = useState(false);
  const [guidelineType,  setGuidelineType]  = useState(null); // modal type
  const [showMap,        setShowMap]        = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); navigate("/under-review"); }, 2000);
  };

  const openGuideline = useCallback((type) => setGuidelineType(type), []);
  const closeGuideline = useCallback(() => setGuidelineType(null), []);

  const canShowMap = latitude.trim() !== "" && longitude.trim() !== "";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Modals */}
      {guidelineType && <GuidelinesModal type={guidelineType} onClose={closeGuideline} />}
      {showMap && canShowMap && (
        <MapModal lat={latitude} lng={longitude} onClose={() => setShowMap(false)} />
      )}

      {/* Navbar */}
          <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12  flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="Trydood"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="text-emerald-400 text-xs font-bold hidden">T</span>
          </div>
        </div>

        <div className="w-[34px] h-[34px] bg-purple-900 rounded-lg flex items-center justify-center cursor-pointer">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Your Brand Outlet</h1>
            <p className="text-sm text-gray-500 mt-1">You are just a few steps away from listing your event on Trydood!</p>
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-xl px-6 py-3 bg-blue-50 text-sm font-semibold text-gray-700 whitespace-nowrap">
            Merchant Token : <span className="text-gray-900">{MERCHANT_DATA.token}</span>
          </div>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* ── Brand Logo ── */}
        <SectionCard>
          <SectionHeader
            title="Brand Logo"
            subtitle="Upload Your Brand Identity Logo"
            guidelineKey="logo"
            onGuidelineClick={openGuideline}
          />
          <UploadBox
            accept="image/*"
            mediaType="image"
            sizeRule="1:1 ratio (min 500×500 px)"
            sizeLimit="1.5 MB"
          />
        </SectionCard>

        {/* ── Brand Name ── */}
        <SectionCard>
          <SectionHeader
            title="Search Brand Name"
            subtitle="Build Your Brand Identity"
            guidelineKey="brandName"
            onGuidelineClick={openGuideline}
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fill Brand Name</label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="eg : Toni & Guy"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 transition-colors bg-white text-gray-800"
          />
          <p className="mt-3 text-sm text-gray-600">
            <span className="text-blue-500 font-semibold">Note : </span>
            This is the name customers will see on the Trydood app.
          </p>
        </SectionCard>

        {/* ── Outlet Type ── */}
        <SectionCard>
          <SectionHeader
            title="Outlet Type"
            subtitle="Add category and sub-category tags to help the right audience discover your event."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700"
                >
                  <option value="">eg : Food & Drinks</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Category</label>
              <div className="relative">
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700 disabled:opacity-50"
                  disabled={!category}
                >
                  <option value="">eg : buffet restaurants</option>
                  {(SUB_CATEGORIES[category] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Location ── */}
        <SectionCard>
          <SectionHeader
            title="Location"
            subtitle="Help people in the area discover your event and let attendees know where to show up."
            guidelineKey="location"
            onGuidelineClick={openGuideline}
          />

          {/* GST address block */}
          <div className="border border-gray-200 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="gstSame"
                checked={gstSameAsOutlet}
                onChange={(e) => setGstSameAsOutlet(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <div>
                <label htmlFor="gstSame" className="text-sm font-bold text-gray-800 cursor-pointer">
                  GST Address Is The Same As The Outlet Location.
                </label>
                <p className="text-sm text-gray-500 mt-0.5">Search and select your Outlet address</p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-1">Address</p>
              <p className="text-sm text-gray-800">{MERCHANT_DATA.address}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Exact Google Maps link</p>
              <input
                type="text"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                className="w-full border border-gray-100 bg-[#f3f6fb] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 text-gray-700"
              />
            </div>
          </div>

          {/* Coordinates + Map */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-5">
              <input type="checkbox" className="mt-0.5 w-4 h-4 accent-indigo-600" />
              <div>
                <p className="text-sm font-bold text-gray-800">Find Your Outlet Location Using Google Maps.</p>
                <p className="text-sm text-gray-500 mt-0.5">Enter coordinates to pin your outlet precisely on the map.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude *</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder={`eg : ${MERCHANT_DATA.latitude}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude *</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder={`eg : ${MERCHANT_DATA.longitude}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700"
                />
              </div>
            </div>

            <button
              onClick={() => { if (canShowMap) setShowMap(true); }}
              disabled={!canShowMap}
              className={`w-full font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
                canShowMap
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {canShowMap ? "Show on Google Map" : "Enter coordinates to preview map"}
            </button>

            {!canShowMap && (
              <p className="text-xs text-gray-400 text-center mt-2">Fill in both Latitude and Longitude to enable map preview</p>
            )}
          </div>
        </SectionCard>

        {/* ── Showcase Collection ── */}
        <div className="mb-2">
          <h2 className="text-base font-bold text-gray-900 mb-4 px-1">Showcase Collection</h2>
        </div>

        {/* Ambience Photos */}
        <SectionCard>
          <SectionHeader
            title="Ambience Photo's"
            subtitle="Ensure images follow our event card guidelines and are provided in both formats."
            guidelineKey="ambiencePhoto"
            onGuidelineClick={openGuideline}
          />
          <UploadBox
            accept="image/*"
            mediaType="image"
            sizeRule="3:4 ratio (900×1200 px)"
            sizeLimit="1.5 MB"
          />
        </SectionCard>

        {/* Ambience Videos */}
        <SectionCard>
          <SectionHeader
            title="Ambience Video's"
            subtitle="Ensure videos follow our event card guidelines and are provided in both formats."
            guidelineKey="ambienceVideo"
            onGuidelineClick={openGuideline}
          />
          <UploadBox
            accept="video/*,.gif"
            mediaType="video"
            sizeRule="3:4 ratio (900×1200 px)"
            sizeLimit="5 MB"
            extraCols={[
              { label: "Format",   value: "GIF or .mp4" },
              { label: "Duration", value: "10 to 60 secs" },
            ]}
          />
        </SectionCard>

        {/* ── Save ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#1a1a2e] text-white font-semibold py-4 rounded-2xl text-base hover:bg-[#2d2d5e] active:scale-[0.99] transition-all disabled:opacity-70 mt-2"
        >
          {saving ? "Saving…" : "Save & Process"}
        </button>
      </div>
    </div>
  );
}