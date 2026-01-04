import mongoose, { Schema, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    business_id: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    isVerified: { type: Boolean, default: true },
    verificationToken: { type: String },
  },
  { timestamps: false }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
