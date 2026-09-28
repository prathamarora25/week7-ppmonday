# Testing Protected Product API Endpoints

In this lab you will add automated **integration tests** to the protected Products API backend with **Vitest** and **Supertest**.

This backend has public product read routes, user signup/login, JWT authentication, and protected product create/update/delete routes.

Each endpoint has a task first, then a complete sample solution in a `<details>` block.

-------
## PART 1 - Project & Test Setup

Run commands from `products-all/products-api3-protect`.

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

## PART 2 - User Signup & Login Tests

Create this file:

```text
tests/users.test.js
```

### 2.1 Add imports, valid user data, database connection, and setup

<details>
<summary>Sample Solution - setup for tests/users.test.js</summary>

```js
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/userModel");

const api = supertest(app);

const validUser = {
  name: "Jane Productowner",
  email: "jane.productowner@example.com",
  password: "Product123!",
  phone_number: "+358401234567",
  gender: "female",
  date_of_birth: "1995-06-15",
  membership_status: "active",
};

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});
```

</details>

### 2.2 Test `POST /api/users/signup`

Write tests that read like this:

```text
POST /api/users/signup
  when the payload is valid
    should return status 201
    should return an email and token
    should persist the user in the database
  when the payload is invalid
    should return status 400 when required fields are missing
  when the email is already registered
    should return status 400
```

<details>
<summary>Sample Solution - POST /api/users/signup</summary>

```js
describe("POST /api/users/signup", () => {
  describe("when the payload is valid", () => {
    it("should return status 201", async () => {
      await api
        .post("/api/users/signup")
        .send(validUser)
        .expect(201)
        .expect("Content-Type", /application\/json/);
    });

    it("should return an email and token", async () => {
      const response = await api
        .post("/api/users/signup")
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty("token");
      expect(response.body.email).toBe(validUser.email);
    });

    it("should persist the user in the database", async () => {
      await api.post("/api/users/signup").send(validUser).expect(201);

      const savedUser = await User.findOne({ email: validUser.email });
      expect(savedUser).not.toBeNull();
      expect(savedUser.name).toBe(validUser.name);
    });
  });

  describe("when the payload is invalid", () => {
    it("should return status 400 when required fields are missing", async () => {
      const response = await api
        .post("/api/users/signup")
        .send({ email: "missing@example.com" })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Please add all fields");
    });

    it("should not persist a user in the database", async () => {
      await api
        .post("/api/users/signup")
        .send({ email: "missing@example.com" })
        .expect(400);

      const usersAtEnd = await User.find({});
      expect(usersAtEnd).toHaveLength(0);
    });
  });

  describe("when the email is already registered", () => {
    it("should return status 400", async () => {
      await api.post("/api/users/signup").send(validUser).expect(201);

      const response = await api
        .post("/api/users/signup")
        .send({ ...validUser, name: "Another Productowner" })
        .expect(400);

      expect(response.body).toHaveProperty("error", "User already exists");
    });
  });
});
```

</details>

### 2.3 Test `POST /api/users/login`

Write tests that read like this:

```text
POST /api/users/login
  when the credentials are valid
    should return status 200
    should return an email and token
  when the credentials are invalid
    should return status 400
```

<details>
<summary>Sample Solution - POST /api/users/login</summary>

```js
describe("POST /api/users/login", () => {
  beforeEach(async () => {
    await api.post("/api/users/signup").send(validUser).expect(201);
  });

  describe("when the credentials are valid", () => {
    it("should return status 200", async () => {
      await api
        .post("/api/users/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200)
        .expect("Content-Type", /application\/json/);
    });

    it("should return an email and token", async () => {
      const response = await api
        .post("/api/users/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body.email).toBe(validUser.email);
    });
  });

  describe("when the credentials are invalid", () => {
    it("should return status 400 with a wrong password", async () => {
      const response = await api
        .post("/api/users/login")
        .send({
          email: validUser.email,
          password: "WrongPassword!",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should return status 400 with an email that does not exist", async () => {
      const response = await api
        .post("/api/users/login")
        .send({
          email: "nobody@example.com",
          password: validUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });
  });
});
```

