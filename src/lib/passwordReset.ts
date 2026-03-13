import { randomInt } from "crypto";

export const PASSWORD_RESET_OTP_LENGTH = 6;
export const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
export const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = 30;
export const PASSWORD_RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;
export const PASSWORD_RESET_MAX_REQUESTS_PER_WINDOW = 5;
export const PASSWORD_RESET_ACCOUNT_LOCK_THRESHOLD = 10;
export const PASSWORD_RESET_ACCOUNT_LOCK_MS = 30 * 60 * 1000;

export function generatePasswordResetOtp() {
  const lowerBound = 10 ** (PASSWORD_RESET_OTP_LENGTH - 1);
  const upperBound = 10 ** PASSWORD_RESET_OTP_LENGTH;
  return String(randomInt(lowerBound, upperBound));
}

export function getPasswordResetExpiryDate() {
  return new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);
}
