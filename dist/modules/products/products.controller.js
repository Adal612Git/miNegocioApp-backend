"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const zod_1 = require("zod");
const products_model_1 = require("./products.model");
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    price: zod_1.z.number().min(0),
    stock: zod_1.z.number().int().min(0),
    category: zod_1.z.string().min(1).max(120),
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).optional(),
    price: zod_1.z.number().min(0).optional(),
    stock: zod_1.z.number().int().min(0).optional(),
    category: zod_1.z.string().min(1).max(120).optional(),
});
const updateStockSchema = zod_1.z.object({
    stock: zod_1.z.number().int().min(0),
});
exports.ProductsController = {
    list: async (req, res, next) => {
        try {
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const products = await products_model_1.ProductModel.find({
                business_id: businessId,
                is_active: true,
            }).sort({ name: 1 });
            return res.status(200).json(products);
        }
        catch (err) {
            return next(err);
        }
    },
    create: async (req, res, next) => {
        try {
            const { name, price, stock, category } = createSchema.parse(req.body);
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const product = await products_model_1.ProductModel.create({
                business_id: businessId,
                name,
                price,
                stock,
                category,
                is_active: true,
            });
            return res.status(201).json(product);
        }
        catch (err) {
            return next(err);
        }
    },
    updateStock: async (req, res, next) => {
        try {
            const { stock } = updateStockSchema.parse(req.body);
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const productId = req.params.id;
            const updated = await products_model_1.ProductModel.findOneAndUpdate({ _id: productId, business_id: businessId, is_active: true }, { $set: { stock } }, { new: true });
            if (!updated) {
                return res.status(404).json({ message: "NOT_FOUND" });
            }
            return res.status(200).json(updated);
        }
        catch (err) {
            return next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            const updates = updateSchema.parse(req.body);
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const productId = req.params.id;
            const updated = await products_model_1.ProductModel.findOneAndUpdate({ _id: productId, business_id: businessId, is_active: true }, { $set: updates }, { new: true });
            if (!updated) {
                return res.status(404).json({ message: "NOT_FOUND" });
            }
            return res.status(200).json(updated);
        }
        catch (err) {
            return next(err);
        }
    },
    remove: async (req, res, next) => {
        try {
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const productId = req.params.id;
            const updated = await products_model_1.ProductModel.findOneAndUpdate({ _id: productId, business_id: businessId, is_active: true }, { $set: { is_active: false } }, { new: true });
            if (!updated) {
                return res.status(404).json({ message: "NOT_FOUND" });
            }
            return res.status(200).json(updated);
        }
        catch (err) {
            return next(err);
        }
    },
};
