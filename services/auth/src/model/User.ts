import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image: string;
  role: string;
  isBlocked: boolean;
  blockedUntil: Date | null;
  authProvider: "google" | "email";
  isEmailVerified: boolean;
  passwordHash?: string;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["google", "email"],
      default: "google",
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpiry: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpiry: {
      type: Date,
    },
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
