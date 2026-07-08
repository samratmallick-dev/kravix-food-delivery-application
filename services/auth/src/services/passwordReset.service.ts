import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../model/User.js";
import { publishPasswordResetEmail } from "../utils/email.publisher.js";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const forgotPasswordService = async (email: string): Promise<void> => {
  const normalizedEmail = email?.toLowerCase() ?? "";
  const user = await User.findOne({ email: normalizedEmail });

  if (user && user.authProviders.includes("email") && user.isEmailVerified) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    publishPasswordResetEmail(normalizedEmail, user.name, rawToken);
  }
};

export const resetPasswordService = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  if (!token) {
    throw Object.assign(new Error("Password reset link is invalid or has expired."), { status: 400 });
  }
  if (!newPassword || !PASSWORD_REGEX.test(newPassword)) {
    throw Object.assign(
      new Error("Password must be at least 8 characters with one uppercase letter and one digit."),
      { status: 400 },
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: new Date() },
  }).select("+passwordResetToken");

  if (!user) {
    throw Object.assign(new Error("Password reset link is invalid or has expired."), { status: 400 });
  }

  await User.findByIdAndUpdate(user._id, {
    $set: { passwordHash: await bcrypt.hash(newPassword, 10) },
    $unset: { passwordResetToken: "", passwordResetExpiry: "" },
  });
};
