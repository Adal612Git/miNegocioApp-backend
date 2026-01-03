"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesController = void 0;
const zod_1 = require("zod");
const sales_service_1 = require("./sales.service");
const createSaleSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        product_id: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().min(1),
    }))
        .min(1),
    amount_paid: zod_1.z.number().min(0),
});
const changeSchema = zod_1.z.object({
    total: zod_1.z.number().min(0),
    monto_recibido: zod_1.z.number().min(0),
});
exports.SalesController = {
    create: async (req, res, next) => {
        try {
            const { items, amount_paid } = createSaleSchema.parse(req.body);
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const sale = await sales_service_1.SalesService.createSale({
                businessId,
                items,
                amountPaid: amount_paid,
            });
            return res.status(201).json(sale);
        }
        catch (err) {
            if (err && err.code === "OUT_OF_STOCK") {
                return res.status(409).json({ message: "OUT_OF_STOCK" });
            }
            if (err && err.message === "PRODUCT_NOT_FOUND") {
                return res.status(404).json({ message: "PRODUCT_NOT_FOUND" });
            }
            if (err && err.code === "INSUFFICIENT_PAYMENT") {
                return res.status(409).json({ message: "INSUFFICIENT_PAYMENT" });
            }
            return next(err);
        }
    },
    calculateChange: (req, res, next) => {
        try {
            const { total, monto_recibido } = changeSchema.parse(req.body);
            if (monto_recibido < total) {
                return res.status(409).json({ message: "INSUFFICIENT_PAYMENT" });
            }
            return res.status(200).json({ cambio: monto_recibido - total });
        }
        catch (err) {
            return next(err);
        }
    },
};
