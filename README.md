# Loko Estate API

This is the backend API for the Loko Estate application, a real estate platform.

## Description

The Loko Estate API provides endpoints for:

- User Authentication (Register, Login, Logout)
- User Management
- Property Posts (CRUD operations)
- Chat and Messaging

## Tech Stack

- Node.js
- Express.js
- Prisma (ORM)
- MongoDB (Database)
- JWT (Authentication)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository_url>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:

   ```env
   DATABASE_URL="mongodb+srv://..."
   JWT_SECRET_KEY="your_secret_key"
   CLIENT_URL="http://localhost:5173"
   PORT=8800
   ```

4. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

## Usage

Start the development server:

```bash
npm start
```

The API will be available at `http://localhost:8800`.

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running.

## License

ISC
