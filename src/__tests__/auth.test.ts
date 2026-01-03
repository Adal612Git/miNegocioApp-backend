import request from "supertest";
import jwt from "jsonwebtoken";

import { app } from "../app";

describe("Auth", () => {
  it("rejects login with incorrect password", async () => {
    await request(app).post("/api/auth/register").send({
      business_name: "Demo Biz",
      name: "Owner Demo",
      email: "demo@example.com",
      password: "StrongPass123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "demo@example.com",
      password: "WrongPass123",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("INVALID_CREDENTIALS");
  });

  it("returns a signed JWT with userId and businessId", async () => {
    const register = await request(app).post("/api/auth/register").send({
      business_name: "Biz 2",
      name: "Owner Two",
      email: "owner@example.com",
      password: "StrongPass123",
    });

    expect(register.status).toBe(201);
    expect(register.body.token).toBeTruthy();

    const payload = jwt.verify(
      register.body.token,
      process.env.JWT_SECRET as string
    ) as { userId: string; businessId: string };

    expect(payload.userId).toBeTruthy();
    expect(payload.businessId).toBeTruthy();
  });
});
