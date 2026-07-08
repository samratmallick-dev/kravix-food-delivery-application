import crypto from "crypto";
import { User } from "../model/User.js";
import { exchangeGoogleCode } from "./google.service.js";
import { publishVerificationEmail } from "../utils/email.publisher.js";
import { publishAuthEvent } from "../config/authPublisher.js";

export const registerWithGoogleService = async (code: string): Promise<void> => {
  const profile = await exchangeGoogleCode(code);

  const existing = await User.findOne({ email: profile.email });

  if (existing) {
    if (existing.isEmailVerified && existing.authProviders.includes("email") && !existing.authProviders.includes("google")) {
      existing.authProviders.push("google");
      if (!existing.image && profile.picture) existing.image = profile.picture;
      await existing.save();
      publishAuthEvent("USER_REGISTERED", {
        userId: existing._id.toString(),
        name: existing.name,
        email: existing.email,
        image: existing.image,
      });
      return;
    }
    throw Object.assign(
      new Error("This email is already registered. Please sign in instead."),
      { status: 409 },
    );
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name: profile.name,
    email: profile.email,
    image: profile.picture,
    authProviders: ["google"],
    isEmailVerified: false,
    emailVerificationToken: rawToken,
    emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  publishVerificationEmail(profile.email, profile.name, rawToken);

  publishAuthEvent("USER_REGISTERED", {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
  });
};
