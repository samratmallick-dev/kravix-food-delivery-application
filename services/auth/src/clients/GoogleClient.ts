import { google } from "googleapis";
import { IGoogleClient, GoogleProfile } from "../interfaces/IGoogleClient.js";
import { AuthenticationError, ValidationError } from "../utils/errors.js";

const usedCodes = new Set<string>();

export class GoogleClient implements IGoogleClient {
  async exchangeCode(code: string): Promise<GoogleProfile> {
    if (usedCodes.has(code)) {
      throw new ValidationError("Authorization code has already been used. Please try again.");
    }

    usedCodes.add(code);
    setTimeout(() => usedCodes.delete(code), 5 * 60 * 1000);

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage"
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
      throw new AuthenticationError(msg);
    }

    if (!tokens.id_token) {
      usedCodes.delete(code);
      throw new AuthenticationError("Failed to obtain ID token from Google");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId
    });

    const payload = (ticket as import("google-auth-library").LoginTicket).getPayload();
    if (!payload?.email) {
      throw new AuthenticationError("Google account has no email address");
    }

    return {
      email: payload.email.toLowerCase(),
      name: payload.name ?? payload.email,
      picture: payload.picture ?? "",
      verified_email: payload.email_verified ?? false
    };
  }
}
