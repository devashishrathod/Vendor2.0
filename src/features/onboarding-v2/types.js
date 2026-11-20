// Onboarding v2 — response shapes the panel reads. Taken from the stage-captured
// Postman examples (trydood-vendor.postman_collection.json) and the API doc
// (#20a–#32c, #70–#71). Re-check against `npm run baseline:onboarding` output
// (docs/onboarding-v2-baseline/) when a vendor token is available. Only fields
// the panel actually uses are listed; nothing here is invented.

/**
 * @typedef {'BRAND_NAME'|'BUSINESS_CATEGORY'|'REGISTRATION_STATUS'|'GST_VERIFICATION'|'PAN_VERIFICATION'|
 *   'REGISTRATION_ENTITY_TYPE'|'OWNER_VERIFICATION'|'KYC_DOCUMENTS'|'BANK_VERIFICATION'|'PARTNERSHIP_DEED'|
 *   'SUBSCRIBE_PLAN'|'BRAND_BASIC_DETAILS'|'BRAND_PROFESSIONAL_DETAILS'|'OUTLET_DETAILS'|'ONBOARDING_REVIEW'|
 *   'UNDER_REVIEW'|'DASHBOARD'} OnboardingScreen
 */

/** @typedef {'GST'|'NO_GST'|'UNREGISTERED'} KycPath */

/**
 * @typedef {Object} StatusGroup
 * @property {'BASIC_DETAILS'|'BUSINESS_VERIFICATION'|'PAYOUT'|'AGREEMENT_PLAN'|'BRAND_OUTLET'} key
 * @property {'DONE'|'IN_PROGRESS'|'UPCOMING'} state
 * @property {{ screen: OnboardingScreen, status: 'DONE'|'SKIPPED'|'MISSING' }[]} screens
 */

/**
 * @typedef {Object} OnboardingLimits
 * @property {number} brandNameMinLength
 * @property {number} brandNameMaxLength
 * @property {number} maxSubCategories
 * @property {number} maxKycDocuments
 * @property {number} maxActiveFeatures
 */

/**
 * @typedef {Object} OnboardingEditable
 * @property {boolean} legal
 * @property {boolean} registrationStatus
 * @property {boolean} entity
 * @property {{ add: { pan: boolean, gst: boolean, bank: boolean }, change: boolean }} kyc
 * @property {boolean} ownerVerification
 * @property {{ add: boolean, change: boolean }} documents
 * @property {{ add: boolean, change: boolean }} profile
 * @property {{ add: boolean, change: boolean }} setup
 * @property {boolean} billingAddress
 */

/**
 * @typedef {Object} OnboardingDeed
 * @property {boolean} accepted
 * @property {'VENDOR'|'ADMIN'|null} acceptedByType
 * @property {'ONLINE'|'OFFLINE'|null} mode
 * @property {string|null} version
 * @property {string|null} acceptedAt
 * @property {boolean} isLegacy
 * @property {boolean} hasProof
 * @property {string|null} proofUrl
 * @property {boolean} requiresDeedConfirmation
 */

/**
 * @typedef {Object} StrengthItem
 * @property {string} key
 * @property {string} label
 * @property {boolean} done
 * @property {boolean} available   false → not possible for this brand; never shown
 * @property {number} earned
 * @property {number} max
 * @property {number} points       what doing it adds ("+N"); 0 when done / unavailable
 * @property {string|null} action  short English hint
 */

/**
 * Profile strength (API doc #32c; also `status.profileStrength`).
 * @typedef {Object} ProfileStrength
 * @property {number} score
 * @property {'LOW'|'MEDIUM'|'STRONG'} level
 * @property {{ key: string, label: string, earned: number, max: number, items: StrengthItem[] }[]} sections
 * @property {boolean} badgeEligible
 * @property {('NOT_APPROVED'|'STRENGTH_BELOW_75'|'BANK_NOT_VERIFIED'|'NO_IDENTITY_PROOF')[]} badgeBlockers
 */

