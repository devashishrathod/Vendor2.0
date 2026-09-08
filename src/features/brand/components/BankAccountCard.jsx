import { useState } from "react";
import { Eye, EyeOff, User, Hash, Landmark, Building2, MapPin, ShieldCheck } from "lucide-react";

function DetailTile({ icon, iconBg, label, value, wide, mono }) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex flex-col gap-1.5 ${wide ? "sm:col-span-3" : ""}`}>
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span className={`text-sm font-semibold text-gray-800 leading-snug ${mono ? "font-mono tracking-wide" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

const BankAccountCard = ({ account, isSelected, onSelect }) => {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const displayedAccountNumber = showAccountNumber
    ? account.fullAccountNumber || account.maskedAccountNumber
    : account.maskedAccountNumber;

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => onSelect(account.id)}
        className="flex w-full items-center gap-3 border-b border-gray-100 px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
      >
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
            isSelected ? "border-emerald-600" : "border-gray-300"
          }`}
        >
          {isSelected && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
        </span>
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
          <Landmark className="w-4 h-4 text-indigo-500" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold capitalize text-gray-900">
              {account.bankName}
            </p>
            {account.isValid && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck size={11} />
                Verified
              </span>
            )}
          </div>
          <p className={`text-xs ${isSelected ? "text-emerald-600" : "text-gray-400"}`}>
            {isSelected ? "Primary Account" : "Not Selected"}
          </p>
        </div>
      </button>

      <div className="p-5 space-y-4">
        {/* Account number — highlighted like the onboarding bank-verification screen */}
        <div className="relative flex items-center justify-between overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/80 mb-1">
              Account Number
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Hash className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />
              </div>
              <span className="font-mono text-lg font-bold tracking-[0.12em] text-emerald-900">
                {displayedAccountNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAccountNumber((v) => !v)}
            aria-label={showAccountNumber ? "Hide account number" : "Show account number"}
            className="w-9 h-9 rounded-xl bg-white border border-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            {showAccountNumber ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Rest of the details — same icon-tile style as the rest of the app */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DetailTile
            label="Account Holder Name"
            value={account.accountHolderName}
            iconBg="#EFF6FF"
            icon={<User className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />}
          />
          <DetailTile
            label="IFSC Code"
            value={account.ifscCode}
            mono
            iconBg="#FAF5FF"
            icon={<Hash className="w-3.5 h-3.5 text-purple-500" strokeWidth={2} />}
          />
          <DetailTile
            label="Account Type"
            value={account.accountType}
            iconBg="#ECFEFF"
            icon={<Landmark className="w-3.5 h-3.5 text-cyan-500" strokeWidth={2} />}
          />
          <DetailTile
            label="Branch Name"
            value={account.branch}
            iconBg="#FFFBEB"
            icon={<Building2 className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />}
          />
          <DetailTile
            label="Bank Address"
            value={account.bankAddress}
            wide
            iconBg="#ECFDF5"
            icon={<MapPin className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />}
          />
        </div>
      </div>
    </div>
  );
};

export default BankAccountCard;
