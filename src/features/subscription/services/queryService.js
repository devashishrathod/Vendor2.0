// queryService.js
// Handles submitting a support query/ticket from the "Raise Query" modal.

import { API_ENDPOINTS } from '../constants/subscription.constants';

/**
 * Submits a support query.
 * Real version:
 *   const res = await fetch(API_ENDPOINTS.RAISE_QUERY, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(payload),
 *   });
 *   if (!res.ok) throw new Error('Failed to submit query');
 *   return res.json();
 */
export async function submitQuery(payload) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!payload?.subject?.trim() || !payload?.description?.trim()) {
    throw new Error('Please fill in both subject and description.');
  }

  // Mock ticket id — a real backend would return this.
  const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
  return { ticketId, status: 'OPEN', submittedAt: new Date().toISOString() };
}

export const queryApiEndpoints = {
  raiseQuery: API_ENDPOINTS.RAISE_QUERY,
};
