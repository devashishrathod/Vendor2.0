import { useState, useEffect, useRef } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { systemVerify } from "@/features/onboarding/services/api/verify.api";
import { parseApiError } from "@/hooks/useApiError";
import { Loader2Icon, AlertTriangleIcon, XIcon, CheckIcon, InfoIcon, ShieldCheckIcon, RotateCwIcon, FileSearchIcon, ArrowRightIcon } from 'lucide-react';

// ── Multi-Boom Confetti (emoji boom removed, particle confetti kept) ──────────
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#10b981","#34d399","#60a5fa","#a78bfa","#f472b6","#fbbf24","#fb923c"];

    const particles = Array.from({ length: 180 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 11 + 3;
      const ox = canvas.width  * (0.15 + Math.random() * 0.7);
      const oy = canvas.height * (0.15 + Math.random() * 0.55);
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size:  Math.random() * 9 + 3,
        rot:   Math.random() * 360,
        rotS:  (Math.random() - 0.5) * 12,
        op: 1,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.22; p.vx *= 0.98;
        p.rot += p.rotS; p.op -= 0.008;
        if (p.op <= 0) return;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.op);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
        else { ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      });
      if (alive) animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef} style={{ position:"fixed",top:0,left:0,width:"100vw",height:"100vh",pointerEvents:"none",zIndex:99999 }} />
  );
}

