import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
      name: string;
      email: string;
      image: string;
      role: string;
      isBlocked: boolean;
      blockedUntil: Date | null;
};

const userSchema: Schema<IUser> = new Schema({
      name: {
            type: String,
            required: true
      },
      email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
      },
      image: {
            type: String,
            required: true
      },
      role: {
            type: String,
            default: null
      },
      isBlocked: {
            type: Boolean,
            default: false
      },
      blockedUntil: {
            type: Date,
            default: null
      }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);