import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { ProductModel } from "./products.model";

const allowedCategories = new Set(
  [
    "servicio",
    "paquete",
    "otro",
    "producto",
    "insumo",
    "accesorio",
    "corte",
    "color",
    "tratamiento",
    "spa",
  ].map((item) =>
    item.toLowerCase()
  )
);

function normalizeCategory(value: string) {
  return String(value || "").trim().toLowerCase();
}

const createSchema = z.object({
  name: z.string().min(1, { message: "Nombre requerido" }).max(120),
  price: z.coerce.number().min(0, { message: "Precio inválido" }),
  stock: z.coerce.number().int().min(0, { message: "Stock inválido" }),
  category: z
    .string()
    .min(1, { message: "Categoría requerida" })
    .max(120)
    .refine((value) => allowedCategories.has(normalizeCategory(value)), {
      message: "Categoría inválida",
    }),
});

const updateSchema = z.object({
  name: z.string().min(1, { message: "Nombre requerido" }).max(120).optional(),
  price: z.coerce.number().min(0, { message: "Precio inválido" }).optional(),
  stock: z.coerce.number().int().min(0, { message: "Stock inválido" }).optional(),
  category: z
    .string()
    .min(1, { message: "Categoría requerida" })
    .max(120)
    .optional()
    .refine((value) => (value ? allowedCategories.has(normalizeCategory(value)) : true), {
      message: "Categoría inválida",
    }),
});

const updateStockSchema = z.object({
  stock: z.coerce.number().int().min(0, { message: "Stock inválido" }),
});

export const ProductsController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      console.log("Listado de inventario", { businessId, path: req.path });

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
        return res.status(401).json({ message: "No autorizado" });
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
        return res.status(401).json({ message: "No autorizado" });
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
        return res.status(401).json({ message: "No autorizado" });
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
        return res.status(401).json({ message: "No autorizado" });
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
