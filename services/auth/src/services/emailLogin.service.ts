import bcrypt from "bcryptjs";
import { User, IUser } from "../model/User.js";

export const loginWithEmailService = async (
  email: string,
  password: string,
): Promise<IUser> => {
  const normalizedEmail = email?.toLowerCase() ?? "";

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user) {
    throw Object.assign(
      new Error("Account does not exist. Please register first."),
      { status: 401 },
    );
  }

  if (!user.authProviders.includes("email")) {
    throw Object.assign(
      new Error("This account is not registered with Email login. Please use Google Sign-In."),
      { status: 403 },
    );
  }

  if (!user.isEmailVerified) {
    throw Object.assign(
      new Error("Please verify your email before signing in."),
      { status: 403, code: "EMAIL_NOT_VERIFIED" },
    );
  }

  if (user.isBlocked) {
    throw Object.assign(new Error("Your account has been blocked. Please contact support."), { status: 403 });
  }

  const match = await bcrypt.compare(password ?? "", user.passwordHash ?? "");
  if (!match) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  return user;
};
