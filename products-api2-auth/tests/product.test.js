const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");

const api = supertest(app);

const products = [
  {
    title: "Wireless Mouse",
    category: "Electronics",
    description: "Ergonomic wireless mouse with USB receiver.",
    price: 29.99,
    stockQuantity: 150,
    supplier: {
      name: "TechSupply Co.",
      contactEmail: "sales@techsupply.example",
      contactPhone: "+358401112233",
      rating: 5,
    },
  },
  {
    title: "Standing Desk",
    category: "Furniture",
    description: "Adjustable height standing desk.",
    price: 499.95,
    stockQuantity: 30,
    supplier: {
      name: "OfficePro Ltd.",
      contactEmail: "orders@officepro.example",
      contactPhone: "+358409998877",
      rating: 4,
    },
  },
];

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Product.insertMany(products);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/products", () => {
  it("should return all products", async () => {
    const response = await api.get("/api/products").expect(200);
    expect(response.body).toHaveLength(products.length);
  });

  it("should return products as JSON with status 200", async () => {
    await api
      .get("/api/products")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  it("should include a specific product in the returned list", async () => {
    const response = await api.get("/api/products");
    expect(response.body.map((product) => product.title)).toContain(
      "Wireless Mouse"
    );
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

      await api.post("/api/products").send(newProduct).expect(201);
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

      await api.post("/api/products").send(newProduct).expect(201);

      const productsAfterPost = await Product.find({});
      expect(productsAfterPost).toHaveLength(products.length + 1);
      expect(productsAfterPost.map((product) => product.title)).toContain(
        newProduct.title
      );
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

      await api.post("/api/products").send(invalidProduct).expect(400);
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

      await api.post("/api/products").send(invalidProduct).expect(400);

      const productsAtEnd = await Product.find({});
      expect(productsAtEnd).toHaveLength(products.length);
    });
  });
});

describe("GET /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return one product by ID", async () => {
      const product = await Product.findOne();

      const response = await api
        .get(`/api/products/${product._id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(response.body.title).toBe(product.title);
    });
  });

  describe("when the id does not exist", () => {
    it("should return status 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await api.get(`/api/products/${nonExistentId}`).expect(404);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.get("/api/products/12345").expect(404);
    });
  });
});

describe("PUT /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return status 200", async () => {
      const product = await Product.findOne();

      await api
        .put(`/api/products/${product._id}`)
        .send({ description: "Updated description", stockQuantity: 42 })
        .expect(200);
    });

    it("should persist the updated fields in the database", async () => {
      const product = await Product.findOne();
      const updates = {
        description: "Updated description",
        stockQuantity: 42,
      };

      await api.put(`/api/products/${product._id}`).send(updates).expect(200);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.description).toBe(updates.description);
      expect(updatedProduct.stockQuantity).toBe(updates.stockQuantity);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.put("/api/products/12345").send({}).expect(404);
    });
  });
});

describe("DELETE /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return status 204", async () => {
      const product = await Product.findOne();
      await api.delete(`/api/products/${product._id}`).expect(204);
    });

    it("should remove the product from the database", async () => {
      const product = await Product.findOne();

      await api.delete(`/api/products/${product._id}`).expect(204);

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      await api.delete("/api/products/12345").expect(404);
    });
  });
});