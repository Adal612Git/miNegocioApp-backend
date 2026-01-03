"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
const products_model_1 = require("../modules/products/products.model");
async function registerAndGetToken() {
    const register = await (0, supertest_1.default)(app_1.app).post("/api/auth/register").send({
        business_name: "Sales Biz",
        name: "Owner Sales",
        email: "sales@example.com",
        password: "StrongPass123",
    });
    return register.body.token;
}
describe("Sales", () => {
    it("creates a sale, discounts stock, and returns change", async () => {
        const token = await registerAndGetToken();
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const product = await products_model_1.ProductModel.create({
            business_id: payload.businessId,
            name: "Shampoo",
            price: 500,
            stock: 10,
            category: "higiene",
            is_active: true,
        });
        const res = await (0, supertest_1.default)(app_1.app)
            .post("/api/sales")
            .set("Authorization", `Bearer ${token}`)
            .send({
            items: [{ product_id: product._id.toString(), quantity: 2 }],
            amount_paid: 2000,
        });
        expect(res.status).toBe(201);
        expect(res.body.total).toBe(1000);
        const updated = await products_model_1.ProductModel.findById(product._id);
        expect(updated?.stock).toBe(8);
        const changeRes = await (0, supertest_1.default)(app_1.app)
            .post("/api/sales/change")
            .set("Authorization", `Bearer ${token}`)
            .send({ total: 1000, monto_recibido: 2000 });
        expect(changeRes.status).toBe(200);
        expect(changeRes.body.cambio).toBe(1000);
    });
    it("returns 409 when trying to sell more than available stock", async () => {
        const token = await registerAndGetToken();
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const product = await products_model_1.ProductModel.create({
            business_id: payload.businessId,
            name: "Gel",
            price: 300,
            stock: 1,
            category: "peinado",
            is_active: true,
        });
        const res = await (0, supertest_1.default)(app_1.app)
            .post("/api/sales")
            .set("Authorization", `Bearer ${token}`)
            .send({
            items: [{ product_id: product._id.toString(), quantity: 2 }],
            amount_paid: 1000,
        });
        expect(res.status).toBe(409);
        expect(res.body.message).toBe("OUT_OF_STOCK");
    });
});
