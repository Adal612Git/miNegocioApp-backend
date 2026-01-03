"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
describe("Auth", () => {
    it("rejects login with incorrect password", async () => {
        await (0, supertest_1.default)(app_1.app).post("/api/auth/register").send({
            business_name: "Demo Biz",
            name: "Owner Demo",
            email: "demo@example.com",
            password: "StrongPass123",
        });
        const res = await (0, supertest_1.default)(app_1.app).post("/api/auth/login").send({
            email: "demo@example.com",
            password: "WrongPass123",
        });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("INVALID_CREDENTIALS");
    });
    it("returns a signed JWT with userId and businessId", async () => {
        const register = await (0, supertest_1.default)(app_1.app).post("/api/auth/register").send({
            business_name: "Biz 2",
            name: "Owner Two",
            email: "owner@example.com",
            password: "StrongPass123",
        });
        expect(register.status).toBe(201);
        expect(register.body.token).toBeTruthy();
        const payload = jsonwebtoken_1.default.verify(register.body.token, process.env.JWT_SECRET);
        expect(payload.userId).toBeTruthy();
        expect(payload.businessId).toBeTruthy();
    });
});
