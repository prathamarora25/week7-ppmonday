import request from "supertest";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import mongoose from "mongoose";
import app from "../app.js";
import connectDB from "../config/db.js";

const api = request(app);

beforeAll(async () => {

  describe("DELETE /api/products/:productId", () => {
    it("should return status 204 when the id is valid", async () => {
      const productsResponse = await api.get("/api/products");
      const product = productsResponse.body[0];

      await api
        .delete(`/api/products/${product.id}`)
        .expect(204);
    });

    it("should remove the product from the database", async () => {
      const productsResponse = await api.get("/api/products");
      const product = productsResponse.body[0];

      await api
        .delete(`/api/products/${product.id}`)
        .expect(204);

      const response = await api.get(`/api/products/${product.id}`);

      expect(response.status).toBe(404);
    });

    it("should return status 404 when the id is invalid", async () => {
      await api
        .delete("/api/products/12345")
        .expect(404);
    });
  });  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("API testing", () => {
describe("GET /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return one product by ID", async () => {
      const productsResponse = await api.get("/api/products");
      const product = productsResponse.body[0];

      const response = await api
        .get(`/api/products/${product.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(response.body.title).toBe(product.title);
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await api
        .get(`/api/products/${nonExistentId}`)
        .expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api
        .get("/api/products/12345")
        .expect(404);
    });
  });
});  describe("GET /api/products", () => {
    it("should return status 200", async () => {
      const response = await api.get("/api/products");

      expect(response.status).toBe(200);
    });
  });

    describe("POST /api/products", () => {
    describe("when the payload is valid", () => {
      it("should return status 201", async () => {
        const newProduct = {
          title: "Mechanical Keyboard",
          category: "Electronics",
          description: "RGB mechanical keyboard with blue switches.",
          price: 129.99,
          stockQuantity: 75,
          supplier: {
            name: "KeyboardWorld",
            contactEmail: "info@keyboardworld.example",
            contactPhone: "+358405556677",
            rating: 5,
          },
        };

        await api
          .post("/api/products")
          .send(newProduct)
          .expect(201);
      });

      it("should persist the new product in the database", async () => {
        const newProduct = {
          title: "Mechanical Keyboard",
          category: "Electronics",
          description: "RGB mechanical keyboard with blue switches.",
          price: 129.99,
          stockQuantity: 75,
          supplier: {
            name: "KeyboardWorld",
            contactEmail: "info@keyboardworld.example",
            contactPhone: "+358405556677",
            rating: 5,
          },
        };

        const Product = mongoose.model("Product");
        const productsBefore = await Product.find({});

        await api
          .post("/api/products")
          .send(newProduct)
          .expect(201);

        const productsAfter = await Product.find({});

        expect(productsAfter).toHaveLength(productsBefore.length + 1);
        expect(
          productsAfter.map((product) => product.title)
        ).toContain(newProduct.title);
      });
    });

    describe("when the payload is invalid", () => {
      it("should return status 400 when title is missing", async () => {
        const invalidProduct = {
          category: "Electronics",
          description: "Missing title should fail.",
          price: 19.99,
          stockQuantity: 10,
          supplier: {
            name: "No Title Supplier",
            contactEmail: "supplier@example.com",
            contactPhone: "+358401010101",
            rating: 3,
          },
        };

        await api
          .post("/api/products")
          .send(invalidProduct)
          .expect(400);
      });

      it("should not increase the number of products in the database", async () => {
        const invalidProduct = {
          category: "Electronics",
          description: "Missing title should fail.",
          price: 19.99,
          stockQuantity: 10,
          supplier: {
            name: "No Title Supplier",
            contactEmail: "supplier@example.com",
            contactPhone: "+358401010101",
            rating: 3,
          },
        };

        const Product = mongoose.model("Product");
        const productsBefore = await Product.find({});

        await api
          .post("/api/products")
          .send(invalidProduct)
          .expect(400);

        const productsAfter = await Product.find({});

        expect(productsAfter).toHaveLength(productsBefore.length);
      });
    });
  });

    describe("GET /api/products", () => {
    it("should return status 200", async () => {
      const response = await api.get("/api/products");

      expect(response.status).toBe(200);
    });

    it("should return products as JSON with status 200", async () => {
      await api
        .get("/api/products")
        .expect(200)
        .expect("Content-Type", /application\/json/);
    });

    it("should include a specific product in the returned list", async () => {
      const response = await api.get("/api/products");

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.map((product) => product.title)).toContain(
        "Test Product"
      );
    });
  });

    describe("PUT /api/products/:productId", () => {
    describe("when the id is valid", () => {
      it("should return status 200", async () => {
        const productsResponse = await api.get("/api/products");
        const product = productsResponse.body[0];

        await api
          .put(`/api/products/${product.id}`)
          .send({
            description: "Updated description",
            stockQuantity: 42,
          })
          .expect(200);
      });

      it("should persist the updated fields in the database", async () => {
        const productsResponse = await api.get("/api/products");
        const product = productsResponse.body[0];

        const updates = {
          description: "Updated description",
          stockQuantity: 42,
        };

        await api
          .put(`/api/products/${product.id}`)
          .send(updates)
          .expect(200);

        const Product = mongoose.model("Product");
        const updatedProduct = await Product.findById(product.id);

        expect(updatedProduct.description).toBe(updates.description);
        expect(updatedProduct.stockQuantity).toBe(updates.stockQuantity);
      });
    });

    describe("when the id is invalid", () => {
      it("should return status 404", async () => {
        await api
          .put("/api/products/12345")
          .send({})
          .expect(404);
      });
    });
  });

  describe("DELETE /api/products/:productId", () => {
    it("should return status 204 when the id is valid", async () => {
      const productsResponse = await api.get("/api/products");
      const product = productsResponse.body[0];

      await api
        .delete(`/api/products/${product.id}`)
        .expect(204);
    });

    it("should remove the product from the database", async () => {
      const productsResponse = await api.get("/api/products");
      const product = productsResponse.body[0];

      await api
        .delete(`/api/products/${product.id}`)
        .expect(204);

      const response = await api.get(`/api/products/${product.id}`);

      expect(response.status).toBe(404);
    });

    it("should return status 404 when the id is invalid", async () => {
      await api
        .delete("/api/products/12345")
        .expect(404);
    });
  });

});
