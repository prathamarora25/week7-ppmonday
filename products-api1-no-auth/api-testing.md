# Testing Product API Endpoints Without Authentication

In this lab you will add automated **integration tests** to the first Products API backend with **Vitest** and **Supertest**.

This backend has public Product CRUD endpoints. It does not have user routes and it does not have protected routes.

Each endpoint has a task first, then a complete sample solution in a `<details>` block.

-------
## PART 1 - Project & Test Setup

Run commands from `products-all/products-api1-no-auth`.

### 1.1 Install test dependencies

```bash
npm install vitest supertest -D
```

Helpful documentation:

- [Vitest guide](https://vitest.dev/guide/)
- [Jest getting started](https://jestjs.io/docs/getting-started)

Vitest uses a Jest-like style, so `describe`, `it`, `expect`, `beforeEach`, `beforeAll`, and `afterAll` will feel familiar.

### 1.2 Add a basic test script

Open `package.json` and add:

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "test": "vitest run"
}
```

### 1.3 Configure Vitest

Create `vitest.config.mjs`:

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    testTimeout: 20000,
  },
});
```

### 1.4 Verify setup

Create `tests/mock.test.js`:

```js
describe("sanity check", () => {
  it("should confirm 1 + 1 equals 2", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:

```bash
npm test
```

You should see the mock test pass.

### 1.5 Use a test database

Vitest runs tests with `NODE_ENV=test`. The database config uses `TEST_MONGO_URI` in that environment.

Add a separate test database URI to `.env` and `.env.example`:

```text
TEST_MONGO_URI=mongodb://localhost:27017/products-api-test
```

### 1.6 Ignore Vitest cache files

Vitest may create a `.vitest/` cache directory. Add this to `.gitignore`:

```text
.vitest/
```

-------

## PART 2 - Product API Tests

Create this file:

```text
tests/product.test.js
```

### 2.1 Add imports, seed data, database connection, and setup

<details>
<summary>Sample Solution - setup for tests/product.test.js</summary>

```js
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
```

</details>

### 2.2 Test `GET /api/products`

Write tests that read like this:

```text
GET /api/products
  should return all products
  should return products as JSON with status 200
  should include a specific product in the returned list
```

<details>
<summary>Sample Solution - GET /api/products</summary>

```js
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
```

</details>

### 2.3 Test `POST /api/products`

Write tests that read like this:

```text
POST /api/products
  when the payload is valid
    should return status 201
    should persist the new product in the database
  when the payload is invalid
    should return status 400 when title is missing
    should not increase the number of products in the database
```

<details>
<summary>Sample Solution - POST /api/products</summary>

```js
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
```

</details>

### 2.4 Test `GET /api/products/:productId`

Write tests that read like this:

```text
GET /api/products/:productId
  when the id is valid
    should return one product by ID
  when the id does not exist
    should return status 404
  when the id is invalid
    should return status 404
```

<details>
<summary>Sample Solution - GET /api/products/:productId</summary>

```js
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
```

</details>

### 2.5 Test `PUT /api/products/:productId`

Write tests that read like this:

```text
PUT /api/products/:productId
  when the id is valid
    should return status 200
    should persist the updated fields in the database
  when the id is invalid
    should return status 404
```

<details>
<summary>Sample Solution - PUT /api/products/:productId</summary>

```js
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
```

</details>

### 2.6 Test `DELETE /api/products/:productId`

Write tests that read like this:

```text
DELETE /api/products/:productId
  when the id is valid
    should return status 204
    should remove the product from the database
  when the id is invalid
    should return status 404
```

<details>
<summary>Sample Solution - DELETE /api/products/:productId</summary>

```js
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
```

</details>

Run:

```bash
npm test
```

Expected output:

```text
Test Files  2 passed (2)
Tests       17 passed (17)
```
