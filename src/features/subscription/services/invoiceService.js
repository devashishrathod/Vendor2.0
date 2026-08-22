// invoiceService.js
// Handles anything invoice-related. Same pattern as subscriptionService:
// mocked now, swap the body for a real fetch() later without touching
// any component/hook that calls these functions.

import { API_ENDPOINTS } from '../constants/subscription.constants';

const MOCK_INVOICES_BY_ORDER_ID = {
  O11001: {
    orderId: 'O11001',
    invoiceNumber: 'INV-001010',
    invoiceDate: '2024-12-12',
    amount: 4518.82,
    paymentStatus: 'SUCCESS',
    billFrom: {
      companyName: 'TRYDOOD RETAIL PRIVATE LIMITED',
      address: 'No 38, College Road, Old College Buildings, Chennai, Tamil Nadu, India, 600006',
      gstin: '33AAKCT3750H1ZB',
      pan: 'AAKCT3750H',
    },
    billTo: {
      companyName: 'YOGA EDUCATION AND RESEARCH PVT LTD',
      address:
        'New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block 5th Street, Annanagar West, Chennai - 600040',
      gstin: '09AAKFF2211N2ZA',
      pan: 'AAKFF2211N',
    },
    lineItems: [
      { label: 'Basic Plan - Annual Subscription', amount: 4000.0 },
      { label: 'Discount', amount: -2001.0 },
      { label: 'GST (18%)', amount: 519.82 },
    ],
  },
};

const MOCK_INVOICE_HISTORY = [
  {
    orderId: 'O11001',
    invoiceNumber: 'INV-001010',
    date: '2024-12-12',
    planName: 'Basic Plan',
    amount: 4518.82,
    status: 'SUCCESS',
  },
  {
    orderId: 'O10987',
    invoiceNumber: 'INV-000998',
    date: '2023-12-14',
    planName: 'Basic Plan',
    amount: 2358.0,
    status: 'SUCCESS',
  },
  {
    orderId: 'O10850',
    invoiceNumber: 'INV-000871',
    date: '2022-12-12',
    planName: 'Starter Plan',
    amount: 999.0,
    status: 'SUCCESS',
  },
];

/**
 * Fetches a single invoice by its order id.
 * Real version:
 *   const res = await fetch(API_ENDPOINTS.GET_INVOICE_BY_ID(orderId));
 *   if (!res.ok) throw new Error('Invoice not found');
 *   return res.json();
 */
export async function fetchInvoiceByOrderId(orderId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const invoice = MOCK_INVOICES_BY_ORDER_ID[orderId];
  if (!invoice) {
    throw new Error(`No invoice found for order ${orderId}`);
  }
  return invoice;
}

/**
 * Fetches the list of past invoices/purchases for the "View History" table.
 */
export async function fetchInvoiceHistory() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_INVOICE_HISTORY;
}

export const invoiceApiEndpoints = {
  byId: API_ENDPOINTS.GET_INVOICE_BY_ID,
  history: API_ENDPOINTS.GET_INVOICE_HISTORY,
};
