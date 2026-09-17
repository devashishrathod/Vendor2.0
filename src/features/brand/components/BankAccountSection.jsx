import React from "react";
import { CreditCard } from "lucide-react";
import BankAccountCard from "./BankAccountCard";

const BankAccountSection = ({
  bankAccountDetails,
  selectedAccountId,
  onSelectAccount,
  onAddBankAccount,
}) => {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-emerald-500 dark:text-emerald-400" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Bank Account Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {bankAccountDetails.subtitle}
          </p>
        </div>
      </div>

      <div className=" rounded-xl  dark:border-gray-700 p-5">
        <div className="flex items-start justify-between gap-4">
          
          {/* <button
            type="button"
            onClick={onAddBankAccount}
            className="flex shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <CreditCard size={15} />
            Add bank Account
          </button> */}
        </div>

        <div className="mt-5 space-y-4">
          {bankAccountDetails.accounts.map((account) => (
            <BankAccountCard
              key={account.id}
              account={account}
              isSelected={
                selectedAccountId
                  ? account.id === selectedAccountId
                  : account.isPrimary
              }
              onSelect={onSelectAccount}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BankAccountSection;