/**
 * GET /brands/onboarding/status → data (API doc #20a).
 * @typedef {Object} OnboardingStatus
 * @property {string} brandId
 * @property {OnboardingScreen} currentScreen
 * @property {'FIRST_PASS'|'LOCKED'|'REMEDIATION'} editMode
 * @property {'PENDING'|'APPROVED'|null} editLock
 * @property {KycPath|null} kycPath
 * @property {boolean} isOnBoardingCompleted
 * @property {StatusGroup[]} groups
 * @property {{ group: number, groupCount: number, percent: number }} progress
 * @property {{ gst: string, pan: string, ownerVerification: string, documents: string, bank: string,
 *   ownerVerificationMethod: 'PAN'|'ID_DOCUMENT'|null, documentCount: number }} items
 * @property {boolean} registrationStatusLocked
 * @property {OnboardingEditable} editable
 * @property {{ key: string, points: number, passed: boolean, skipped: boolean }[]} systemChecks
 * @property {Object} verification
 * @property {OnboardingDeed} deed
 * @property {boolean} hasBillingAddress
 * @property {boolean} isVerified
 * @property {ProfileStrength} profileStrength
 * @property {OnboardingLimits} limits
 */

/**
 * verify-pan / verify-gst / verify-bank → data (API doc #28–#30). A failed
 * check is still 200 with `isVerified: false` and the provider's `message`.
 * @typedef {Object} VerifyResult
 * @property {string} verificationId
 * @property {'PAN'|'GST'|'BANK'} type
 * @property {boolean} isVerified
 * @property {string} status
 * @property {string} [message]
 * @property {boolean} reused
 * @property {string|null} nameOnRecord
 * @property {Object} details
 * @property {string|null} [suggestedEntity]   PAN, GST
 * @property {string|null} [panType]           PAN
 * @property {boolean} [isActive]              GST
 * @property {string|null} [constitution]      GST
 * @property {string|null} [panFromGstin]      GST
 * @property {string|null} [gstStateCode]      GST
 * @property {string|null} [addressOnRecord]   GST
 * @property {string|null} [bankName]          BANK
 * @property {string|null} [branchName]        BANK
 */

/**
 * add-pan / add-gst / add-bank-details → data (API doc #21–#23).
 * @typedef {Object} KycSaveResult
 * @property {Object} record
 * @property {'PROVIDED'} itemStatus
 * @property {OnboardingScreen} currentScreen
 * @property {{ legalBusinessName?: string, businessEntityType?: string|null }} derived
 */

/**
 * One row of GET /brands/onboarding/documents (API doc #23b).
 * @typedef {Object} KycDocument
 * @property {string} _id
 * @property {'BUSINESS'|'OWNER_ID'} purpose
 * @property {string} title
 * @property {string|null} docType
 * @property {string|null} idType
 * @property {'UPLOADED'|'ACCEPTED'|'REJECTED'} status
 * @property {string|null} reason
 * @property {{ mimeType: string, sizeBytes: number, originalName: string }} file
 * @property {string|null} fileUrl   short-lived signed link
 * @property {string} createdAt
 */

/**
 * GET /brands/onboarding/documents → data.
 * @typedef {Object} DocumentsList
 * @property {KycDocument[]} documents
 * @property {string[]} hints   docType codes
 * @property {number} limit
 * @property {number} count     business documents only (owner ID not counted)
 */

/**
 * Billing address (API doc #32a / #32b).
 * @typedef {Object} BillingAddress
 * @property {string} [_id]
 * @property {string} addressLine1
 * @property {string|null} [addressLine2]
 * @property {string|null} [landmark]
 * @property {string} city
 * @property {string|null} [district]
 * @property {string} state
 * @property {string} zipcode
 * @property {string} [country]
 * @property {string} [formattedAddress]
 * @property {number[]} [coordinates]   [lng, lat]
 * @property {string} [stateCode]
 */

/**
 * GET /brands/billing-address → data.
 * @typedef {Object} BillingAddressResponse
 * @property {BillingAddress|null} billingAddress
 * @property {(BillingAddress & { source: string })|null} suggestedAddress   only when nothing is saved
 * @property {(BillingAddress & { source: 'GST' })|null} gstAddress
 * @property {string|null} gstin
 * @property {string|null} gstStateCode
 */

export {};
