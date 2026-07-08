import { User, IUser } from "../model/User.js";
import { exchangeGoogleCode } from "./google.service.js";

export const loginWithGoogleService = async (code: string): Promise<IUser> => {
  const profile = await exchangeGoogleCode(code);

  const user = await User.findOne({ email: profile.email });

  if (!user) {
    throw Object.assign(
      new Error("No account exists with this email. Please register first."),
      { status: 401, code: "REGISTER_FIRST" },
    );
  }

  if (!user.authProviders.includes("google")) {
    throw Object.assign(
      new Error("This account is not linked with Google Sign-In. Please use Email login."),
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

  return user;
};
