import { useState, useRef } from "react";
import logo2 from "@/assets/Logo1.jpg";
import { useNavigate } from "react-router-dom";

// ─── Static Data ───────────────────────────────────────────────────────────────
const MERCHANT_DATA = {
  token: "A4FG1WJOIUN20",
  address:
    "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040",
  mapsLink: "https://maps.app.goo.gl/PgwWnUXuiNy5XuVg7",
  latitude: "13.0827° N",
  longitude: "80.2707° E",
};

const CATEGORIES = [
  "Food & Drinks",
  "Health & Wellness",
  "Beauty & Spa",
  "Education",
  "Entertainment",
  "Fitness",
];
const SUB_CATEGORIES = {
  "Food & Drinks": [
    "Buffet Restaurants",
    "Cafes",
    "Bakeries",
    "Fast Food",
    "Fine Dining",
  ],
  "Health & Wellness": ["Yoga", "Meditation", "Ayurveda", "Naturopathy"],
  "Beauty & Spa": ["Salon", "Spa", "Nail Studio", "Skin Clinic"],
  Education: ["Coaching", "Workshops", "Online Classes"],
  Entertainment: ["Events", "Gaming", "Movies"],
  Fitness: ["Gym", "Crossfit", "Zumba", "Swimming"],
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-6 mb-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, linkText, onLink }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {linkText && (
        <button
          onClick={onLink}
          className="text-sm text-blue-500 hover:underline whitespace-nowrap ml-4 mt-0.5"
        >
          {linkText}
        </button>
      )}
    </div>
  );
}

function UploadBox({ extraCols = [] }) {
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    if (e.target.files[0]) setFileName(e.target.files[0].name);
  };

  return (
    <div className="bg-[#f3f6fb] rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="grid gap-1 text-sm">
        <span className="font-semibold text-gray-700">pixels Size rules</span>
        <span className="text-gray-500">3:4 aspect ratio (50px by 50px)</span>
      </div>
      <div className="grid gap-1 text-sm">
        <span className="font-semibold text-gray-700">Upload size limits</span>
        <span className="text-gray-500">1.5MB</span>
      </div>
      {extraCols.map((col, i) => (
        <div key={i} className="grid gap-1 text-sm">
          <span className="font-semibold text-gray-700">{col.label}</span>
          <span className="text-gray-500">{col.value}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {fileName && (
          <span className="text-xs text-gray-500 max-w-[120px] truncate">
            {fileName}
          </span>
        )}
        <button
          onClick={() => inputRef.current.click()}
          className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d2d5e] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

function PreviewUploadBox({ sizeRule, sizeLimit, extraCols = [] }) {
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    if (e.target.files[0]) setFileName(e.target.files[0].name);
  };

  return (
    <div className="bg-[#f3f6fb] rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="grid gap-1 text-sm">
        <span className="font-semibold text-gray-700">pixels Size rules</span>
        <span className="text-gray-500">{sizeRule}</span>
      </div>
      <div className="grid gap-1 text-sm">
        <span className="font-semibold text-gray-700">Upload size limits</span>
        <span className="text-gray-500">{sizeLimit}</span>
      </div>
      {extraCols.map((col, i) => (
        <div key={i} className="grid gap-1 text-sm">
          <span className="font-semibold text-gray-700">{col.label}</span>
          <span className="text-gray-500">{col.value}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <button className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
        <button
          onClick={() => inputRef.current.click()}
          className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d2d5e] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CreateBrandOutlet() {
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [gstSameAsOutlet, setGstSameAsOutlet] = useState(false);
  const [mapsLink, setMapsLink] = useState(MERCHANT_DATA.mapsLink);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 2000);
    navigate("/under-review");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-1">
          {/* img */}
          <img
            src={logo2}
            alt="Trydood Logo"
            className="w-12 h-12 object-contain"
          />
          {/* <span className="text-lg font-black text-[#1a1a2e] tracking-tight">TRYDOOD</span> */}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title + Token */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create Your Brand Outlet
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              You are just a few steps away from listing your event on Trydood!
            </p>
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-xl px-6 py-3 bg-blue-50 text-sm font-semibold text-gray-700 whitespace-nowrap">
            Merchant Token :{" "}
            <span className="text-gray-900">{MERCHANT_DATA.token}</span>
          </div>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* ── Brand Logo ── */}
        <SectionCard>
          <SectionHeader
            title="Brand Logo"
            subtitle="Upload Your Brand Identity Logo"
            linkText="Description guidelines"
          />
          <UploadBox />
        </SectionCard>

        {/* ── Search Brand Name ── */}
        <SectionCard>
          <SectionHeader
            title="Search Brand Name"
            subtitle="Build Your Brand Identity"
            linkText="Description guidelines"
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fill Brand Name
          </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory("");
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700"
                >
                  <option value="">eg : Food & Drinks</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sub-Category
              </label>
              <div className="relative">
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700"
                  disabled={!category}
                >
                  <option value="">eg : buffet restaurants</option>
                  {(SUB_CATEGORIES[category] || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Location ── */}
        <SectionCard>
          <SectionHeader
            title="Location"
            subtitle="Help people in the area discover your event and let attendees know where to show up"
            linkText="Map & Location  guidelines"
          />

          {/* GST Same checkbox */}
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
                <label
                  htmlFor="gstSame"
                  className="text-sm font-bold text-gray-800 cursor-pointer"
                >
                  GST Address Is The Same As The Outlet Location.
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Search and select your Outlet address
                </p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Address
              </p>
              <p className="text-sm text-gray-800">{MERCHANT_DATA.address}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Exact Google Maps link
              </p>
              <input
                type="text"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                className="w-full border border-gray-100 bg-[#f3f6fb] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 text-gray-700"
              />
            </div>
          </div>

          {/* Google Maps coordinates */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-5">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Find Your Outlet Location Using Google Maps.
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Discover your outlet instantly with smart map navigation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Latitude *
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder={`eg : ${MERCHANT_DATA.latitude}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder={`eg : ${MERCHANT_DATA.longitude}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700"
                />
              </div>
            </div>

            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors">
              Selected Google Map
            </button>
          </div>
        </SectionCard>

        {/* ── Showcase Collection ── */}
        <div className="mb-2">
          <h2 className="text-base font-bold text-gray-900 mb-4 px-1">
            Showcase Collection
          </h2>
        </div>

        {/* Ambience Photos */}
        <SectionCard>
          <SectionHeader
            title="Ambience Photo's"
            subtitle="Ensure images follow our event card guidelines and are provided in both formats."
            linkText="Images  guidelines"
          />
          <PreviewUploadBox
            sizeRule="3:4 aspect ratio (50px by 50px)"
            sizeLimit="1.5MB"
          />
        </SectionCard>

        {/* Ambience Videos */}
        <SectionCard>
          <SectionHeader
            title="Ambience Video's"
            subtitle="Ensure Video'sfollow our event card guidelines and are provided in both formats."
            linkText="Video guidelines"
          />
          <PreviewUploadBox
            sizeRule="3:4 Size (900px by 1200px)"
            sizeLimit="5MB"
            extraCols={[
              { label: "Format", value: "Gif or .mp4" },
              { label: "Duration", value: "10 to 60 secs" },
            ]}
          />
        </SectionCard>

        {/* ── Save & Process ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#1a1a2e] text-white font-semibold py-4 rounded-2xl text-base hover:bg-[#2d2d5e] active:scale-[0.99] transition-all disabled:opacity-70 mt-2"
        >
          {saving ? "Saving..." : "Save & Process"}
        </button>
      </div>
    </div>
  );
}
