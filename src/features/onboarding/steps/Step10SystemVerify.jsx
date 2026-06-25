import { useState, useEffect, useRef } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { systemVerify } from "@/features/onboarding/services/api/verify.api";
import { parseApiError } from "@/hooks/useApiError";
import { Loader2Icon, AlertTriangleIcon, XIcon, CheckIcon } from 'lucide-react';

// ── Multi-Boom Confetti ───────────────────────────────────────────────────────
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

    // Emoji booms — multiple icons screen pe
    const BOOM_EMOJIS = ["🎉","🎊","✨","🥳","🎈","🎁","⭐","💥"];
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:99998;overflow:hidden;";
    document.body.appendChild(container);

    const spawnBoom = (delay) => {
      setTimeout(() => {
        const el = document.createElement("span");
        el.textContent = BOOM_EMOJIS[Math.floor(Math.random() * BOOM_EMOJIS.length)];
        const x    = 5 + Math.random() * 88;
        const size = 28 + Math.random() * 36;
        el.style.cssText = `position:absolute;left:${x}vw;bottom:-60px;font-size:${size}px;opacity:0;transform:scale(0.3) rotate(${(Math.random()-0.5)*40}deg);transition:opacity 0.35s ease,transform 0.45s cubic-bezier(0.34,1.6,0.64,1),bottom 0.6s ease;will-change:transform,opacity;`;
        container.appendChild(el);
        requestAnimationFrame(() => {
          el.style.bottom   = `${20 + Math.random() * 68}vh`;
          el.style.opacity  = "1";
          el.style.transform = `scale(1) rotate(${(Math.random()-0.5)*15}deg)`;
          setTimeout(() => {
            el.style.opacity   = "0";
            el.style.transform = `scale(0.4) translateY(-30px)`;
          }, 800 + Math.random() * 400);
        });
      }, delay);
    };

    for (let i = 0; i < 12; i++) spawnBoom(i * 110 + Math.random() * 60);
    for (let i = 0; i < 8;  i++) spawnBoom(650 + i * 100 + Math.random() * 80);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (container.parentNode) container.parentNode.removeChild(container);
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
    done:     { wrap:"bg-green-50 border-green-200",   icon:"bg-emerald-500 text-white",    label:"text-emerald-800", sub:"text-emerald-700", badge:"bg-green-100 text-emerald-800" },
    warn:     { wrap:"bg-yellow-50 border-yellow-200", icon:"bg-amber-400 text-white",      label:"text-amber-900",   sub:"text-amber-700",   badge:"bg-yellow-100 text-amber-800" },
    failed:   { wrap:"bg-red-50 border-red-200",       icon:"bg-red-400 text-white",        label:"text-red-800",     sub:"text-red-700",     badge:"bg-red-100 text-red-800"      },
    checking: { wrap:"bg-gray-50 border-gray-100",     icon:"bg-green-100 text-green-600",  label:"text-gray-500",    sub:"text-gray-400",    badge:"" },
    pending:  { wrap:"bg-gray-50 border-gray-100",     icon:"bg-gray-100",                  label:"text-gray-300",    sub:"",                 badge:"" },
  }[status] || {};

  const Icon = () => {
    if (status === "done")     return <CheckIcon className="w-3.5 h-3.5" />;
    if (status === "failed")   return <XIcon className="w-3.5 h-3.5" />;
    if (status === "warn")     return <AlertTriangleIcon className="w-3.5 h-3.5" />;
    if (status === "checking") return <Loader2Icon className="w-3.5 h-3.5 animate-spin" />;
    return <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />;
  };

  const badgeLabel = status==="done" ? "OK" : status==="warn" ? "Review" : status==="failed" ? "Error" : null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border ${cfg.wrap}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-28px)",
        transition: `opacity 0.38s ease, transform 0.38s cubic-bezier(0.34,1.2,0.64,1)`,
        transitionDelay: `${index * 65}ms`,
      }}
    >
      <div className={`w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0 ${cfg.icon}`}>
        <Icon />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold leading-tight ${cfg.label}`}>{label}</p>
        {detail && <p className={`text-[9px] mt-0.5 leading-snug ${cfg.sub}`}>{detail}</p>}
      </div>
      {badgeLabel && (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
          {badgeLabel}
        </span>
      )}
    </div>
  );
}

// ── Build checks ──────────────────────────────────────────────────────────────
function buildChecks(flags = {}, remarks = []) {
  const r = (key) => remarks.find((x) => x.toLowerCase().includes(key)) || null;
  return [
    { key:"pan",       label:"PAN verified",          status: flags.panVerified ? "done" : "failed",                                                    detail: !flags.panVerified ? "PAN could not be verified" : null },
    { key:"gst",       label:"GST verified & active", status: !flags.gstVerified ? "failed" : !flags.gstActive ? "warn" : "done",                        detail: !flags.gstVerified ? "GST not verified" : !flags.gstActive ? "GST inactive" : null },
    { key:"panGst",    label:"PAN ↔ GST match",       status: flags.panMatchedWithGST ? "done" : "warn",                                                  detail: !flags.panMatchedWithGST ? r("pan") || "Name mismatch" : null },
    { key:"bank",      label:"Bank account verified",  status: !flags.bankVerified ? "failed" : !flags.bankMatched ? "warn" : "done",                     detail: !flags.bankVerified ? "Bank not verified" : !flags.bankMatched ? r("bank") || "Holder name mismatch" : null },
    { key:"entity",    label:"Business entity match",  status: flags.businessEntityMatched ? "done" : "warn",                                             detail: !flags.businessEntityMatched ? "Entity type mismatch" : null },
    { key:"duplicate", label:"No duplicate records",   status: (flags.duplicatePAN||flags.duplicateGST||flags.duplicateBank||flags.duplicateWhatsapp) ? "warn" : "done", detail: flags.duplicateWhatsapp ? r("duplicate") || "Duplicate detected" : null },
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
    <div className="flex items-center justify-center w-full">
      <style>{`
        @keyframes stepIn { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:none} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.4) rotate(-15deg)} to{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <Confetti active={showConfetti} />

      <div className="w-full max-w-sm" style={{ animation:"stepIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both" }}>

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl px-5 pt-5 pb-5 mb-3 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-28 h-28 rounded-full bg-white absolute -top-8 -right-8" />
            <div className="w-16 h-16 rounded-full bg-white absolute -bottom-4 -left-4" />
          </div>
          <div className="relative flex items-start justify-between gap-3">
            <div>
              {phase === "loading" ? (
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-white" style={{ animation:"spin 2s linear infinite" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              ) : (
                <div className="text-3xl mb-1.5" style={{ animation:"popIn 0.5s cubic-bezier(0.34,1.6,0.64,1) 0.1s both" }}>
                  {phase === "success" ? "🎉" : "🛡️"}
                </div>
              )}
              <h2 className="text-base font-bold text-white leading-tight">
                {phase === "loading" ? "Verifying your details" : "System verification"}
              </h2>
              <p className="text-[11px] text-white/75 mt-1 leading-relaxed max-w-[200px]">
                {phase === "loading"
                  ? "Cross-checking PAN, GST and bank…"
                  : phase === "success"
                  ? "All checks passed successfully."
                  : "Verification complete. See results below."}
              </p>
            </div>
            {sysData?.score != null && (
              <div className="bg-white/20 rounded-2xl px-3 py-2 text-center flex-shrink-0" style={{ animation:"popIn 0.5s cubic-bezier(0.34,1.6,0.64,1) 0.2s both" }}>
                <p className="text-xl font-bold text-white">{sysData.score}</p>
                <p className="text-[9px] text-white/80 font-semibold mt-0.5">
                  {sysData.score >= 80 ? "Excellent" : sysData.score >= 50 ? "Fair" : "Low"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Check cards ── */}
        {checks.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {checks.map((c, i) => <CheckCard key={c.key} {...c} index={i} />)}
          </div>
        )}

        {/* ── Skeleton ── */}
        {phase === "loading" && checks.length === 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-100" style={{ opacity:0.55 }}>
                <div className="w-7 h-7 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="h-2.5 rounded-full bg-gray-200 animate-pulse flex-1" />
              </div>
            ))}
          </div>
        )}

        {/* ── Remarks — BLUE styling ── */}
        {sysData?.remarks?.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-3">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Remarks</p>
            {sysData.remarks.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
                <span className="w-1 h-1 rounded-full bg-blue-300 flex-shrink-0 mt-1.5" />
                <span className="text-[11px] text-blue-600 leading-snug">{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Actions ── */}
        {phase !== "loading" && (
          <div className="flex flex-col gap-2">
            {showRetry && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {retrying
                  ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                }
                {retrying ? "Retrying…" : "Try again"}
              </button>
            )}
            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-2xl text-white text-sm font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm bg-emerald-500 hover:bg-emerald-600"
            >
              Continue to partner contract
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}