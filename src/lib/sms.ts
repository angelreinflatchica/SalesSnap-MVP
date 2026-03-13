import { normalizePhilippineMobile } from "@/lib/mobileNumber";

type SendResetOtpParams = {
  mobileNumber: string;
  otp: string;
};

type SendResetOtpResult = {
  delivered: boolean;
  reason?: string;
};

function toSemaphoreMobileNumber(input: string) {
  const normalized = normalizePhilippineMobile(input);
  if (!normalized) return null;
  if (normalized.startsWith("+63")) {
    return `0${normalized.slice(3)}`;
  }
  return normalized;
}

export async function sendPasswordResetOtpSms({
  mobileNumber,
  otp,
}: SendResetOtpParams): Promise<SendResetOtpResult> {
  const apiKey = process.env.SEMAPHORE_API_KEY;

  if (!apiKey) {
    return { delivered: false, reason: "sms_not_configured" };
  }

  const recipient = toSemaphoreMobileNumber(mobileNumber);
  if (!recipient) {
    return { delivered: false, reason: "invalid_mobile" };
  }

  const message = `Your SalesSnap OTP is ${otp}. It expires in 10 minutes.`;
  const senderName = process.env.SEMAPHORE_SENDER_NAME;

  const body = new URLSearchParams({
    apikey: apiKey,
    number: recipient,
    message,
  });

  if (senderName) {
    body.append("sendername", senderName);
  }

  try {
    const res = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const responseText = await res.text();
      console.error("Semaphore SMS error", {
        status: res.status,
        responseText,
      });
      return { delivered: false, reason: "sms_provider_error" };
    }

    return { delivered: true };
  } catch (error) {
    console.error("SMS send failed", error);
    return { delivered: false, reason: "sms_request_failed" };
  }
}
