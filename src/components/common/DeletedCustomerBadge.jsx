/**
 * Small pill shown next to a customer's name when that customer has
 * deleted their Trydood account (`customer.isDeleted` from the
 * voucher-claims / payments APIs, release v1.12). The sale itself is
 * unchanged — this only explains why the name may be the one from the
 * time of sale and why no email is shown.
 */
export default function DeletedCustomerBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-medium normal-case text-gray-500 dark:text-gray-300 whitespace-nowrap align-middle">
      Account deleted
    </span>
  );
}
