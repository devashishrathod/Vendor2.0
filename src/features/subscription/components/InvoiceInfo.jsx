import { useState } from 'react';
import { FileText, Hash, History } from 'lucide-react';
import { InfoSection, InfoGrid } from './InfoGrid';
import InvoiceModal from './InvoiceModal';
import InvoiceHistoryModal from './InvoiceHistoryModal';

export default function InvoiceInfo({ subscription }) {
  const { subscriptionId, orderId, invoice } = subscription;

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const items = [
    {
      icon: <Hash className="w-4 h-4" />,
      iconBg: 'bg-violet-50 dark:bg-violet-500/10',
      iconText: 'text-violet-500 dark:text-violet-400',
      label: 'Subscription ID',
      value: subscriptionId,
      valueClassName: 'break-all',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconText: 'text-blue-500 dark:text-blue-400',
      label: 'Order ID',
      value: orderId,
      valueClassName: 'break-all',
      link: orderId ? { text: 'View Invoice', onClick: () => setIsInvoiceOpen(true) } : undefined,
    },
    {
      icon: <History className="w-4 h-4" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconText: 'text-emerald-500 dark:text-emerald-400',
      label: 'Subscription Invoice',
      value: 'Purchase history',
      link: { text: 'View History', onClick: () => setIsHistoryOpen(true) },
    },
  ];

  return (
    <InfoSection icon={<FileText className="w-5 h-5" />} title="Invoice Information" subtitle="Manage your invoices and billing documents">
      <InfoGrid items={items} cols={3} />

      <InvoiceModal open={isInvoiceOpen} invoice={invoice} onClose={() => setIsInvoiceOpen(false)} />

      <InvoiceHistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        invoiceSubscriptionId={subscriptionId}
        onViewInvoice={() => {
          // Swap to the invoice modal and close the history modal under it.
          setIsHistoryOpen(false);
          setIsInvoiceOpen(true);
        }}
      />
    </InfoSection>
  );
}
