
// // ─────────────────────────────────────────────────────────────────────────────
// // Input.jsx  —  @/components/common/Input
// // ─────────────────────────────────────────────────────────────────────────────
// // Sab icons built-in hain — icon="card" | "ifsc" | "person" | "pan" | "gst"
// //   | "business" | "shortname" | "phone" | "email" | "lock"
// // InlineFieldError bhi isi mein merge hai — alag se import karne ki zaroorat nahi
// // ─────────────────────────────────────────────────────────────────────────────

// import { useState } from "react";

// // ─── Eye Icons ────────────────────────────────────────────────────────────────
// const EyeIcon = () => (
//   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//       d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//   </svg>
// );

// const EyeOffIcon = () => (
//   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//       d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.523 10.523 0 01-4.293 5.774M6.228 6.228A10.45 10.45 0 002.458 12c1.274 4.057 5.065 7 9.542 7a9.46 9.46 0 004.638-1.227" />
//   </svg>
// );

// // ─── Built-in Icons — icon prop mein string pass karo ────────────────────────
// const ICONS = {
//   // Bank account number
//   card: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//     </svg>
//   ),
//   // IFSC / location
//   ifsc: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//     </svg>
//   ),
//   // Person / account holder
//   person: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//     </svg>
//   ),
//   // PAN card
//   pan: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
//     </svg>
//   ),
//   // GST / invoice
//   gst: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
//     </svg>
//   ),
//   // Business / building
//   business: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//     </svg>
//   ),
//   // Short name / tag
//   shortname: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
//     </svg>
//   ),
//   // Phone / WhatsApp
//   phone: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//     </svg>
//   ),
//   // Email
//   email: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//     </svg>
//   ),
//   // Lock / password / account type
//   lock: (
//     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
//         d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//     </svg>
//   ),
// };

// // ─── Valid / Invalid indicator ────────────────────────────────────────────────
// const ValidTick = () => (
//   <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
//     <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
//     </svg>
//   </div>
// );

// const InvalidTick = () => (
//   <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center">
//     <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
//     </svg>
//   </div>
// );

// // ─── Border class ─────────────────────────────────────────────────────────────
// function borderClass(touched, isValid) {
//   if (!touched) return "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50";
//   if (isValid)  return "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50";
//   return "border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50";
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main Component
// // ─────────────────────────────────────────────────────────────────────────────
// export default function Input({
//   // Label
//   label,
//   required  = false,
//   optional  = false,

//   // Value & handlers
//   placeholder,
//   value      = "",
//   onChange,
//   onFocus,
//   onBlur,
//   onKeyDown,

//   // Input behaviour
//   type       = "text",
//   inputMode,
//   maxLength,
//   minLength,
//   disabled   = false,
//   mono       = false,
//   uppercase  = false,

//   // Validation
//   touched    = false,
//   isValid    = false,

//   // Messages
//   errorMsg,
//   successMsg,

//   // Icon — pass string key: "card" | "ifsc" | "person" | "pan" | "gst"
//   //                       | "business" | "shortname" | "phone" | "email" | "lock"
//   //        OR pass a ReactNode for custom icon
//   icon,

//   // Eye toggle (account number reveal)
//   showEyeToggle  = false,
//   revealed       = false,
//   onToggleReveal,

//   // Extra wrapper class
//   className = "",
// }) {
//   const [focused, setFocused] = useState(false);

//   const handleFocus = (e) => { setFocused(true);  onFocus?.(e); };
//   const handleBlur  = (e) => { setFocused(false); onBlur?.(e);  };

//   // Resolve icon — string → built-in, ReactNode → as-is, undefined → nothing
//   const resolvedIcon =
//     typeof icon === "string" ? (ICONS[icon] ?? null) : (icon ?? null);

//   const plClass = resolvedIcon ? "pl-9" : "pl-3";
//   const prClass = showEyeToggle ? "pr-16" : touched ? "pr-9" : "pr-3";

//   // Char count values
//   const len     = typeof value === "string" ? value.length : 0;
//   const needed  = minLength && len < minLength ? minLength - len : 0;
//   const showCharCount = touched && !isValid && (minLength || maxLength);

//   const charLabel =
//     minLength && maxLength ? `${len} / ${minLength}–${maxLength}`
//     : minLength            ? `${len} / min ${minLength}`
//     : maxLength            ? `${len} / ${maxLength}`
//     : "";

//   const charColor =
//     len === 0      ? "text-gray-300"
//     : needed > 0   ? "text-red-400"
//     :                "text-amber-500";

//   return (
//     <div className={`flex flex-col ${className}`}>

