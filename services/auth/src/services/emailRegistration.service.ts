import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../model/User.js";
import { publishVerificationEmail } from "../utils/email.publisher.js";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerWithEmailService = async (
  name: string,
  email: string,
  password: string,
): Promise<void> => {
  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    throw Object.assign(new Error("Name must be between 2 and 50 characters."), { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    throw Object.assign(new Error("Please provide a valid email address."), { status: 400 });
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    throw Object.assign(new Error("Password must be at least 8 characters with one uppercase letter and one digit."), { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.isEmailVerified && existing.authProviders.includes("google") && !existing.authProviders.includes("email")) {
      const passwordHash = await bcrypt.hash(password, 10);
      const rawToken = crypto.randomBytes(32).toString("hex");
      existing.authProviders.push("email");
      existing.passwordHash = passwordHash;
      existing.isEmailVerified = false;
      existing.emailVerificationToken = rawToken;
      existing.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await existing.save();
      publishVerificationEmail(normalizedEmail, existing.name, rawToken);
      return;
    }
    throw Object.assign(new Error("This email is already registered. Please sign in instead."), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const rawToken = crypto.randomBytes(32).toString("hex");

  await User.create({
    name: name.trim(),
    email: normalizedEmail,
    image: "",
    authProviders: ["email"],
    isEmailVerified: false,
    passwordHash,
    emailVerificationToken: rawToken,
    emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  publishVerificationEmail(normalizedEmail, name.trim(), rawToken);
};
