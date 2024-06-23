# API

This project is an API for an e-commerce website, built with Node.js and Express. It includes functionalities for user authentication, product management, and cart management.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Dependencies](#dependencies)
- [License](#license)

## Installation

To get started with the project, follow these steps:

1. **Clone the repository:**

   ```
   git clone https://github.com/yourusername/ecommerce-api.git
   cd ecommerce-api
   ```

2. **Install the dependencies:**

   Make sure you have Node.js and npm installed. Then run:

   ```
   npm install
   ```

3. **Set up MongoDB:**

   Make sure you have MongoDB installed and running. You can use a local MongoDB instance or a cloud-based solution like MongoDB Atlas.

4. **Create a `.env` file in the root of your project and add the following:**

   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=4000
   ```

## Configuration

- **MongoDB Connection:** The connection string to your MongoDB instance is specified in the `.env` file under `MONGODB_URI`.
- **Server Port:** The server runs on port 4000 by default. You can change this in the `.env` file.

## Usage

1. **Start the server:**

   ```
   npm start
   ```

   The server will start running on `http://localhost:4000`.

2. **Access the API:**

   Use an API client like Postman or cURL to interact with the API.

## API Endpoints

### Authentication

- **Login User:**

  ```http
  POST /login
  ```

  **Request Body:**

  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```

- **Signup User:**

  ```http
  POST /signup
  ```

  **Request Body:**

  ```json
  {
    "username": "username",
    "email": "user@example.com",
    "password": "password"
  }
  ```

### Products

- **Get All Products:**

  ```http
  GET /allproducts
  ```

- **Get New Collections:**

  ```http
  GET /newcollections
  ```

- **Get Products by Category:**

  ```http
  GET /cpu
  ```

- **Get Related Products:**

  ```http
  POST /relatedproducts
  ```

  **Request Body:**

  ```json
  {
    "category": "category_name"
  }
  ```

- **Add Product:**

  ```http
  POST /addproduct
  ```

  **Request Body:**

  ```json
  {
    "name": "product_name",
    "description": "product_description",
    "image": "image_url",
    "category": "category_name",
    "new_price": 100,
    "old_price": 150
  }
  ```

- **Remove Product:**

  ```http
  POST /removeproduct
  ```

  **Request Body:**

  ```json
  {
    "id": 1
  }
  ```

### Cart

- **Add to Cart:**

  ```http
  POST /addtocart
  ```

  **Request Body:**

  ```json
  {
    "itemId": 1
  }
  ```

- **Remove from Cart:**

  ```http
  POST /removefromcart
  ```

  **Request Body:**

  ```json
  {
    "itemId": 1
  }
  ```

- **Get Cart Data:**

  ```http
  POST /getcart
  ```

### Image Upload

- **Upload Image:**

  ```http
  POST /upload
  ```

  **Request Body (form-data):**

  ```plaintext
  product: file
  ```

## Dependencies

- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [multer](https://github.com/expressjs/multer)
- [cors](https://github.com/expressjs/cors)
- [dotenv](https://github.com/motdotla/dotenv)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
