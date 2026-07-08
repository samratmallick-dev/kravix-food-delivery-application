import { google } from "googleapis";

export interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

const usedCodes = new Set<string>();

export const exchangeGoogleCode = async (code: string): Promise<GoogleProfile> => {
  if (usedCodes.has(code)) {
    throw Object.assign(new Error("Authorization code has already been used. Please try again."), { status: 400 });
  }

  usedCodes.add(code);
  setTimeout(() => usedCodes.delete(code), 5 * 60 * 1000);

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "postmessage",
  );

  let tokens;
  try {
    const res = await client.getToken(code);
    tokens = res.tokens;
  } catch (err: unknown) {
    usedCodes.delete(code);
    const msg =
      (err as { response?: { data?: { error_description?: string } } })?.response?.data?.error_description ??
      (err instanceof Error ? err.message : "Google token exchange failed");
    throw Object.assign(new Error(msg), { status: 401 });
  }

  if (!tokens.id_token) {
    usedCodes.delete(code);
    throw Object.assign(new Error("Failed to obtain ID token from Google"), { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw Object.assign(new Error("GOOGLE_CLIENT_ID is not set"), { status: 500 });

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: clientId,
  });

  const payload = (ticket as import("google-auth-library").LoginTicket).getPayload();
  if (!payload?.email) {
    throw Object.assign(new Error("Google account has no email address"), { status: 401 });
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email,
    picture: payload.picture ?? "",
    verified_email: payload.email_verified ?? false,
  };
};
