import request from "supertest";
import jwt from "jsonwebtoken";

import { app } from "../app";
import { ProductModel } from "../modules/products/products.model";

async function registerAndGetToken() {
  const register = await request(app).post("/api/auth/register").send({
    business_name: "Sales Biz",
    name: "Owner Sales",
    phone: "5551234567",
    email: "sales@gmail.com",
    password: "StrongPass123",
  });

  return register.body.token as string;
}

describe("Sales", () => {
  it("creates a sale, discounts stock, and returns change", async () => {
    const token = await registerAndGetToken();
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      businessId: string;
    };

    const product = await ProductModel.create({
      business_id: payload.businessId,
      name: "Shampoo",
      price: 500,
      stock: 10,
      category: "Producto",
      is_active: true,
    });

    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ product_id: product._id.toString(), quantity: 2 }],
        amount_paid: 2000,
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(1000);

    const updated = await ProductModel.findById(product._id);
    expect(updated?.stock).toBe(8);

    const changeRes = await request(app)
      .post("/api/sales/change")
      .set("Authorization", `Bearer ${token}`)
      .send({ total: 1000, monto_recibido: 2000 });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.cambio).toBe(1000);
  });

  it("returns 409 when trying to sell more than available stock", async () => {
    const token = await registerAndGetToken();
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      businessId: string;
    };

    const product = await ProductModel.create({
      business_id: payload.businessId,
      name: "Gel",
      price: 300,
      stock: 1,
      category: "Producto",
      is_active: true,
    });

    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ product_id: product._id.toString(), quantity: 2 }],
        amount_paid: 1000,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Stock insuficiente");
  });
});
