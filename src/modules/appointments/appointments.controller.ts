import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { AppointmentModel } from "./appointments.model";

const createSchema = z.object({
  date: z.string().date({ message: "Fecha inválida" }),
  time: z.string().min(3, { message: "Hora inválida" }).max(10),
  notes: z.string().max(500).optional(),
  status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
});

const listSchema = z.object({
  start_date: z.string().date({ message: "Fecha inválida" }).optional(),
  end_date: z.string().date({ message: "Fecha inválida" }).optional(),
});

export const AppointmentsController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, time, notes, status } = createSchema.parse(req.body);
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const appointmentDate = new Date(date);

      const hasOverlap = await AppointmentModel.checkOverlap({
        businessId,
        date: appointmentDate,
        time,
      });

      if (hasOverlap) {
        return res.status(409).json({ message: "APPOINTMENT_OVERLAP" });
      }

      const appointment = await AppointmentModel.create({
        business_id: businessId,
        date: appointmentDate,
        time,
        notes,
        status: status || "scheduled",
      });

      return res.status(201).json(appointment);
    } catch (err) {
      return next(err);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { start_date, end_date } = listSchema.parse(req.query);
      const businessId = req.auth?.businessId;
      if (!businessId) {
        return res.status(401).json({ message: "No autorizado" });
      }
      if (!start_date && !end_date) {
        const appointments = await AppointmentModel.find({
          business_id: businessId,
        }).sort({ date: 1, time: 1 });
        return res.status(200).json(appointments);
      }

      if (!start_date || !end_date) {
        return res.status(400).json({ message: "Rango de fechas incompleto" });
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (endDate.getTime() < startDate.getTime()) {
        return res.status(400).json({ message: "Rango de fechas inválido" });
      }

      const appointments = await AppointmentModel.find({
        business_id: businessId,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1, time: 1 });

      return res.status(200).json(appointments);
    } catch (err) {
      return next(err);
    }
  },
};