</details>

-------

## PART 3 - Protected Product Endpoint Tests

Study the router:

```js
router.get("/", getAllProducts);
router.get("/:productId", getProductById);

router.use(requireAuth);

router.post("/", createProduct);
router.put("/:productId", updateProduct);
router.delete("/:productId", deleteProduct);
```

This means:

- `GET /api/products` and `GET /api/products/:productId` are public.
- `POST`, `PUT`, and `DELETE` require a token.

The Product schema requires `user_id`. Do not invent a fake `user_id`. Sign up a user, get a token, and seed products through authenticated `POST /api/products` calls.

Create this file:

```text
tests/products.test.js
```

### 3.1 Add imports, seed data, helper, auth setup, and database setup

<details>
<summary>Sample Solution - setup for tests/products.test.js</summary>

```js
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");
const Product = require("../models/productModel");
const User = require("../models/userModel");

const api = supertest(app);

const userData = {
  name: "Protected Product Tester",
  email: "protected.products@example.com",
  password: "Product123!",
  phone_number: "+358409876543",
  gender: "other",
  date_of_birth: "1990-01-20",
  membership_status: "active",
};

const initialProducts = [
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

const productsInDb = async () => {
  const products = await Product.find({});
  return products.map((product) => product.toJSON());
};

let token = null;

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({});
  await Product.deleteMany({});

  const signupResponse = await api
    .post("/api/users/signup")
    .send(userData)
    .expect(201);

  token = signupResponse.body.token;
});

beforeEach(async () => {
  await Product.deleteMany({});

  for (const product of initialProducts) {
    await api
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send(product)
      .expect(201);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
```

</details>

### 3.2 Test `GET /api/products`

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

    expect(response.body).toHaveLength(initialProducts.length);
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

### 3.3 Test `GET /api/products/:productId`

Write tests that read like this:

```text
GET /api/products/:productId
  when the id is valid
    should return one product by ID
  when the id is invalid
    should return status 404
```

<details>
<summary>Sample Solution - GET /api/products/:productId</summary>

```js
describe("GET /api/products/:productId", () => {
  describe("when the id is valid", () => {
    it("should return one product by ID", async () => {
      const product = await Product.findOne({ title: "Standing Desk" });

      const response = await api
        .get(`/api/products/${product._id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(response.body.title).toBe(product.title);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      const response = await api.get("/api/products/not-a-valid-id").expect(404);

      expect(response.body).toHaveProperty("error", "No such product");
    });
  });
});
```

</details>

### 3.4 Test `POST /api/products`

Write tests that read like this:

```text
POST /api/products
  when the user is authenticated
    should return status 201
    should persist the new product with a user_id
  when the user is not authenticated
    should return status 401
    should not increase the number of products in the database
```

<details>
<summary>Sample Solution - POST /api/products</summary>

```js
describe("POST /api/products", () => {
  describe("when the user is authenticated", () => {
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
        .set("Authorization", `Bearer ${token}`)
        .send(newProduct)
        .expect(201)
        .expect("Content-Type", /application\/json/);
    });

    it("should persist the new product with a user_id", async () => {
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

      const response = await api
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send(newProduct)
        .expect(201);

      expect(response.body.title).toBe(newProduct.title);
      expect(response.body).toHaveProperty("user_id");

      const productsAtEnd = await productsInDb();
      expect(productsAtEnd).toHaveLength(initialProducts.length + 1);
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401", async () => {
      await api.post("/api/products").send(initialProducts[0]).expect(401);
    });

    it("should not increase the number of products in the database", async () => {
      await api.post("/api/products").send(initialProducts[0]).expect(401);

      const productsAtEnd = await productsInDb();
      expect(productsAtEnd).toHaveLength(initialProducts.length);
    });
  });
});
```

</details>

### 3.5 Test `PUT /api/products/:productId`

Write tests that read like this:

```text
PUT /api/products/:productId
  when the user is authenticated
    should return status 200
    should persist the updated fields in the database
  when the user is not authenticated
    should return status 401
  when the id is invalid
    should return status 404
