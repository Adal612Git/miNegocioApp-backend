import request from "supertest";

import { app } from "../app";

async function registerAndGetToken() {
  const register = await request(app).post("/api/auth/register").send({
    business_name: "Appointments Biz",
    name: "Owner Appointments",
    email: "appointments@example.com",
    password: "StrongPass123",
  });

  return register.body.token as string;
}

describe("Appointments", () => {
  it("rejects overlapping appointments", async () => {
    const token = await registerAndGetToken();

    const resA = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2025-01-01",
        time: "10:00",
        notes: "Primera",
      });

    expect(resA.status).toBe(201);

    const resB = await request(app)
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
