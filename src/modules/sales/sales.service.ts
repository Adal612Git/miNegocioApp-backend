import mongoose from "mongoose";

import { ProductModel } from "../products/products.model";
import { SaleModel } from "./sales.model";

type SaleItemInput = {
  product_id: string;
  quantity: number;
};

type CreateSaleInput = {
  businessId: string;
  items: SaleItemInput[];
  amountPaid: number;
};

class OutOfStockError extends Error {
  code = "OUT_OF_STOCK";
}

function isReplicaSetError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.toLowerCase().includes("replica set")
  );
}

export const SalesService = {
  createSale: async ({
    businessId,
    items,
    amountPaid,
  }: CreateSaleInput) => {
    let saleRecord = null;

    const runSale = async (session?: mongoose.ClientSession) => {
      const productIds = items.map((item) => item.product_id);
      const productsQuery = ProductModel.find({
        _id: { $in: productIds },
        business_id: businessId,
        is_active: true,
      });
      const products = session ? await productsQuery.session(session) : await productsQuery;

      if (products.length !== productIds.length) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const productMap = new Map(
        products.map((product) => [product._id.toString(), product])
      );

      const saleItems = items.map((item) => {
        const product = productMap.get(item.product_id);
        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }
        return {
          productId: product._id,
          quantity: item.quantity,
          price: product.price,
        };
      });

      for (const item of saleItems) {
        const updated = await ProductModel.updateOne(
          {
            _id: item.productId,
            business_id: businessId,
            stock: { $gte: item.quantity },
            is_active: true,
          },
          { $inc: { stock: -item.quantity } },
          session ? { session } : undefined
        );

        if (updated.modifiedCount !== 1) {
          throw new OutOfStockError("OUT_OF_STOCK");
        }
      }

      const total = saleItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      if (amountPaid < total) {
        const err = new Error("INSUFFICIENT_PAYMENT");
        (err as Error & { code?: string }).code = "INSUFFICIENT_PAYMENT";
        throw err;
      }

      const sale = await SaleModel.create(
        [
          {
            business_id: businessId,
            date: new Date(),
            items: saleItems.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
            total,
          },
        ],
        session ? { session } : undefined
      );

      saleRecord = sale[0];
    };

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await runSale(session);
      });
    } catch (err) {
      if (isReplicaSetError(err)) {
        await runSale();
      } else {
        throw err;
      }
    } finally {
      session.endSession();
    }

    return saleRecord;
  },
};
