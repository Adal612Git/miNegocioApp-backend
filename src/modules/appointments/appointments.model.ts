import mongoose, { Schema, type InferSchemaType } from "mongoose";

const AppointmentSchema = new Schema(
  {
    business_id: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
  },
  { timestamps: false }
);

AppointmentSchema.index({ business_id: 1, date: 1, time: 1 });

AppointmentSchema.statics.checkOverlap = async function ({
  businessId,
  date,
  time,
}: {
  businessId: string;
  date: Date;
  time: string;
}) {
  const exists = await this.exists({
    business_id: businessId,
    status: { $in: ["scheduled", "completed"] },
    date,
    time,
  });

  return Boolean(exists);
};

export type AppointmentDocument = InferSchemaType<typeof AppointmentSchema>;

export type AppointmentModelType = mongoose.Model<AppointmentDocument> & {
  checkOverlap: (args: {
    businessId: string;
    date: Date;
    time: string;
  }) => Promise<boolean>;
};

export const AppointmentModel =
  (mongoose.models.Appointment as AppointmentModelType) ||
  mongoose.model<AppointmentDocument, AppointmentModelType>(
    "Appointment",
    AppointmentSchema
  );
