import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
      name: string;
      email: string;
      image: string;
      role: string | null;
      createdAt: Date;
      updatedAt: Date;
}

const userSchema = new Schema<IUser>(
      {
            name: {
                  type: String, required: true
            },
            email: {
                  type: String,
                  required: true,
                  unique: true,
                  lowercase: true
            },
            image: {
                  type: String,
                  required: true
            },
            role: {
                  type: String,
                  default: null
            },
      },
      { timestamps: true }
);

export const User = (mongoose.models["User"] as mongoose.Model<IUser>) || mongoose.model<IUser>("User", userSchema);
