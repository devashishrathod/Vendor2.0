import React, { useState, useMemo } from "react";

import BankAccountSection from "../components/BankAccountSection";

/**
 * BankAccountPage
 * "Bank Account Details" tab — reads the live brand.bank object
 * (from BrandPage's useBrandData) and adapts it into the
 * { subtitle, activeAccountSubtitle, accounts: [...] } shape
 * BankAccountSection/BankAccountCard expect.
 */
const BankAccountPage = ({ brand, brandId, brandLoading, brandError }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const bankAccountDetails = useMemo(() => {
    const bank = brand?.bank;

    if (!bank) {
      return {
        subtitle: "Manage the bank account linked to your payouts.",
        activeAccountSubtitle: "No bank account linked yet.",
        accounts: [],
      };
    }

    return {
      subtitle: "Manage the bank account linked to your payouts.",
      activeAccountSubtitle: "This account is used to receive your settlements.",
      accounts: [
        {
          id: bank._id,
          isPrimary: true,
          bankName: bank.bankName,
          accountHolderName: bank.accountHolderName,
          accountNumber: bank.maskedAccountNumber || bank.accountNumber,
          ifscCode: bank.ifscCode,
          branch: bank.branchName,
          accountType: bank.accountType,
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

  const handleAddBankAccount = () => {
    // Wire this up to services/brandApi.js -> an addBankAccount(...) call
    console.log("Add bank Account clicked");
  };

  return (
    <div>
      {brandError && (
        <p className="mb-4 text-sm text-red-500">
          Couldn't load live data ({brandError}). Showing cached details.
        </p>
      )}
      <BankAccountSection
        bankAccountDetails={bankAccountDetails}
        selectedAccountId={activeSelectedId}
        onSelectAccount={setSelectedAccountId}
        onAddBankAccount={handleAddBankAccount}
      />
    </div>
  );
};

export default BankAccountPage;