import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { ProductModel } from "./products.model";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  category: z.string().min(1).max(120),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  category: z.string().min(1).max(120).optional(),
});

const updateStockSchema = z.object({
  stock: z.number().int().min(0),
});

export const ProductsController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
      }

      const products = await ProductModel.find({
        business_id: businessId,
        is_active: true,
      }).sort({ name: 1 });

      return res.status(200).json(products);
    } catch (err) {
      return next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, price, stock, category } = createSchema.parse(req.body);
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
      }

      const product = await ProductModel.create({
        business_id: businessId,
        name,
        price,
        stock,
        category,
        is_active: true,
      });

      return res.status(201).json(product);
    } catch (err) {
      return next(err);
    }
  },

  updateStock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stock } = updateStockSchema.parse(req.body);
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
      }
      const productId = req.params.id;

      const updated = await ProductModel.findOneAndUpdate(
        { _id: productId, business_id: businessId, is_active: true },
        { $set: { stock } },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "NOT_FOUND" });
      }

      return res.status(200).json(updated);
    } catch (err) {
      return next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates = updateSchema.parse(req.body);
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
      }
      const productId = req.params.id;

      const updated = await ProductModel.findOneAndUpdate(
        { _id: productId, business_id: businessId, is_active: true },
        { $set: updates },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "NOT_FOUND" });
      }

      return res.status(200).json(updated);
    } catch (err) {
      return next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
      }
      const productId = req.params.id;

      const updated = await ProductModel.findOneAndUpdate(
        { _id: productId, business_id: businessId, is_active: true },
        { $set: { is_active: false } },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "NOT_FOUND" });
      }

      return res.status(200).json(updated);
    } catch (err) {
      return next(err);
    }
  },
};
