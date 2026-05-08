import mongoose, { Schema, Document } from "mongoose";

export interface IUserBlocked extends Document {
      isBlocked: boolean;
      blockedUntil: Date | null;
}

const userSchema = new Schema<IUserBlocked>({
      isBlocked: { type: Boolean, default: false },
      blockedUntil: { type: Date, default: null },
}, { strict: false, timestamps: true });

export const User = (mongoose.models["User"] as mongoose.Model<IUserBlocked>) || mongoose.model<IUserBlocked>("User", userSchema);
