import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { SalesService } from "./sales.service";

const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        quantity: z.coerce.number().int().min(1, { message: "Cantidad inválida" }),
      })
    )
    .min(1),
  amount_paid: z.coerce.number().min(0, { message: "Monto inválido" }),
});

const changeSchema = z.object({
  total: z.coerce.number().min(0, { message: "Total inválido" }),
  monto_recibido: z.coerce.number().min(0, { message: "Monto inválido" }),
});

export const SalesController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, amount_paid } = createSaleSchema.parse(req.body);

      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const sale = await SalesService.createSale({
        businessId,
        items,
        amountPaid: amount_paid,
      });

      return res.status(201).json(sale);
    } catch (err: any) {
      if (err && err.code === "OUT_OF_STOCK") {
        return res.status(409).json({ message: "Stock insuficiente" });
      }
      if (err && err.message === "PRODUCT_NOT_FOUND") {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      if (err && err.code === "INSUFFICIENT_PAYMENT") {
        return res.status(409).json({ message: "Monto insuficiente" });
      }
      return next(err);
    }
  },

  calculateChange: (req: Request, res: Response, next: NextFunction) => {
    try {
      const { total, monto_recibido } = changeSchema.parse(req.body);
      if (monto_recibido < total) {
        return res.status(409).json({ message: "Monto insuficiente" });
      }

      return res.status(200).json({ cambio: monto_recibido - total });
    } catch (err) {
      return next(err);
    }
  },
};
