import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { AppointmentModel } from "../appointments/appointments.model";
import { SaleModel } from "../sales/sales.model";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

type NotificationItem = {
  id: string;
  type: "sale" | "appointment";
  message: string;
  date: Date;
};

export const NotificationsController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = querySchema.parse(req.query);
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const maxItems = limit || 6;

      const [appointments, sales] = await Promise.all([
        AppointmentModel.find({ business_id: businessId })
          .sort({ date: -1 })
          .limit(maxItems)
          .lean()
          .exec(),
        SaleModel.find({ business_id: businessId })
          .sort({ date: -1 })
          .limit(maxItems)
          .lean()
          .exec(),
      ]);

      const notifications: NotificationItem[] = [];

      appointments.forEach((appointment) => {
        const time = appointment.time || "";
        const title = appointment.notes || "Cita programada";
        notifications.push({
          id: String(appointment._id),
          type: "appointment",
          message: time ? `${title} - ${time}` : title,
          date: appointment.date || new Date(),
        });
      });

      sales.forEach((sale) => {
        const total = Number(sale.total || 0).toLocaleString("es-MX", {
          style: "currency",
          currency: "MXN",
        });
        notifications.push({
          id: String(sale._id),
          type: "sale",
          message: `Venta registrada por ${total}`,
          date: sale.date || new Date(),
        });
      });

      notifications.sort((a, b) => b.date.getTime() - a.date.getTime());

      return res.status(200).json(notifications.slice(0, maxItems));
    } catch (err) {
      return next(err);
    }
  },
};
