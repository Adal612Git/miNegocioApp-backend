"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const zod_1 = require("zod");
const appointments_model_1 = require("./appointments.model");
const createSchema = zod_1.z.object({
    date: zod_1.z.string().date(),
    time: zod_1.z.string().min(3).max(10),
    notes: zod_1.z.string().max(500).optional(),
    status: zod_1.z.enum(["scheduled", "cancelled", "completed"]).optional(),
});
const listSchema = zod_1.z
    .object({
    start_date: zod_1.z.string().date(),
    end_date: zod_1.z.string().date(),
})
    .refine((data) => new Date(data.end_date).getTime() >= new Date(data.start_date).getTime(), { message: "INVALID_RANGE", path: ["end_date"] });
exports.AppointmentsController = {
    create: async (req, res, next) => {
        try {
            const { date, time, notes, status } = createSchema.parse(req.body);
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const appointmentDate = new Date(date);
            const hasOverlap = await appointments_model_1.AppointmentModel.checkOverlap({
                businessId,
                date: appointmentDate,
                time,
            });
            if (hasOverlap) {
                return res.status(409).json({ message: "APPOINTMENT_OVERLAP" });
            }
            const appointment = await appointments_model_1.AppointmentModel.create({
                business_id: businessId,
                date: appointmentDate,
                time,
                notes,
                status: status || "scheduled",
            });
            return res.status(201).json(appointment);
        }
        catch (err) {
            return next(err);
        }
    },
    list: async (req, res, next) => {
        try {
            const { start_date, end_date } = listSchema.parse(req.query);
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const appointments = await appointments_model_1.AppointmentModel.find({
                business_id: businessId,
                date: { $gte: startDate, $lte: endDate },
            }).sort({ date: 1, time: 1 });
            return res.status(200).json(appointments);
        }
        catch (err) {
            return next(err);
        }
    },
};
