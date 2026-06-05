import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Image1 from "@/assets/svg/device-sync.svg";
import Image2 from "../../../assets/Logo1.jpg";
import Step2OTP from './Step2VerifyOTP';          // ← OTP modal
import { validateWhatsApp } from '../validation'; // ← validator

const BUBBLES = [
    [110, '8%',  '6%',  'rgba(16,185,129,0.12)', 6,   0  ],
    [70,  '18%', '28%', 'rgba(99,102,241,0.11)',  8,   1  ],
    [90,  '42%', '3%',  'rgba(244,63,94,0.10)',   7,   2  ],
    [60,  '18%', '82%', 'rgba(20,184,166,0.12)',  9,   0.5],
    [80,  '12%', '62%', 'rgba(245,158,11,0.10)',  7.5, 3  ],
    [45,  '75%', '12%', 'rgba(16,185,129,0.13)',  5.5, 1.5],
    [50,  '55%', '22%', 'rgba(139,92,246,0.11)',  10,  2.5],
    [65,  '70%', '72%', 'rgba(99,102,241,0.10)',  8.5, 1  ],
    [40,  '85%', '45%', 'rgba(244,63,94,0.10)',   6.5, 3.5],
    [55,  '30%', '88%', 'rgba(16,185,129,0.11)',  7,   0.8],
    [35,  '60%', '55%', 'rgba(245,158,11,0.09)',  9.5, 2  ],
    [75,  '88%', '30%', 'rgba(139,92,246,0.10)',  8,   1.2],
];

const FISHES = [
    ['8%',   '-5%',  18, 14, 0,   '#10b981'],
    ['15%',  '-5%',  14, 18, 2,   '#6366f1'],
    ['22%',  '-5%',  20, 12, 4,   '#f43f5e'],
    ['30%',  '-5%',  16, 16, 1,   '#14b8a6'],
    ['38%',  '-5%',  22, 20, 3,   '#f59e0b'],
    ['45%',  '-5%',  15, 15, 5,   '#8b5cf6'],
    ['52%',  '-5%',  19, 13, 0.5, '#10b981'],
    ['60%',  '-5%',  13, 19, 2.5, '#6366f1'],
    ['68%',  '-5%',  21, 11, 1.5, '#f43f5e'],
    ['75%',  '-5%',  17, 17, 4,   '#14b8a6'],
    ['82%',  '-5%',  14, 14, 3,   '#f59e0b'],
    ['90%',  '-5%',  20, 22, 0.8, '#8b5cf6'],
    ['12%',  '-5%',  16, 16, 6,   '#f59e0b'],
    ['25%',  '-5%',  18, 13, 7,   '#10b981'],
    ['48%',  '-5%',  12, 21, 1,   '#f43f5e'],
    ['63%',  '-5%',  23, 12, 5,   '#6366f1'],
    ['72%',  '-5%',  15, 18, 2,   '#14b8a6'],
    ['85%',  '-5%',  17, 15, 3.5, '#10b981'],
    ['35%',  '-5%',  19, 20, 4.5, '#8b5cf6'],
    ['55%',  '-5%',  14, 17, 6,   '#f59e0b'],
];

const FishSVG = ({ color, size }) => (
    <svg width={size} height={size * 0.8} viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 12 L40 4 L40 20 Z" fill={color} opacity="0.7" />
        <ellipse cx="17" cy="12" rx="17" ry="9" fill={color} opacity="0.75" />
        <circle cx="7" cy="10" r="2" fill="white" opacity="0.9" />
        <circle cx="7" cy="10" r="1" fill="#1a1a2e" />
        <path d="M14 3 Q17 8 20 3" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
);

// ── Inline ErrorMessage ───────────────────────────────────────────────────────
function ErrorMessage({ message }) {
    if (!message) return null;
    return (
        <div className="flex items-start gap-2 mt-2 text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <span className="text-xs font-medium">{message}</span>
        </div>
    );
}

