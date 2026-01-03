"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../products/products.model");
const sales_model_1 = require("./sales.model");
class OutOfStockError extends Error {
    constructor() {
        super(...arguments);
        this.code = "OUT_OF_STOCK";
    }
}
function isReplicaSetError(err) {
    const message = err instanceof Error ? err.message : String(err);
    return (message.includes("Transaction numbers are only allowed") ||
        message.toLowerCase().includes("replica set"));
}
exports.SalesService = {
    createSale: async ({ businessId, items, amountPaid, }) => {
        let saleRecord = null;
        const runSale = async (session) => {
            const productIds = items.map((item) => item.product_id);
            const productsQuery = products_model_1.ProductModel.find({
                _id: { $in: productIds },
                business_id: businessId,
                is_active: true,
            });
            const products = session ? await productsQuery.session(session) : await productsQuery;
            if (products.length !== productIds.length) {
                throw new Error("PRODUCT_NOT_FOUND");
            }
            const productMap = new Map(products.map((product) => [product._id.toString(), product]));
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
                const updated = await products_model_1.ProductModel.updateOne({
                    _id: item.productId,
                    business_id: businessId,
                    stock: { $gte: item.quantity },
                    is_active: true,
                }, { $inc: { stock: -item.quantity } }, session ? { session } : undefined);
                if (updated.modifiedCount !== 1) {
                    throw new OutOfStockError("OUT_OF_STOCK");
                }
            }
            const total = saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            if (amountPaid < total) {
                const err = new Error("INSUFFICIENT_PAYMENT");
                err.code = "INSUFFICIENT_PAYMENT";
                throw err;
            }
            const sale = await sales_model_1.SaleModel.create([
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
            ], session ? { session } : undefined);
            saleRecord = sale[0];
        };
        const session = await mongoose_1.default.startSession();
        try {
            await session.withTransaction(async () => {
                await runSale(session);
            });
        }
        catch (err) {
            if (isReplicaSetError(err)) {
                await runSale();
            }
            else {
                throw err;
            }
        }
        finally {
            session.endSession();
        }
        return saleRecord;
    },
};
