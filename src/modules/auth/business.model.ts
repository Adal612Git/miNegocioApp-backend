import mongoose, { Schema, type InferSchemaType } from "mongoose";

const BusinessSchema = new Schema(
  {
    name: { type: String, required: true },
    owner_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export type BusinessDocument = InferSchemaType<typeof BusinessSchema>;

export const BusinessModel =
  mongoose.models.Business ||
  mongoose.model<BusinessDocument>("Business", BusinessSchema);
