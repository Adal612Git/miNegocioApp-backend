import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SaleItemSchema = new Schema(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema(
  {
    business_id: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
    items: { type: [SaleItemSchema], required: true },
    total: { type: Number, required: true },
  },
  { timestamps: false }
);

SaleSchema.index({ business_id: 1, date: 1 });

export type SaleDocument = InferSchemaType<typeof SaleSchema>;

export const SaleModel =
  mongoose.models.Sale || mongoose.model<SaleDocument>("Sale", SaleSchema);
