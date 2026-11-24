// One error shape for every HTTP layer in the panel (fetch clients and the
// axios instances): `{ status, details, message }` on the thrown error, with
// the backend's `details.code` read through getErrorCode(). Panels branch on
// that code only, never on the message text (onboarding v2 guide §2.7, §12).

/**
 * Codes that mean the session is over (API doc "Common Errors"). Any of these
 * on a 401 / 403 logs the vendor out. OTP-screen 401s ("Invalid OTP", "OTP is
 * expired") carry no code, so they never match.
 */
export const SESSION_END_CODES = Object.freeze(
  new Set([
    "TOKEN_MISSING",
    "TOKEN_EXPIRED",
    "SESSION_EXPIRED",
    "ACCOUNT_DEACTIVATED",
    "SESSION_INVALIDATED",
    "ACCOUNT_NOT_FOUND",
    "TOKEN_INVALID",
  ]),
);

/**
 * Error thrown by the fetch-based clients.
 * @property {number|null} status   HTTP status (null = no response)
 * @property {object|null} details  backend `details` (may hold `code`)
 * @property {string|null} code     same as `details.code`
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number|null, details?: object|null }} [extra]
   */
  constructor(message, { status = null, details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = details?.code ?? null;
  }
}

/**
 * Builds an ApiError from a parsed error response.
 * @param {number} status
 * @param {{ message?: string, error?: string, details?: object }|null} body
 * @param {string} [fallback]
 * @returns {ApiError}
 */
export function toApiError(status, body, fallback) {
  const message = body?.message || body?.error || fallback || `Request failed (${status})`;
  return new ApiError(message, { status, details: body?.details ?? null });
}

/**
 * The backend's `details.code` of any error the panel can receive.
 * @param {unknown} error
 * @returns {string|null}
 */
export function getErrorCode(error) {
  return error?.details?.code ?? error?.response?.data?.details?.code ?? null;
}

/**
 * The backend's `details` of any error the panel can receive.
 * @param {unknown} error
 * @returns {object|null}
 */
export function getErrorDetails(error) {
  return error?.details ?? error?.response?.data?.details ?? null;
}

/**
 * HTTP status of any error the panel can receive.
 * @param {unknown} error
 * @returns {number|null}
 */
export function getErrorStatus(error) {
  return error?.status ?? error?.response?.status ?? null;
}

/** @param {unknown} error */
export function isSessionEndError(error) {
  const status = getErrorStatus(error);
  return (status === 401 || status === 403) && SESSION_END_CODES.has(getErrorCode(error));
}

let sessionEndHandler = null;

/**
 * Registers what happens when the session ends (logout + back to login).
 * Set once at app start.
 * @param {(error: unknown) => void} handler
 */
export function onSessionEnd(handler) {
  sessionEndHandler = handler;
}

/**
 * Calls the session-end handler when `error` is a session-end error.
 * @param {unknown} error
 */
export function reportSessionEnd(error) {
  if (sessionEndHandler && isSessionEndError(error)) sessionEndHandler(error);
}

/**
 * Normalises an axios instance's errors to the same shape (`status`,
 * `details`, server `message`) and reports session-end errors. The original
 * axios error is kept, so `error.response` still works for existing callers.
 * @param {import('axios').AxiosInstance} instance
 * @returns {import('axios').AxiosInstance}
 */
export function attachApiErrorInterceptor(instance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const response = error?.response;
      if (response) {
        error.status = response.status;
        error.details = response.data?.details ?? null;
        if (response.data?.message) error.message = response.data.message;
      }
      reportSessionEnd(error);
      return Promise.reject(error);
    },
  );
  return instance;
}
