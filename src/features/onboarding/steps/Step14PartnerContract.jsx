import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TERMS = [
  {
    title: "Partnership Scope",
    body: "This agreement governs the relationship between Trydood and the Partner for the purpose of delivering services as outlined in the onboarding documentation.",
  },
  {
    title: "Roles & Responsibilities",
    body: "The Partner agrees to maintain accurate business information, comply with applicable laws, and fulfil all obligations as described in the Trydood Partner Handbook.",
  },
  {
    title: "Revenue & Payments",
    body: "Payouts will be processed per the agreed schedule. Trydood reserves the right to withhold payments in case of policy violations or disputed transactions.",
  },
];

function ContactModal({ isOpen, onClose, onSubmit, onDoLater }) {
  const [mobile,     setMobile]     = useState('');
  const [email,      setEmail]      = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors,     setErrors]     = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!uploadFile) e.uploadFile = 'Please upload a document';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({ mobile, email, uploadFile });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setUploadFile(file);
    setErrors(prev => ({ ...prev, uploadFile: null }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemove = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadFile(null);
    setPreviewUrl(null);
  };

  return (
    <div
      onClick={(ev) => ev.target === ev.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', animation: 'fadeInModal 0.15s ease' }}
    >
      <style>{`
        @keyframes fadeInModal { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUpModal {
          from { opacity:0; transform:translateY(20px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      <div
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-gray-100"
        style={{ animation: 'slideUpModal 0.25s cubic-bezier(0.34,1.4,0.64,1)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800">Complete your Profile</p>
            <p className="text-xs text-emerald-600 mt-0.5">Enter your contact details to proceed</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: 2-column */}
        <div className="grid grid-cols-2 divide-x divide-gray-100">

          {/* LEFT: Mobile + Email */}
          <div className="px-6 py-5 flex flex-col gap-4">

            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
               Alternate Mobile Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="w-px h-4 bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400">+91</span>
                  <span className="w-px h-4 bg-gray-200" />
                </div>
                <input
                  type="tel" placeholder="98765 43210" value={mobile} maxLength={10}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(prev => ({ ...prev, mobile: null })); }}
                  className={`w-full pl-[4.5rem] pr-4 py-2.5 rounded-xl border text-sm font-mono font-semibold
                    text-gray-800 tracking-widest outline-none transition-all duration-200
                    placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-300
                    ${errors.mobile ? 'border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50'}`}
                />
              </div>
              {errors.mobile && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>{errors.mobile}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                Business Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email" placeholder="you@business.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })); }}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-gray-800 outline-none
                    transition-all duration-200 placeholder:text-gray-300
                    ${errors.email ? 'border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50'
                      : 'border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50'}`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>{errors.email}
                </p>
              )}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mt-auto">
              <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Your contact details will be used for subscription confirmation and billing updates.
              </p>
            </div>
          </div>

          {/* RIGHT: Upload + Preview + Buttons */}
          <div className="px-6 py-5 flex flex-col gap-3">

            {/* Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                Upload Document <span className="text-red-400">*</span>
              </label>

              {/* ── Image Preview ── */}
              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50/30"
                  style={{ height: '140px' }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  {/* Remove button */}
                  <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 hover:bg-white
                      border border-gray-200 shadow flex items-center justify-center transition-all"
                  >
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* File name bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-white/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2">
                    <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-[10px] font-semibold text-emerald-700 truncate">{uploadFile.name}</p>
                    <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{(uploadFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              )}

              {/* PDF / non-image preview */}
              {uploadFile && !previewUrl && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 truncate">{uploadFile.name}</p>
                    <p className="text-[10px] text-emerald-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={handleRemove} className="w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Drop zone — hide when file selected */}
              {!uploadFile && (
                <label className={`relative flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl
                  border-2 border-dashed cursor-pointer transition-all duration-200 group
                  ${errors.uploadFile ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'}`}
                >
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFileChange} />
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-600 group-hover:text-emerald-600 transition-colors">Click to upload</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">PDF, JPG, PNG supported</p>
                  </div>
                </label>
              )}

              {/* Change button when file selected */}
              {uploadFile && (
                <label className="cursor-pointer">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFileChange} />
                  <span className="text-[11px] text-emerald-500 font-semibold hover:underline cursor-pointer">
                    ↩ Change file
                  </span>
                </label>
              )}

              {errors.uploadFile && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>{errors.uploadFile}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-auto flex gap-2.5 pt-2">
              <button
                onClick={onDoLater}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white
                  hover:bg-gray-50 text-gray-500 text-sm font-semibold
                  transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Do Later
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600
                  text-white text-sm font-semibold transition-all duration-200
                  active:scale-[0.98] shadow-sm shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step5PartnerContract() {
  const [agreed,    setAgreed]    = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleModalSubmit = ({ mobile, email, uploadFile }) => {
    console.log('Contact details:', { mobile, email, uploadFile });
    setShowModal(false);
    navigate('/subscription');
  };

  const handleDoLater = () => {
    setShowModal(false);
    navigate('/subscription');
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl overflow-hidden"
        style={{ animation: "stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both" }}>
        <style>{`
          @keyframes stepIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* LEFT */}
          <div className="p-7 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Partner Deed Agreement</h2>
                <p className="text-xs text-gray-400 mt-0.5">Review and accept to complete onboarding</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Partnership Deed Document</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                You're nearly there! Review and sign the digital contract below to finish onboarding with Trydood.
              </p>
              <a href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Trydood Partner Agreement ↗
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Also review the full{" "}
              <a href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                target="_blank" rel="noopener noreferrer"
                className="text-emerald-500 font-semibold hover:text-emerald-600 hover:underline transition-colors">
                Terms &amp; Conditions
              </a>{" "}before accepting.
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
              border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40
              has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50/60">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer flex-shrink-0" />
              <span className="text-sm text-gray-600">
                I have read and agree to the{" "}
                <a href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                  target="_blank" rel="noopener noreferrer"
                  className="text-emerald-500 font-semibold hover:underline cursor-pointer">
                  Trydood Partner Agreement
                </a>{" "}and all associated{" "}
                <a href="https://community.docusign.com/salesforce-30/url-link-with-the-docusign-agreement-1353"
                  target="_blank" rel="noopener noreferrer"
                  className="text-emerald-500 font-semibold hover:underline cursor-pointer">
                  terms and conditions
                </a>.
              </span>
            </label>

            <div className="mt-auto">
              <button
                onClick={() => setShowModal(true)}
                disabled={!agreed}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${agreed
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-sm shadow-emerald-200"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"}`}>
                {agreed && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Subscription Plan
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="p-7 bg-gray-50/50 flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Terms &amp; Conditions Summary</p>
            <div className="flex flex-col gap-3">
              {TERMS.map((term, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 font-bold" style={{ fontSize: '9px' }}>{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">{term.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{term.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                For the full legal document, open the partner agreement link. Contact{" "}
                <a href="mailto:support@trydood.com" className="text-emerald-500 font-semibold hover:underline">
                  support@trydood.com
                </a>{" "}for any queries.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        onDoLater={handleDoLater}
      />
    </div>
  );
}