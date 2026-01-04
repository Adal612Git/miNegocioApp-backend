import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import mongoose from "mongoose";

import { SaleModel } from "../sales/sales.model";

const salesReportSchema = z.object({
  start_date: z.string().date({ message: "Fecha inválida" }),
  end_date: z.string().date({ message: "Fecha inválida" }),
});

export const ReportsController = {
  salesSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { start_date, end_date } = salesReportSchema.parse(req.query);
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);

      const businessObjectId = new mongoose.Types.ObjectId(businessId);

      const totalAgg = await SaleModel.aggregate([
        {
          $match: {
            business_id: businessObjectId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total_income: { $sum: "$total" },
          },
        },
      ]);

      const topProducts = await SaleModel.aggregate([
        {
          $match: {
            business_id: businessObjectId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product_id",
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.price"] },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]);

      return res.status(200).json({
        total_income: totalAgg[0]?.total_income || 0,
        top_products: topProducts.map((item) => ({
          product_id: item._id,
          quantity: item.quantity,
          revenue: item.revenue,
        })),
      });
    } catch (err) {
      return next(err);
    }
  },
};
