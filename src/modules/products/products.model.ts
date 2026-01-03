import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ProductSchema = new Schema(
  {
    business_id: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: false }
);

ProductSchema.index({ business_id: 1, name: 1 });

export type ProductDocument = InferSchemaType<typeof ProductSchema>;

export const ProductModel =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>("Product", ProductSchema);
