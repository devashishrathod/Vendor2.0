import { useState } from 'react';
import { FileText } from 'lucide-react';
import { InfoSection, InfoGrid } from './InfoGrid';
import InvoiceModal from './InvoiceModal';
import InvoiceHistoryModal from './InvoiceHistoryModal';

export default function InvoiceInfo({ subscription }) {
  const { orderId, purchasedListLabel, history } = subscription;

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyInvoiceOrderId, setHistoryInvoiceOrderId] = useState(orderId);

  const items = [
    {
      icon: <FileText className="w-4 h-4" />,
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-500',
      label: 'Order ID',
      value: orderId,
      link: { text: 'View Invoice', onClick: () => { setHistoryInvoiceOrderId(orderId); setIsInvoiceOpen(true); } },
    },
    {
      icon: <FileText className="w-4 h-4" />,
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-500',
      label: 'Subscription Invoice',
      value: purchasedListLabel,
      link: { text: 'View History', onClick: () => setIsHistoryOpen(true) },
    },
  ];

  return (
    <InfoSection icon={<FileText className="w-5 h-5" />} title="Invoice Information" subtitle="Manage your invoices and billing documents">
      <InfoGrid items={items} cols={2} />

      <InvoiceModal
        open={isInvoiceOpen}
        orderId={historyInvoiceOrderId}
        onClose={() => setIsInvoiceOpen(false)}
      />

      <InvoiceHistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onViewInvoice={(clickedOrderId) => {
          // Swap to the invoice modal for the row that was clicked, and
          // close the history modal underneath it.
          setHistoryInvoiceOrderId(clickedOrderId);
          setIsHistoryOpen(false);
          setIsInvoiceOpen(true);
        }}
      />
    </InfoSection>
  );
}
