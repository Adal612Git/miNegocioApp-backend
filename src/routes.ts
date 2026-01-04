import { Router } from "express";

import { AuthController } from "./modules/auth/auth.controller";
import { SalesController } from "./modules/sales/sales.controller";
import { AppointmentsController } from "./modules/appointments/appointments.controller";
import { ProductsController } from "./modules/products/products.controller";
import { ReportsController } from "./modules/reports/reports.controller";
import { authMiddleware } from "./middlewares/auth.middleware";

const router = Router();

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.get("/auth/verify/:token", AuthController.verify);
router.post("/auth/admin/reset-user", AuthController.adminResetUser);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password", AuthController.resetPassword);

router.use(authMiddleware);

router.post("/sales", SalesController.create);
router.post("/sales/change", SalesController.calculateChange);

router.post("/appointments", AppointmentsController.create);
router.get("/appointments", AppointmentsController.list);

router.get("/products", ProductsController.list);
router.post("/products", ProductsController.create);
router.patch("/products/:id", ProductsController.update);
router.patch("/products/:id/stock", ProductsController.updateStock);
router.delete("/products/:id", ProductsController.remove);

router.get("/reports/sales", ReportsController.salesSummary);

export { router };