```

<details>
<summary>Sample Solution - PUT /api/products/:productId</summary>

```js
describe("PUT /api/products/:productId", () => {
  describe("when the user is authenticated", () => {
    it("should return status 200", async () => {
      const product = await Product.findOne({ title: "Wireless Mouse" });

      await api
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ stockQuantity: 42, description: "Updated product description." })
        .expect(200)
        .expect("Content-Type", /application\/json/);
    });

    it("should persist the updated fields in the database", async () => {
      const product = await Product.findOne({ title: "Wireless Mouse" });

      await api
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ stockQuantity: 42, description: "Updated product description." })
        .expect(200);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stockQuantity).toBe(42);
      expect(updatedProduct.description).toBe("Updated product description.");
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401", async () => {
      const product = await Product.findOne({ title: "Wireless Mouse" });

      await api
        .put(`/api/products/${product._id}`)
        .send({ stockQuantity: 1 })
        .expect(401);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      const response = await api
        .put("/api/products/not-a-valid-id")
        .set("Authorization", `Bearer ${token}`)
        .send({ stockQuantity: 1 })
        .expect(404);

      expect(response.body).toHaveProperty("error", "No such product");
    });
  });
});
```

</details>

### 3.6 Test `DELETE /api/products/:productId`

Write tests that read like this:

```text
DELETE /api/products/:productId
  when the user is authenticated
    should return status 204
    should remove the product from the database
  when the user is not authenticated
    should return status 401
  when the id is invalid
    should return status 404
```

<details>
<summary>Sample Solution - DELETE /api/products/:productId</summary>

```js
describe("DELETE /api/products/:productId", () => {
  describe("when the user is authenticated", () => {
    it("should return status 204", async () => {
      const product = await Product.findOne({ title: "Wireless Mouse" });

      await api
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);
    });

    it("should remove the product from the database", async () => {
      const productsAtStart = await productsInDb();
      const productToDelete = productsAtStart[0];

      await api
        .delete(`/api/products/${productToDelete.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const productsAtEnd = await productsInDb();
      expect(productsAtEnd).toHaveLength(productsAtStart.length - 1);
      expect(productsAtEnd.map((product) => product.title)).not.toContain(
        productToDelete.title
      );
    });
  });

  describe("when the user is not authenticated", () => {
    it("should return status 401", async () => {
      const product = await Product.findOne({ title: "Wireless Mouse" });

      await api.delete(`/api/products/${product._id}`).expect(401);
    });
  });

  describe("when the id is invalid", () => {
    it("should return status 404", async () => {
      const response = await api
        .delete("/api/products/not-a-valid-id")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty("error", "No such product");
    });
  });
});
```

</details>

-------

## PART 4 - Coverage, Watch Mode, and `cross-env`

After the tests pass, add the final scripts.

Install `cross-env` and the coverage provider:

```bash
npm install cross-env
npm install @vitest/coverage-v8 -D
```

Use:

```json
"scripts": {
  "start": "cross-env NODE_ENV=production node index.js",
  "dev": "cross-env NODE_ENV=development nodemon index.js",
  "test": "cross-env NODE_ENV=test vitest run",
  "test:coverage": "cross-env NODE_ENV=test vitest run --coverage",
  "test:watch": "cross-env NODE_ENV=test vitest"
}
```

Why `cross-env`?

- `NODE_ENV=test` lets the app use `TEST_MONGO_URI`.
- `cross-env` makes the command work on Windows, macOS, and Linux.
- A test database prevents tests from changing development data.

Run:

```bash
npm test
```

Expected output:

```text
Test Files  3 passed (3)
Tests       28 passed (28)
```

Run coverage:

```bash
npm run test:coverage
```
