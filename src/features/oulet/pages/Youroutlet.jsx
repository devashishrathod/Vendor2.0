import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/Logo1.jpg";

import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { useAuthStore }       from "@/features/onboarding/store/authStore";

export default function YourOutlet() {
  const navigate    = useNavigate();
  const { formData } = useOnboardingStore();
  const currentScreen = useAuthStore((s) => s.currentScreen);

  // ── Auto-navigate: jab backend DASHBOARD screen return kare ──
  // authStore ka advanceScreen call hone ke baad currentScreen "DASHBOARD" ho jayega
  useEffect(() => {
    if (currentScreen === "DASHBOARD") {
      navigate("/dashboard", { replace: true });
    }
  }, [currentScreen, navigate]);

  const brandData = {
    companyName:   formData.gstDetails?.legalName || formData.businessName || "—",
    merchantToken: formData.marchentId             || "A4FG1WJOIUN20",
    gstNo:         formData.gstDetails?.gstNumber  || formData.gstin        || "—",
    panNo:         formData.pan                    || "—",
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
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
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Your Outlet</h1>
        <p className="text-xs text-gray-400 mb-6">Overview · Showcase your listing outlet</p>

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
            <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {brandData.companyName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Merchant Token: {brandData.merchantToken} &nbsp;·&nbsp; <br />
                Created on: February 22 | 03:14
              </p>
            </div>

            <button
              onClick={() => console.log("Recheck clicked")}
              className="flex-shrink-0 px-4 py-2 border border-gray-200 rounded-lg bg-white
                hover:bg-gray-50 text-gray-600 text-xs font-semibold
                transition-all duration-150 active:scale-[0.97]"
            >
              Recheck
            </button>
          </div>
        </div>

        {/* ── Polling indicator ── */}
        <p className="text-center text-xs text-gray-300 mt-8 flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Checking review status…
        </p>
      </div>
    </div>
  );
}


// import { useNavigate } from "react-router-dom";
// import logo from "@/assets/Logo1.jpg";

// import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";

// export default function YourOutlet() {
//   const navigate     = useNavigate();
//   const { formData } = useOnboardingStore();

//   // ── TODO: hardcoded for testing — baad mein yeh hata ke neeche wala uncomment karna ──
//   const isApproved = true;

//   // ── TODO: backend ready hone pe yeh uncomment karna + upar wali line hatana ──
//   // const currentScreen = useAuthStore((s) => s.currentScreen);
//   // const isApproved    = currentScreen === "DASHBOARD";
//   // useEffect(() => {
//   //   if (isApproved) navigate("/dashboard", { replace: true });
//   // }, [isApproved, navigate]);

//   const brandData = {
//     companyName:   formData.gstDetails?.legalName || formData.businessName || "—",
//     merchantToken: formData.marchentId             || "A4FG1WJOIUN20",
//     gstNo:         formData.gstDetails?.gstNumber  || formData.gstin        || "—",
//     panNo:         formData.pan                    || "—",
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 font-sans">
//       {/* ── Navbar ── */}
//       <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
//         <div className="flex items-center gap-2">
//           <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
//             <img
//               src={logo}
//               alt="Trydood"
//               className="w-12 h-12 object-contain"
//               onError={(e) => {
//                 e.target.style.display = "none";
//                 e.target.nextSibling.style.display = "block";
//               }}
//             />
//             <span className="text-emerald-400 text-xs font-bold hidden">T</span>
//           </div>
//         </div>

//         <div className="w-[34px] h-[34px] bg-purple-900 rounded-lg flex items-center justify-center cursor-pointer">
//           <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//           </svg>
//         </div>
//       </nav>

//       {/* ── Content ── */}
//       <div className="max-w-2xl mx-auto px-6 py-8">
//         <h1 className="text-xl font-bold text-gray-900 mb-1">Your Outlet</h1>
//         <p className="text-xs text-gray-400 mb-6">Overview · Showcase your listing outlet</p>

//         {/* Alert banner — review pending */}
//         {!isApproved && (
//           <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
//             <p className="text-sm font-semibold text-amber-800 mb-1">
//               Your listing is under review.
//             </p>
//             <p className="text-xs text-amber-700 leading-relaxed">
//               Trydood will review your listing details and verify them soon. If
//               there are any errors, your submission will be put on hold. The
//               Trydood team will contact you shortly.
//             </p>
//           </div>
//         )}

//         {/* Success banner — review done */}
//         {isApproved && (
//           <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 mb-5 flex items-center gap-3">
//             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
//               <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-emerald-600">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-semibold text-emerald-800">Your listing is approved!</p>
//               <p className="text-xs text-emerald-600 mt-0.5">You can now access your dashboard.</p>
//             </div>
//           </div>
//         )}

//         {/* Outlet card */}
//         <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
//           <div className="flex items-center gap-4 px-5 py-4">
//             <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
//               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//               </svg>
//             </div>

//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-semibold text-gray-900 truncate">
//                 {brandData.companyName}
//               </p>
//               <p className="text-xs text-gray-400 mt-0.5">
//                 Merchant Token: {brandData.merchantToken} &nbsp;·&nbsp; <br />
//                 Created on: February 22 | 03:14
//               </p>
//             </div>

//             <div className="flex flex-col gap-2 flex-shrink-0">
//               <button
//                 onClick={() => console.log("Recheck clicked")}
//                 className="px-4 py-2 border border-gray-200 rounded-lg bg-white
//                   hover:bg-gray-50 text-gray-600 text-xs font-semibold
//                   transition-all duration-150 active:scale-[0.97]"
//               >
//                 Recheck
//               </button>

//               {/* Dashboard button — sirf approved hone ke baad dikhega */}
//               {isApproved && (
//                 <button
//                   onClick={() => navigate("/dashboard")}
//                   className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600
//                     text-white text-xs font-semibold flex items-center justify-center gap-1.5
//                     transition-all duration-150 active:scale-[0.97]"
//                 >
//                   <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
//                   </svg>
//                   Dashboard
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Polling indicator — sirf pending mein */}
//         {!isApproved && (
//           <p className="text-center text-xs text-gray-300 mt-8 flex items-center justify-center gap-2">
//             <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
//             Checking review status…
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }