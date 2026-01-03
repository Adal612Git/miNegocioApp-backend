"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
async function registerAndGetToken() {
    const register = await (0, supertest_1.default)(app_1.app).post("/api/auth/register").send({
        business_name: "Appointments Biz",
        name: "Owner Appointments",
        email: "appointments@example.com",
        password: "StrongPass123",
    });
    return register.body.token;
}
describe("Appointments", () => {
    it("rejects overlapping appointments", async () => {
        const token = await registerAndGetToken();
        const resA = await (0, supertest_1.default)(app_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${token}`)
            .send({
            date: "2025-01-01",
            time: "10:00",
            notes: "Primera",
        });
        expect(resA.status).toBe(201);
        const resB = await (0, supertest_1.default)(app_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${token}`)
            .send({
            date: "2025-01-01",
            time: "10:00",
        });
        expect(resB.status).toBe(409);
        expect(resB.body.message).toBe("APPOINTMENT_OVERLAP");
    });
});
