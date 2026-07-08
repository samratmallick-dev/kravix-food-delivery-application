import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image: string;
  role: string | null;
  isBlocked: boolean;
  blockedUntil: Date | null;
  authProviders: Array<"email" | "google">;
  isEmailVerified: boolean;
  passwordHash?: string;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    image: { type: String, default: "" },
    role: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
    blockedUntil: { type: Date, default: null },
    authProviders: {
      type: [String],
      enum: ["email", "google"],
      default: [],
      required: true,
    },
    isEmailVerified: { type: Boolean, default: false, required: true },
    passwordHash: { type: String, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpiry: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        return ret;
      },
    },
  },
);

export const User = mongoose.model<IUser>("User", userSchema);
