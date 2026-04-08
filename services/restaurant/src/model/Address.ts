import mongoose, { Document, Schema } from "mongoose";

export interface IAddresss extends Document {
      userId: string;
      mobile: number;
      formatedAddress: string;
      location: {
            type: "Point",
            coordinates: [number, number]
      };
      createdAt: Date;
      updatedAt: Date;
};

const addressSchema: Schema = new Schema({
      userId: {
            type: String,
            require: true,
      },
      mobile: {
            type: Number,
            require: true,
      },
      formatedAddress: {
            type: String,
            require: true
      },
      location: {
            type: {
                  type: String,
                  enum: ["Point"],
                  default: "Point"
            },
            coordinates: {
                  type: [Number],
                  require: true
            }
      }
}, {timestamps: true});

addressSchema.index({location : "2dsphere"});

export const Address = mongoose.model<IAddresss>("Address", addressSchema)