export default function Step1WhatsApp() {
    const [phoneOrEmail, setPhoneOrEmail] = useState('');
    const [error, setError]               = useState(null);
    const [loading, setLoading]           = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async () => {
        // Validate
        const err = validateWhatsApp(phoneOrEmail);
        if (err) return setError(err);
        setError(null);
        setLoading(true);

        try {
            // await api.sendOTP(phoneOrEmail);
            console.log('[API] sendOTP →', phoneOrEmail);
            await new Promise(r => setTimeout(r, 600)); // simulated API call
            setOtpModalOpen(true); // ← open OTP modal
        } catch (e) {
            setError(e.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSendOTP();
    };

    return (
        <div className="min-h-screen flex flex-row relative overflow-hidden bg-white">

            {/* Soft green gradient — bottom-left */}
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at bottom left, rgba(16,185,129,0.15) 0%, transparent 70%)' }}
            />

            <style>{`
                .bubble {
                    position: absolute;
                    border-radius: 50%;
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    border: 1.5px solid rgba(255,255,255,0.55);
                    pointer-events: none;
                    animation: floatB ease-in-out infinite;
                }
                @keyframes floatB {
                    0%,100% { transform: translateY(0px) scale(1); }
                    50%     { transform: translateY(-14px) scale(1.03); }
                }
                .fish {
                    position: absolute;
                    pointer-events: none;
                    animation: swimAcross linear infinite;
                    opacity: 0.45;
                }
                @keyframes swimAcross {
                    0%   { transform: translateX(0vw)   translateY(0px); }
                    25%  { transform: translateX(25vw)  translateY(-8px); }
                    50%  { transform: translateX(50vw)  translateY(4px); }
                    75%  { transform: translateX(75vw)  translateY(-6px); }
                    100% { transform: translateX(105vw) translateY(0px); }
                }
            `}</style>

            {/* Bubbles */}
            {BUBBLES.map(([size, top, left, bg, dur, delay], i) => (
                <div key={i} className="bubble" style={{
                    width: size, height: size,
                    top, left,
                    background: bg,
                    boxShadow: `inset 0 0 ${size * 0.15}px ${bg}, 0 4px ${size * 0.2}px ${bg}`,
                    animationDuration: `${dur}s`,
                    animationDelay: `${delay}s`,
                }} />
            ))}

            {/* 20 Swimming Fish */}
            {FISHES.map(([top, , size, dur, delay, color], i) => (
                <div key={`fish-${i}`} className="fish" style={{
                    top,
                    left: '-5%',
                    animationDuration: `${dur}s`,
                    animationDelay: `-${delay}s`,
                }}>
                    <FishSVG color={color} size={size} />
                </div>
            ))}

            {/* ── Left Side — Illustration + Text ── */}
            <div className="w-1/2 flex flex-col items-center justify-center pl-10 pr-6 relative z-10 gap-6">
                <img
                    src={Image1}
                    alt="Business Growth Illustration"
                    className="w-full max-w-md h-auto object-contain drop-shadow-sm"
                />
                <div className="text-center max-w-xs px-4">
                    <p className="text-gray-700 text-md font-medium leading-relaxed">
                        Grow your business with ease on{' '}<br />
                        <span className="text-emerald-500 font-bold">Trydood.</span>
                    </p>
                    <p className="text-gray-500 text-xs leading-relaxed mt-1">
                        Enjoy low-cost subscriptions and easy access<br />to powerful business tools.
                    </p>
                </div>
            </div>

            {/* ── Right Side — Login Form ── */}
            <div className="w-1/2 flex items-center justify-center relative z-10">
                <div className="w-full max-w-sm px-8 py-10 flex flex-col">

                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <img src={Image2} alt="Trydood" className="w-36 h-24 object-contain" />
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            Welcome <span className="text-emerald-500">Back!</span>
                        </h2>
                        <p className="text-sm text-gray-400">Enter your WhatsApp number to continue</p>
                    </div>

                    {/* Form */}
                    <div className="flex flex-col gap-3">
                        <div className="relative">
                            {/* +91 prefix */}
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">
                                +91
                            </span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="Enter WhatsApp number"
                                value={phoneOrEmail}
                                onChange={(e) => {
                                    setPhoneOrEmail(e.target.value.replace(/\D/g, '').slice(0, 10));
                                    setError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                maxLength={10}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition duration-200"
                            />
                        </div>

                        {/* Error */}
                        <ErrorMessage message={error} />

                        <div className="flex justify-center">
                            <button
                                onClick={handleSendOTP}
                                disabled={loading || phoneOrEmail.length < 10}
                                className={`w-3/4 py-2.5 font-bold rounded-xl text-sm tracking-widest transition duration-200 active:scale-95 flex items-center justify-center gap-2
                                    ${loading || phoneOrEmail.length < 10
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                        </svg>
                                        Sending…
                                    </>
                                ) : (
                                    <>SEND OTP <span>→</span></>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1 mt-1">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            We will never share your number with anyone.
                        </p>

                        <div className="flex items-center gap-3 my-1">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400">or</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        <p className="text-sm text-gray-600 text-center">
                            Don't have an account?{' '}
                            {/* <button
                                onClick={() => navigate('/register')}
                                className="text-emerald-500 font-semibold hover:text-emerald-600 hover:underline transition"
                            >
                                Sign up
                            </button> */}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-0.5">In case of any queries, reach out to</p>
                            <a href="mailto:TrydoodTeam@gmail.com"
                                className="text-sm text-emerald-500 hover:text-emerald-600 font-medium hover:underline transition">
                                TrydoodTeam@gmail.com
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── OTP Modal (Step 2) ── */}
            <Step2OTP
                isOpen={otpModalOpen}
                onClose={() => setOtpModalOpen(false)}
                phoneNumber={phoneOrEmail}
                onVerified={() => {
                    setOtpModalOpen(false);
                    // navigate to next step is handled inside Step2OTP
                }}
            />
        </div>
    );
}