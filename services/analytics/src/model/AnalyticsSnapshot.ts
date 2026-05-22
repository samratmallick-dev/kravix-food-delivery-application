import mongoose, { Schema, Document } from "mongoose";

export interface IAnalyticsSnapshot extends Document {
      snapshotDate: Date;
      key: string;
      data: any;
}

const analyticsSnapshotSchema: Schema = new Schema<IAnalyticsSnapshot>({
      snapshotDate: {
            type: Date,
            required: true,
            default: Date.now,
            index: true
      },
      key: {
            type: String,
            required: true,
            index: true
      },
      data: {
            type: Schema.Types.Mixed,
            required: true
      }
}, { timestamps: true });

export const AnalyticsSnapshot = mongoose.model<IAnalyticsSnapshot>("AnalyticsSnapshot", analyticsSnapshotSchema);
