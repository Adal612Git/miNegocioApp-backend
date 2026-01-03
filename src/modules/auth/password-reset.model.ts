import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PasswordResetSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token_hash: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

PasswordResetSchema.index({ user_id: 1, expires_at: 1 });

export type PasswordResetDocument = InferSchemaType<typeof PasswordResetSchema>;

export const PasswordResetModel =
  mongoose.models.PasswordReset ||
  mongoose.model<PasswordResetDocument>("PasswordReset", PasswordResetSchema);