//       {/* ── Label ── */}
//       {label && (
//         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
//           {label}
//           {required && <span className="text-red-400">*</span>}
//           {optional && (
//             <span className="bg-gray-100 text-gray-400 text-[9px] font-semibold px-1.5 py-0.5 rounded normal-case tracking-normal">
//               Optional
//             </span>
//           )}
//         </label>
//       )}

//       {/* ── Input wrapper ── */}
//       <div className={`relative transition-all duration-200 ${focused ? "shadow-sm" : ""}`}>

//         {/* Left icon */}
//         {resolvedIcon && (
//           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
//             {resolvedIcon}
//           </div>
//         )}

//         {/* Input element */}
//         <input
//           type={type}
//           placeholder={placeholder}
//           value={value}
//           onChange={onChange}
//           onFocus={handleFocus}
//           onBlur={handleBlur}
//           onKeyDown={onKeyDown}
//           maxLength={maxLength}
//           inputMode={inputMode}
//           disabled={disabled}
//           className={[
//             "w-full py-2.5 bg-white border rounded-lg text-sm font-medium text-gray-800",
//             plClass,
//             prClass,
//             mono      ? "font-mono tracking-widest"  : "",
//             uppercase ? "uppercase"                   : "",
//             disabled  ? "opacity-50 cursor-not-allowed bg-gray-50" : "",
//             "placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal",
//             "outline-none transition-all duration-200",
//             borderClass(touched, isValid),
//           ].filter(Boolean).join(" ")}
//         />

//         {/* Eye toggle */}
//         {showEyeToggle && (
//           <button
//             type="button"
//             onClick={onToggleReveal}
//             tabIndex={-1}
//             className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
//           >
//             {revealed ? <EyeOffIcon /> : <EyeIcon />}
//           </button>
//         )}

//         {/* Valid / Invalid tick */}
//         {touched && (
//           <div className="absolute right-3 top-1/2 -translate-y-1/2">
//             {isValid ? <ValidTick /> : <InvalidTick />}
//           </div>
//         )}
//       </div>

//       {/* ── Below input — error + char count OR success ── */}
//       {touched && (
//         <div className="min-h-[18px] mt-">
//           {!isValid && errorMsg ? (
//             // Error row — message left, char count right
//             <div className="flex items-start justify-between gap-2">
//               <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 leading-tight">
//                 <svg className="w-3 h-3 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd"
//                     d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//                     clipRule="evenodd" />
//                 </svg>
//                 {errorMsg}
//               </p>
//               {showCharCount && (
//                 <span className={`text-[10px] font-semibold flex-shrink-0 tabular-nums ${charColor}`}>
//                   {charLabel}
//                 </span>
//               )}
//             </div>
//           ) : isValid && successMsg ? (
//             // Success row
//             <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
//               <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
//               </svg>
//               {successMsg}
//             </p>
//           ) : null}
//         </div>
//       )}
//     </div>
//   );
// }


// ─────────────────────────────────────────────────────────────────────────────
// Input.jsx  —  @/components/common/Input
// ─────────────────────────────────────────────────────────────────────────────
// Sab icons built-in hain — icon="card" | "ifsc" | "person" | "pan" | "gst"
//   | "business" | "shortname" | "phone" | "email" | "lock"
// InlineFieldError bhi isi mein merge hai — alag se import karne ki zaroorat nahi
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

// ─── Eye Icons ────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.523 10.523 0 01-4.293 5.774M6.228 6.228A10.45 10.45 0 002.458 12c1.274 4.057 5.065 7 9.542 7a9.46 9.46 0 004.638-1.227" />
  </svg>
);

// ─── Built-in Icons ───────────────────────────────────────────────────────────
const ICONS = {
  card: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  ifsc: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  person: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  pan: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
    </svg>
  ),
  gst: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  business: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  shortname: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

