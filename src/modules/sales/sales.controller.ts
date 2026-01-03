import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { SalesService } from "./sales.service";

const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  amount_paid: z.number().min(0),
});

const changeSchema = z.object({
  total: z.number().min(0),
  monto_recibido: z.number().min(0),
});

export const SalesController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, amount_paid } = createSaleSchema.parse(req.body);

      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
      }

      const sale = await SalesService.createSale({
        businessId,
        items,
        amountPaid: amount_paid,
      });

      return res.status(201).json(sale);
    } catch (err: any) {
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

  calculateChange: (req: Request, res: Response, next: NextFunction) => {
    try {
      const { total, monto_recibido } = changeSchema.parse(req.body);
      if (monto_recibido < total) {
        return res.status(409).json({ message: "INSUFFICIENT_PAYMENT" });
      }

      return res.status(200).json({ cambio: monto_recibido - total });
    } catch (err) {
      return next(err);
    }
  },
};