// ── Check Card ────────────────────────────────────────────────────────────────
function CheckCard({ label, status, detail, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 65 + 50);
    return () => clearTimeout(t);
  }, [index]);

  const cfg = {
    done:     { wrap:"bg-white border-slate-100",      icon:"bg-emerald-500 text-white", label:"text-slate-800", sub:"text-slate-400", badge:"bg-emerald-50 text-emerald-600" },
    warn:     { wrap:"bg-amber-50 border-amber-100",    icon:"bg-amber-400 text-white",   label:"text-slate-800", sub:"text-slate-500", badge:"bg-amber-100 text-amber-700" },
    failed:   { wrap:"bg-red-50 border-red-100",        icon:"bg-red-400 text-white",     label:"text-slate-800", sub:"text-slate-500", badge:"bg-red-100 text-red-700" },
    checking: { wrap:"bg-white border-slate-100",       icon:"bg-emerald-100 text-emerald-500", label:"text-slate-400", sub:"text-slate-300", badge:"" },
    pending:  { wrap:"bg-white border-slate-100",       icon:"bg-slate-100",              label:"text-slate-300", sub:"",                badge:"" },
  }[status] || {};

  const Icon = () => {
    if (status === "done")     return <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />;
    if (status === "failed")   return <XIcon className="w-3.5 h-3.5" strokeWidth={3} />;
    if (status === "warn")     return <AlertTriangleIcon className="w-3.5 h-3.5" fill="white" strokeWidth={0} />;
    if (status === "checking") return <Loader2Icon className="w-3.5 h-3.5 animate-spin" />;
    return <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />;
  };

  const badgeLabel = status==="done" ? "OK" : status==="warn" ? "Review" : status==="failed" ? "Error" : null;

  // pull a trailing "(NN%)" out of the detail text — shown as its own badge, matching the reference
  const pctMatch = detail ? detail.match(/\((\d+)%\)/) : null;
  const pct = pctMatch ? pctMatch[1] : null;
  const detailText = detail ? detail.replace(/\s*\(\d+%\)\s*$/, "") : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${cfg.wrap}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-28px)",
        transition: `opacity 0.38s ease, transform 0.38s cubic-bezier(0.34,1.2,0.64,1)`,
        transitionDelay: `${index * 65}ms`,
      }}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.icon}`}>
        <Icon />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold leading-tight ${cfg.label}`}>{label}</p>
        {detailText && <p className={`text-[11px] mt-0.5 leading-snug ${cfg.sub}`}>{detailText}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {badgeLabel && (
          <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg ${cfg.badge}`}>
            {badgeLabel}
          </span>
        )}
        {pct && (
          <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700">
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Build checks ──────────────────────────────────────────────────────────────
function buildChecks(flags = {}, remarks = []) {
  const r = (key) => remarks.find((x) => x.toLowerCase().includes(key)) || null;
  return [
    { key:"pan",       label:"PAN verified",          status: flags.panVerified ? "done" : "failed",                                                    detail: flags.panVerified ? "PAN is verified successfully" : "PAN could not be verified" },
    { key:"gst",       label:"GST verified & active", status: !flags.gstVerified ? "failed" : !flags.gstActive ? "warn" : "done",                        detail: !flags.gstVerified ? "GST not verified" : !flags.gstActive ? "GST inactive" : "GST is verified and active" },
    { key:"panGst",    label:"PAN ↔ GST match",       status: flags.panMatchedWithGST ? "done" : "warn",                                                  detail: flags.panMatchedWithGST ? "PAN & GST details match" : (r("pan") || "Name mismatch") },
    { key:"bank",      label:"Bank account verified",  status: !flags.bankVerified ? "failed" : !flags.bankMatched ? "warn" : "done",                     detail: !flags.bankVerified ? "Bank not verified" : !flags.bankMatched ? (r("bank") || "Holder name mismatch") : "Bank account details match" },
    { key:"entity",    label:"Business entity match",  status: flags.businessEntityMatched ? "done" : "warn",                                             detail: flags.businessEntityMatched ? "Business entity details match" : "Entity type mismatch" },
    { key:"duplicate", label:"No duplicate records",   status: (flags.duplicatePAN||flags.duplicateGST||flags.duplicateBank||flags.duplicateWhatsapp) ? "warn" : "done", detail: flags.duplicateWhatsapp ? (r("duplicate") || "Duplicate detected") : "No duplicate records found" },
  ];
}

// ── Session cache — reload pe dobara API nahi chalegi ─────────────────────────
const SESSION_KEY = "sv_result"; // sv = systemVerify

function saveSession(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (_) {}
}
function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Step10SystemVerify({ onSuccess }) {
  const { goToStep, setVerificationFailedChecks, formData } = useOnboardingStore();

  const [phase, setPhase]               = useState("loading");
  const [checks, setChecks]             = useState([]);
  const [sysData, setSysData]           = useState(null);
  const [apiError, setApiError]         = useState(null);
  const [retrying, setRetrying]         = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const didInit = useRef(false);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const animateChecks = async (builtChecks) => {
    setChecks(builtChecks.map((c) => ({ ...c, status: "pending" })));
    for (let i = 0; i < builtChecks.length; i++) {
      await sleep(300 + i * 80);
      setChecks((prev) => prev.map((c, idx) => idx===i ? { ...c, status:"checking" } : c));
      await sleep(500);
      setChecks((prev) => prev.map((c, idx) => idx===i ? builtChecks[i] : c));
    }
    await sleep(300);
  };

  // ── Resolve phase + confetti from any result data ─────────────────────────
  const resolvePhase = (data, builtChecks) => {
    // ✅ Confetti HAMESHA fire hoga — chahe koi bhi status ho
    setTimeout(() => setShowConfetti(true), 200);

    const problemChecks = builtChecks.filter((c) => c.status !== "done").map((c) => c.key);

    if (data.status === "APPROVED") {
      setVerificationFailedChecks([]);
      setPhase("success");
    } else if (data.status === "REVIEW" || data.status === "MANUAL_REVIEW") {
      setVerificationFailedChecks(problemChecks);
      setPhase("review");
    } else {
      setVerificationFailedChecks(problemChecks);
      setPhase("failed");
    }
  };

  const runVerification = async () => {
    setPhase("loading");
    setChecks([]);
    setApiError(null);
    setSysData(null);
    setShowConfetti(false);

    try {
      const res  = await systemVerify();
      const data = res.data;
      setSysData(data);
      saveSession(data); // sessionStorage mein save karo
      const builtChecks = buildChecks(data.flags, data.remarks);
      await animateChecks(builtChecks);
      resolvePhase(data, builtChecks);
    } catch (err) {
      const parsed = parseApiError(err.responseData || { message: err.message });
      setApiError(parsed);
      setPhase("error");
    }
  };

  useEffect(() => {
    if (didInit.current) return; // strict mode double-fire guard
    didInit.current = true;

    // 1. formData already verified? seedha success
    if (formData?.systemVerified) {
      setPhase("success");
      setTimeout(() => setShowConfetti(true), 200);
      return;
    }

    // 2. Session cache check — reload pe yahi data milega, API skip
    const cached = loadSession();
    if (cached) {
      setSysData(cached);
      const builtChecks = buildChecks(cached.flags, cached.remarks);
      setChecks(builtChecks); // animate mat karo, seedha show karo
      resolvePhase(cached, builtChecks);
      return;
    }

    // 3. Pehli baar — fresh API call
    runVerification();
  }, []); // eslint-disable-line

  const handleRetry = async () => {
    clearSession(); // cache clear karo taaki fresh call ho
    setRetrying(true);
    await sleep(200);
    setRetrying(false);
    runVerification();
  };

  const handleContinue = () => {
    if (onSuccess) onSuccess();
    else goToStep(STEPS.PARTNER_CONTRACT);
  };

  const showRetry = phase === "failed" || phase === "error";

  return (
    <div className="flex items-center justify-center w-full py-6">
      <style>{`
        @keyframes stepIn { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:none} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.4) rotate(-15deg)} to{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <Confetti active={showConfetti} />

      <div className="w-full max-w-3xl" style={{ animation:"stepIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both" }}>

        {/* ── Hero ── */}
        <div className="relative rounded-3xl px-7 py-6 mb-5 overflow-hidden border border-emerald-100" style={{ background: "linear-gradient(120deg, #ecfdf5 0%, #f0fdf9 55%, #ffffff 100%)" }}>
          {/* dotted pattern */}
          <div className="absolute right-44 top-1/2 -translate-y-1/2 grid grid-cols-6 gap-1.5 opacity-40 pointer-events-none">
            {[...Array(24)].map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-emerald-300" />
            ))}
          </div>

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0"
                style={{ animation: phase!=="loading" ? "popIn 0.5s cubic-bezier(0.34,1.6,0.64,1) 0.1s both" : "none" }}
              >
                {phase === "loading" ? (
                  <Loader2Icon className="w-6 h-6 text-emerald-500 animate-spin" />
                ) : (
                  <ShieldCheckIcon className="w-7 h-7 text-emerald-500" fill="#d1fae5" strokeWidth={1.75} />
                )}
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-slate-800 leading-tight">
                  {phase === "loading" ? "Verifying your details" : "System verification"}
                </h2>
                <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                  {phase === "loading"
                    ? "Cross-checking PAN, GST and bank…"
                    : "Verification complete. See results below."}
                </p>
              </div>
            </div>

            {sysData?.score != null && (
              <div className="bg-white rounded-2xl shadow-sm px-5 py-3 text-center flex-shrink-0" style={{ animation:"popIn 0.5s cubic-bezier(0.34,1.6,0.64,1) 0.2s both" }}>
                <p className="text-3xl font-extrabold text-emerald-500 leading-none">{sysData.score}</p>
                <p className="text-[12px] text-emerald-500 font-semibold mt-1">
                  {sysData.score >= 80 ? "Excellent" : sysData.score >= 50 ? "Fair" : "Low"}
                </p>
                <div className="w-20 h-1 rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, sysData.score)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Check cards ── */}
        {checks.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-5">
            {checks.map((c, i) => <CheckCard key={c.key} {...c} index={i} />)}
          </div>
        )}

        {/* ── Skeleton ── */}
        {phase === "loading" && checks.length === 0 && (
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-100" style={{ opacity:0.55 }}>
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                <div className="h-2.5 rounded-full bg-slate-200 animate-pulse flex-1" />
              </div>
            ))}
          </div>
        )}

        {/* ── Remarks ── */}
        {sysData?.remarks?.length > 0 && (
          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-5 py-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                <InfoIcon className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
              <p className="text-[11px] font-bold text-sky-600 uppercase tracking-widest">Remarks</p>
            </div>
            {sysData.remarks.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0 pl-6">
                <span className="w-1 h-1 rounded-full bg-sky-400 flex-shrink-0 mt-1.5" />
                <span className="text-[12.5px] text-sky-700 leading-snug">{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Actions ── */}
        {phase !== "loading" && (
          <div className="flex items-center justify-end gap-3">
            {showRetry && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {retrying
                  ? <Loader2Icon className="w-4 h-4 animate-spin" />
                  : <RotateCwIcon className="w-4 h-4" />
                }
                {retrying ? "Retrying…" : "Try again"}
              </button>
            )}
            {/* {!showRetry && (
              <button className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <FileSearchIcon className="w-4 h-4" />
                View Details
              </button>
            )} */}
            <button
              onClick={handleContinue}
              className="px-6 py-3 rounded-xl text-white text-sm font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm bg-emerald-500 hover:bg-emerald-600"
            >
              Continue to partner contract
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}