// ─── Valid / Invalid indicator ────────────────────────────────────────────────
const ValidTick = () => (
  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const InvalidTick = () => (
  <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center">
    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
);

// ─── Border class ─────────────────────────────────────────────────────────────
function borderClass(touched, isValid) {
  if (!touched) return "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50";
  if (isValid)  return "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50";
  return "border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Input({
  // Label
  label,
  required  = false,
  optional  = false,

  // Value & handlers
  placeholder,
  value      = "",
  onChange,
  onFocus,
  onBlur,
  onKeyDown,

  // Input behaviour
  type       = "text",
  inputMode,
  maxLength,
  minLength,
  disabled   = false,
  mono       = false,
  uppercase  = false,

  // Validation
  touched    = false,
  isValid    = false,

  // Messages
  errorMsg,
  successMsg,

  // Icon — string key: "card"|"ifsc"|"person"|"pan"|"gst"|"business"|"shortname"|"phone"|"email"|"lock"
  //        OR ReactNode for custom icon
  icon,

  // Eye toggle
  showEyeToggle  = false,
  revealed       = false,
  onToggleReveal,

  // Extra wrapper class
  className = "",
}) {
  const [focused, setFocused] = useState(false);

  const handleFocus = (e) => { setFocused(true);  onFocus?.(e); };
  const handleBlur  = (e) => { setFocused(false); onBlur?.(e);  };

  const resolvedIcon =
    typeof icon === "string" ? (ICONS[icon] ?? null) : (icon ?? null);

  const plClass = resolvedIcon ? "pl-9" : "pl-3";
  const prClass = showEyeToggle ? "pr-10" : touched ? "pr-9" : "pr-3";

  // ─── Char counter logic ───────────────────────────────────────────────────
  const len         = typeof value === "string" ? value.length : 0;
  const remaining   = minLength ? Math.max(0, minLength - len) : 0;
  const showCounter = !!(minLength || maxLength);

  // "7 / 10" — right side mein dikhega
  const counterText = (() => {
    if (!touched || len === 0) {
      if (minLength === maxLength) return `0 / ${minLength}`;
      if (minLength && maxLength)  return `0 / ${minLength}–${maxLength}`;
      if (minLength)               return `0 / ${minLength}`;
      if (maxLength)               return `0 / ${maxLength}`;
      return "";
    }
    const total =
      minLength === maxLength ? minLength
      : remaining > 0         ? minLength
      : maxLength             ? maxLength
      : minLength;
    return `${len} / ${total}`;
  })();

  const counterColor =
    !touched || len === 0 ? "text-gray-300"
    : isValid             ? "text-emerald-500"
    : remaining > 0       ? "text-amber-600"
    :                       "text-red-400";

  // Dynamic error message — "3 more characters needed" override
  const resolvedErrorMsg =
    touched && !isValid && remaining > 0 && minLength
      ? `${remaining} more character${remaining !== 1 ? "s" : ""} needed`
      : errorMsg;

  return (
    <div className={`flex flex-col ${className}`}>

      {/* ── Label ── */}
      {label && (
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          {label}
          {required && <span className="text-red-400">*</span>}
          {optional && (
            <span className="bg-gray-100 text-gray-400 text-[9px] font-semibold px-1.5 py-0.5 rounded normal-case tracking-normal">
              Optional
            </span>
          )}
        </label>
      )}

      {/* ── Input wrapper ── */}
      <div className={`relative transition-all duration-200 ${focused ? "shadow-sm" : ""}`}>

        {/* Left icon */}
        {resolvedIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
            {resolvedIcon}
          </div>
        )}

        {/* Input element */}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          maxLength={maxLength}
          inputMode={inputMode}
          disabled={disabled}
          className={[
            "w-full py-2.5 bg-white border rounded-lg text-sm font-medium text-gray-800",
            plClass,
            prClass,
            mono      ? "font-mono tracking-widest"  : "",
            uppercase ? "uppercase"                   : "",
            disabled  ? "opacity-50 cursor-not-allowed bg-gray-50" : "",
            "placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal",
            "outline-none transition-all duration-200",
            borderClass(touched, isValid),
          ].filter(Boolean).join(" ")}
        />

        {/* Eye toggle */}
        {showEyeToggle && (
          <button
            type="button"
            onClick={onToggleReveal}
            tabIndex={-1}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}

        {/* Valid / Invalid tick */}
        {touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? <ValidTick /> : <InvalidTick />}
          </div>
        )}
      </div>

      {/* ── Bottom row — message left, counter right ── */}
      {(touched || showCounter) && (
        <div className="min-h-[18px] mt-1 flex items-start justify-between gap-2">

          {/* Left — error ya success message */}
          <div className="flex-1">
            {touched && !isValid && resolvedErrorMsg ? (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 leading-tight">
                <svg className="w-3 h-3 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd" />
                </svg>
                {resolvedErrorMsg}
              </p>
            ) : touched && isValid && successMsg ? (
              <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {successMsg}
              </p>
            ) : null}
          </div>

          {/* Right — character counter */}
          {showCounter && counterText && (
            <span className={`text-[11px] font-semibold tabular-nums flex-shrink-0 flex items-center gap-1 ${counterColor}`}>
              {touched && isValid && (
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {counterText}
            </span>
          )}

        </div>
      )}
    </div>
  );
}