/**
 * Moderation statuses and workflow transitions for incident reports.
 * 
 * Status meanings:
 * - PENDING: Initial status when a user submits an incident report. Awaiting moderation.
 * - UNDER_REVIEW: Admin has picked up the report and is actively investigating/evaluating.
 * - APPROVED: Verified by admin as authentic and approved for community visibility.
 * - REJECTED: Rejected by admin due to invalidity, duplicate, spam, or guideline violations.
 * - NEEDS_REVISION: Admin requested additional details or clarification from the reporter.
 * - REVIEWED: Legacy/backward-compatible status for existing records.
 * - RESOLVED: Legacy/backward-compatible status for resolved incidents.
 */

const MODERATION_STATUS = Object.freeze({
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVISION: 'needs_revision',
  // Backward compatibility with initial schema
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
});

/**
 * Valid state transitions for the review workflow.
 */
const VALID_STATUS_TRANSITIONS = Object.freeze({
  [MODERATION_STATUS.PENDING]: [
    MODERATION_STATUS.UNDER_REVIEW,
    MODERATION_STATUS.APPROVED,
    MODERATION_STATUS.REJECTED,
    MODERATION_STATUS.NEEDS_REVISION,
  ],
  [MODERATION_STATUS.UNDER_REVIEW]: [
    MODERATION_STATUS.APPROVED,
    MODERATION_STATUS.REJECTED,
    MODERATION_STATUS.NEEDS_REVISION,
    MODERATION_STATUS.PENDING,
  ],
  [MODERATION_STATUS.NEEDS_REVISION]: [
    MODERATION_STATUS.UNDER_REVIEW,
    MODERATION_STATUS.APPROVED,
    MODERATION_STATUS.REJECTED,
    MODERATION_STATUS.PENDING,
  ],
  [MODERATION_STATUS.APPROVED]: [
    MODERATION_STATUS.UNDER_REVIEW,
    MODERATION_STATUS.REJECTED,
    MODERATION_STATUS.RESOLVED,
  ],
  [MODERATION_STATUS.REJECTED]: [
    MODERATION_STATUS.UNDER_REVIEW,
    MODERATION_STATUS.PENDING,
    MODERATION_STATUS.APPROVED,
  ],
  [MODERATION_STATUS.REVIEWED]: [
    MODERATION_STATUS.APPROVED,
    MODERATION_STATUS.REJECTED,
    MODERATION_STATUS.RESOLVED,
  ],
  [MODERATION_STATUS.RESOLVED]: [
    MODERATION_STATUS.UNDER_REVIEW,
    MODERATION_STATUS.APPROVED,
  ],
});

/**
 * Checks if a string is a valid moderation status.
 * @param {string} status 
 * @returns {boolean}
 */
const isValidStatus = (status) => {
  if (typeof status !== 'string') return false;
  return Object.values(MODERATION_STATUS).includes(status.trim().toLowerCase());
};

/**
 * Checks if a transition from currentStatus to targetStatus is valid.
 * @param {string} currentStatus 
 * @param {string} targetStatus 
 * @returns {boolean}
 */
const isValidTransition = (currentStatus, targetStatus) => {
  if (typeof currentStatus !== 'string' || typeof targetStatus !== 'string') {
    return false;
  }
  const current = currentStatus.trim().toLowerCase();
  const target = targetStatus.trim().toLowerCase();

  if (current === target) {
    return false;
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[current];
  return Array.isArray(allowedTransitions) && allowedTransitions.includes(target);
};

module.exports = {
  MODERATION_STATUS,
  VALID_STATUS_TRANSITIONS,
  isValidStatus,
  isValidTransition,
};
