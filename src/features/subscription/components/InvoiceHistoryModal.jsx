import Modal from './Modal';
import { CloseIcon } from './icons';
import InvoiceHistoryTable from './InvoiceHistoryTable';

export default function InvoiceHistoryModal({ open, onClose, history = [], onViewInvoice }) {
  return (
    <Modal open={open} onClose={onClose} ariaLabel="Purchase history" widthVariant="wide">
      <div className="inv-modal__header">
        <h3>Purchase History</h3>
        <button className="inv-modal__close" onClick={onClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      <InvoiceHistoryTable invoices={history} onViewInvoice={onViewInvoice} />
    </Modal>
  );
}
