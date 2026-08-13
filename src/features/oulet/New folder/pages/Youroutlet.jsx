import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo1 from "@/assets/Logo1.jpg";

import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { getBrandById } from "../services/brandOutletApi"; // ← path apne project ke hisaab se adjust karo

export default function UnderReview() {
  const navigate = useNavigate();
  const { formData } = useOnboardingStore();

  // ⚠️ brandId abhi formData se maan liya hai — agar authStore me alag
  // key par store hai (jaise brand._id), to yahan wahi use karna.
  const brandId = formData?.brandId || formData?.brand?._id || null;

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch brand from /brands/get?brandId=:brandId ──────────────
  const fetchBrand = useCallback(async ({ silent } = {}) => {
    if (!brandId) {
      setError("Brand ID missing — can't load review status.");
      setLoading(false);
      return;
    }
    if (silent) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const res = await getBrandById(brandId);
      const data = res?.data ?? res;

      console.log("[YourOutlet] fetchBrand ← response:", data);
      setBrand(data);

      // Backend's authoritative screen state lives on data.user.currentScreen
      if (data?.user?.currentScreen === "DASHBOARD") {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Couldn't fetch brand status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [brandId, navigate]);

  // ── Initial fetch on mount ──────────────────────────────────────
  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  // ── Also react if authStore's currentScreen updates live (e.g. via
  // socket/poll elsewhere in the app) ─────────────────────────────
  const authCurrentScreen = useAuthStore((s) => s.currentScreen);
  useEffect(() => {
    if (authCurrentScreen === "DASHBOARD") {
      navigate("/dashboard", { replace: true });
    }
  }, [authCurrentScreen, navigate]);

  const handleRecheck = () => fetchBrand({ silent: true });

  // ── Map real API fields (see /brands/get response) ──────────────
  const brandData = {
    companyName: brand?.gst?.legalName || brand?.legalBusinessName || brand?.brandName || "—",
    merchantToken: brand?.merchantId || "—",
    gstNo: brand?.gst?.gstNumber || "—",
    panNo: brand?.pan?.pan || "—",
    createdAt: brand?.createdAt || null,
    logo: brand?.logo || null,   // ← ye line missing thi
  };

  const formattedDate = brandData.createdAt
    ? new Date(brandData.createdAt).toLocaleString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
    : "—";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading review status…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img
              src={logo1}
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
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Your Outlet</h1>
        <p className="text-xs text-gray-400 mb-6">Overview · Showcase your listing outlet</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Alert banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            Your listing is under review.
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Trydood will review your listing details and verify them soon. If
            there are any errors, your submission will be put on hold. The
            Trydood team will contact you shortly.
          </p>
        </div>

        {/* Outlet card */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-12 h-16 flex items-center justify-center overflow-hidden">
              <img
                src={brandData.logo}
                alt="Trydood"
                className="w-12 h-16 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="text-emerald-400 text-xs font-bold hidden">T</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {brandData.companyName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Merchant Token: {brandData.merchantToken} &nbsp;·&nbsp; <br />
                Created on: {formattedDate}
              </p>
            </div>

            <button
              onClick={handleRecheck}
              disabled={refreshing}
              className="flex-shrink-0 px-4 py-2 border border-gray-200 rounded-lg bg-white
                hover:bg-gray-50 text-gray-600 text-xs font-semibold
                transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
            >
              {refreshing ? "Checking…" : "Recheck"}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate("/manage-outlet")} // ← apna actual route lagana
          className="w-full mt-4 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700
    text-sm font-semibold rounded-xl transition-all duration-150 active:scale-[0.98]"
        >
          Manage Your Outlet
        </button>

        {/* ── Polling indicator ── */}
        <p className="text-center text-xs text-gray-300 mt-8 flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Checking review status…
        </p>
      </div>
    </div>
  );
}