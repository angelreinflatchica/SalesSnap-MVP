const PH_MOBILE_DIGITS_REGEX = /^9\d{9}$/;

function stripMobileFormatting(input: string) {
  return input.replace(/[\s\-()]/g, "");
}

export function normalizePhilippineMobile(input: string) {
  const cleaned = stripMobileFormatting(input.trim());
  let digits = cleaned;

  if (digits.startsWith("+63")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("63")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (!PH_MOBILE_DIGITS_REGEX.test(digits)) {
    return null;
  }

  return `+63${digits}`;
}

export function isValidPhilippineMobile(input: string) {
  return normalizePhilippineMobile(input) !== null;
}