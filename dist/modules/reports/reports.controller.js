"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const sales_model_1 = require("../sales/sales.model");
const salesReportSchema = zod_1.z.object({
    start_date: zod_1.z.string().date(),
    end_date: zod_1.z.string().date(),
});
exports.ReportsController = {
    salesSummary: async (req, res, next) => {
        try {
            const { start_date, end_date } = salesReportSchema.parse(req.query);
            const businessId = req.auth?.businessId;
            if (!businessId) {
                return res.status(401).json({ message: "UNAUTHORIZED" });
            }
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999);
            const businessObjectId = new mongoose_1.default.Types.ObjectId(businessId);
            const totalAgg = await sales_model_1.SaleModel.aggregate([
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
            const topProducts = await sales_model_1.SaleModel.aggregate([
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
        }
        catch (err) {
            return next(err);
        }
    },
};
