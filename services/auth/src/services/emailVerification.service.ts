import crypto from "crypto";
import { User } from "../model/User.js";
import { publishVerificationEmail } from "../utils/email.publisher.js";

export const verifyEmailService = async (token: string): Promise<void> => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpiry: { $gt: new Date() },
  }).select("+emailVerificationToken");

  if (!user) {
    throw Object.assign(
      new Error("Verification link is invalid or has expired."),
      { status: 400 },
    );
  }

  await User.findByIdAndUpdate(user._id, {
    $set: { isEmailVerified: true },
    $unset: { emailVerificationToken: "", emailVerificationExpiry: "" },
  });
};

export const resendVerificationEmailService = async (email: string): Promise<void> => {
  const normalizedEmail = email?.toLowerCase() ?? "";

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationToken +emailVerificationExpiry",
  );

  if (user && !user.isEmailVerified) {
    const lastSentAt = user.emailVerificationExpiry
      ? user.emailVerificationExpiry.getTime() - 24 * 60 * 60 * 1000
      : 0;

    if (Date.now() - lastSentAt > 60 * 1000) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.emailVerificationToken = rawToken;
      user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      publishVerificationEmail(normalizedEmail, user.name, rawToken);
    }
  }
};
