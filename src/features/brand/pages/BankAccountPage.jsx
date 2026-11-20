import { useState, useMemo } from "react";
import { Landmark, Plus } from "lucide-react";

import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";
import BankAccountSection from "../components/BankAccountSection";
import KycAddModal from "../components/KycAddModal";
import useProfileRefresh from "../hooks/useProfileRefresh";

/**
 * BankAccountPage
 * "Bank Account Details" tab — reads the live brand.bank object
 * (from BrandPage's useBrandData) and adapts it into the
 * { subtitle, activeAccountSubtitle, accounts: [...] } shape
 * BankAccountSection/BankAccountCard expect.
 */
const BankAccountPage = ({ brand, brandLoading, brandError, reload }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [adding, setAdding] = useState(false);
  const refresh = useProfileRefresh(reload);
  // A skipped bank can be added once (guide §8); a saved one is read-only.
  const canAddBank = useOnboardingStatusStore((s) => Boolean(s.status?.editable?.kyc?.add?.bank));

  const bankAccountDetails = useMemo(() => {
    const bank = brand?.bank;

    if (!bank) {
      return {
        subtitle: "Manage the bank account linked to your payouts.",
        activeAccountSubtitle: "No bank account linked yet.",
        accounts: [],
      };
    }

    const address = bank.bankAddress;
    const bankAddress = address
      ? [address.addressLine1, address.city, address.district, address.state, address.country]
          .filter(Boolean)
          .join(", ")
      : undefined;

    return {
      subtitle: "Manage the bank account linked to your payouts.",
      activeAccountSubtitle: "This account is used to receive your settlements.",
      accounts: [
        {
          id: bank._id,
          isPrimary: true,
          bankName: bank.bankName,
          accountHolderName: bank.accountHolderName,
          // Only the server's masked number / last 4 — the full number is
          // never read (brands/get stops sending it).
          maskedAccountNumber: bank.maskedAccountNumber || (bank.accountLast4Digits ? `XXXX XXXX ${bank.accountLast4Digits}` : null),
          ifscCode: bank.ifscCode,
          branch: bank.branchName,
          bankAddress,
          accountType: bank.accountType,
          isValid: bank.isValid,
          isVerified: bank.isVerified,
          verificationStatus: bank.verificationStatus,
        },
      ],
    };
  }, [brand]);

  if (brandLoading) {
    return <p className="text-sm text-gray-400">Loading bank details…</p>;
  }

  if (!brand) {
    return <p className="text-sm text-gray-500">No brand data found.</p>;
  }

  const primaryAccount = bankAccountDetails.accounts.find((a) => a.isPrimary);
  const activeSelectedId =
    selectedAccountId ?? primaryAccount?.id ?? bankAccountDetails.accounts[0]?.id;

  return (
    <div>
      {brandError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">
          Couldn't load live data ({brandError}). Showing cached details.
        </p>
      )}
      {!brand.bank && canAddBank ? (
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:bg-gray-800">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Landmark size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">No bank account yet</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Add one to receive payouts and sell vouchers. It&apos;s verified with a ₹1 test and then locked to your brand.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Plus size={15} aria-hidden="true" />
            Add bank account
          </button>
        </section>
      ) : (
        <BankAccountSection
          bankAccountDetails={bankAccountDetails}
          selectedAccountId={activeSelectedId}
          onSelectAccount={setSelectedAccountId}
        />
      )}
      {adding && <KycAddModal type="BANK" onClose={() => setAdding(false)} onSaved={refresh} />}
    </div>
  );
};

export default BankAccountPage;