import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';



// ── Confetti particle ────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#10b981','#6366f1','#f43f5e','#f59e0b','#8b5cf6','#14b8a6','#3b82f6','#ec4899',
];
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    particles.current = Array.from({ length: 80 }, () => ({
      x:    Math.random() * canvas.width,
      y:    -10 - Math.random() * 40,
      vx:   (Math.random() - 0.5) * 3,
      vy:   2 + Math.random() * 3,
      size: 5 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      alpha: 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.current.forEach(p => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height * 0.7) p.alpha = Math.max(0, p.alpha - 0.02);
        if (p.alpha > 0) alive = true;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (alive) rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      style={{ borderRadius: '1.5rem' }} />
  );
}

// ── Verified check items ─────────────────────────────────────────────────────
const VERIFIED_ITEMS = [
  { label: 'PAN Verified',   delay: 0.1 },
  { label: 'GST Verified',   delay: 0.2 },
  { label: 'Bank Verified',  delay: 0.3 },
  { label: 'All Set to Go!', delay: 0.4 },
];

function VerifiedItem({ label, delay, visible }) {
  return (
    <div className="flex items-center gap-2.5 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-12px)',
        transitionDelay: `${delay}s`,
      }}>
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-sm font-semibold text-emerald-700">{label}</span>
    </div>
  );
}

// ── What happens next items ───────────────────────────────────────────────────
const NEXT_ITEMS = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    text: 'Your profile is under review by our team',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    text: 'Once approved, you can start receiving orders',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    text: 'You will be notified about the status',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    text: 'Keep your documents updated for smooth operations',
  },
];

// ── Main component ───────────────────────────────────────────────────────────
export default function Step13Complete({ onDashboard }) {
  const navigate = useNavigate();
  const [itemsVisible, setItemsVisible] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [iconPopped, setIconPopped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setIconPopped(true), 200);
    const t2 = setTimeout(() => setConfettiActive(true), 400);
    const t3 = setTimeout(() => setItemsVisible(true), 600);
    const t4 = setTimeout(() => setConfettiActive(false), 3500);
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, []);

  const handleDashboard = () => {
    if (onDashboard) onDashboard();
    else navigate('/dashboard');
  };

  return (
    <div className=" flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-white">
     

      <style>{`
        @keyframes pageIn  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes stepIn  { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes popIn   { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes ringPulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          70%  { box-shadow: 0 0 0 20px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      `}</style>

      {/* ── Horizontal layout wrapper ── */}
      <div
        className="relative z-10 w-full max-w-3xl mx-6 flex flex-row items-stretch gap-4"
        style={{ animation:'pageIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both' }}
      >

        {/* ── Left: Congratulations card ── */}
        <div
          className="relative flex flex-col items-center  overflow-hidden flex-1"
          style={{ animation:'stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}
        >
          <Confetti active={confettiActive} />

          {/* Big animated check */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              {iconPopped && (
                <div className="absolute inset-0 rounded-full"
                  style={{ animation:'ringPulse 1.2s ease-out 0.2s 2' }} />
              )}
              <div
                className={`w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200 transition-all duration-500
                  ${iconPopped ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                style={iconPopped ? { animation:'popIn 0.5s cubic-bezier(0.34,1.6,0.64,1) both' } : {}}
              >
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Congratulations!</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your vendor onboarding is<br />completed successfully.
            </p>
          </div>

          {/* Verified checklist */}
          <div className="w-full bg-emerald-50/70 border border-emerald-100 rounded-xl px-3 py-3 mb-3 space-y-2">
            {VERIFIED_ITEMS.map((item) => (
              <VerifiedItem
                key={item.label}
                label={item.label}
                delay={item.delay}
                visible={itemsVisible}
              />
            ))}
          </div>

          {/* Go to Dashboard CTA — pushed to bottom */}
          <div className="w-full mt-auto">
            <button
              onClick={handleDashboard}
              className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wide bg-emerald-500 hover:bg-emerald-600 text-white
                active:scale-[0.98] shadow-sm shadow-emerald-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Dashboard
            </button>
            <p className="text-center text-xs text-gray-300 mt-2">Step 13 of 13</p>
          </div>
        </div>

        {/* ── Right: What happens next card ── */}
        <div
          className=" flex flex-col flex-1"
          style={{ animation:'stepIn 0.45s cubic-bezier(0.34,1.4,0.64,1) 0.1s both' }}
        >
          <h3 className="text-sm font-bold text-gray-900 mb-4">What happens next?</h3>
          <div className="space-y-3.5 flex-1">
            {NEXT_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 mt-0.5">
                  {item.icon}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed pt-1">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-500">Note:</span> You can always update your information from your profile settings.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}