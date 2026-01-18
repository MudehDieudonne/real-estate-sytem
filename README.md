# Loko Estate Backend API

> A robust, feature-rich real estate platform backend built with Node.js, Express, and Prisma

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-v18+-green)
![License](https://img.shields.io/badge/license-ISC-blue)
![Status](https://img.shields.io/badge/status-Active-brightgreen)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

---

## Overview

**Loko Estate API** is a comprehensive backend service for a real estate platform that enables users to:

- Browse and search property listings
- Create, update, and delete property posts
- Save favorite properties
- Communicate with other users through real-time chat and messaging
- Manage user profiles securely

The API is production-ready with rate limiting, JWT authentication, input validation, and comprehensive error handling.

---

## Features

### Authentication & Security

- **User Registration** with password hashing (bcrypt)
- **Secure Login** with JWT token generation
- **Cookie-based Authentication** with HttpOnly flags
- **Rate Limiting** on authentication endpoints (5 requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Helmet.js** for HTTP security headers

### User Management

- **User Profiles** with avatar support
- **Profile Updates** with authorization checks
- **Account Deletion** with data cascade cleanup
- **User Discovery** to browse all users

### Property Management

- **Create Listings** with comprehensive property details
- **Advanced Filtering** by city, type, price range, bedroom count
- **Search & Discovery** with multiple filter combinations
- **Post Details** including descriptions, utilities, and proximity information
- **Image Management** with multiple images per property
- **Location Data** with latitude/longitude coordinates
- **Edit & Delete** listings with ownership verification

### Save & Wishlist

- **Save Properties** to personalized wishlist
- **Manage Saved Posts** with toggle functionality
- **Profile Posts** view combining user's listings and saved properties

### Real-time Communication

- **Instant Messaging** between users
- **Chat Conversations** with participant management
- **Message History** within each chat
- **Read Status** for unread conversations
- **Socket-ready** architecture for real-time updates

---

## Tech Stack

| Category              | Technology                     |
| --------------------- | ------------------------------ |
| **Runtime**           | Node.js (v18+)                 |
| **Framework**         | Express.js v5.2.1              |
| **Database**          | MongoDB                        |
| **ORM**               | Prisma 6.19                    |
| **Authentication**    | JWT (jsonwebtoken)             |
| **Password Hashing**  | bcrypt                         |
| **API Documentation** | Swagger/OpenAPI 3.0            |
| **Security**          | Helmet.js, CORS, Rate Limiting |
| **Cookie Management** | cookie-parser                  |
| **Environment**       | dotenv                         |
| **Code Quality**      | ESLint, Prettier               |
| **Git Hooks**         | Husky, lint-staged             |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **MongoDB** - [Download Community Edition](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (Cloud)
- **Git** (for version control)

### Verify Installation

```bash
node --version    # Should be v18+
npm --version     # Should be v8+
```

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/mudeh/loko-estate-backend.git
cd backend-loko
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json`:

- Core: express, prisma, mongodb
- Security: bcrypt, helmet, cors, express-rate-limit
- Authentication: jsonwebtoken
- Documentation: swagger-jsdoc, swagger-ui-express
- Development: nodemon, eslint, prettier, husky

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables:

```env
# Database Configuration
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/loko-estate"

# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET_KEY="your-super-secret-jwt-key-min-32-chars-recommended"

# CORS Configuration
CLIENT_URL="http://localhost:5173"

# Optional: Production URL
PRODUCTION_URL="https://api.lokostate.com"
```

#### Environment Variables Explained:

| Variable         | Purpose                              | Example                                          |
| ---------------- | ------------------------------------ | ------------------------------------------------ |
| `DATABASE_URL`   | MongoDB connection string            | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `PORT`           | Server port                          | `3000`                                           |
| `NODE_ENV`       | Environment (development/production) | `development`                                    |
| `JWT_SECRET_KEY` | Secret key for JWT signing           | Min 32 characters recommended                    |
| `CLIENT_URL`     | Frontend URL for CORS                | `http://localhost:5173`                          |
| `PRODUCTION_URL` | Production API URL (optional)        | `https://api.lokostate.com`                      |

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client based on your schema.

### Step 5: Push Database Schema

```bash
npx prisma db push
```

This creates collections in MongoDB based on the Prisma schema.

---

## Configuration

### MongoDB Setup

#### Option A: MongoDB Atlas (Cloud) - Recommended

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Whitelist your IP
6. Copy the connection string to `.env`

#### Option B: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:

   ```bash
   # On Windows
   net start MongoDB

   # On macOS
   brew services start mongodb-community

   # On Linux
   sudo systemctl start mongod
   ```

3. Connection string: `mongodb://localhost:27017/loko-estate`

### Prisma Configuration

Located in `prisma/schema.prisma`:

- Defines all data models (User, Post, Chat, Message, etc.)
- Specifies MongoDB as the database provider
- Uses environment variable `DATABASE_URL` for connection

To view/edit database: `npx prisma studio`

---

## Project Structure

```
backend-loko/
├── src/
│   ├── config/              # Configuration files
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── post.controller.js
│   │   ├── chat.controller.js
│   │   └── message.controller.js
│   ├── middleware/          # Custom middleware
│   │   └── verifyToken.js   # JWT verification
│   ├── routes/              # API routes with Swagger docs
│   │   ├── auth.route.js
│   │   ├── user.route.js
│   │   ├── post.route.js
│   │   ├── chat.route.js
│   │   └── message.route.js
│   ├── lib/
│   │   └── prisma.js        # Prisma client instance
│   └── modules/             # Shared utilities/modules
├── prisma/
│   └── schema.prisma        # Database schema definition
├── app.js                   # Express app setup & Swagger config
├── package.json             # Dependencies & scripts
├── .env                     # Environment variables (not in git)
├── .eslintrc                # ESLint configuration
├── eslint.config.js         # ESLint flat config
├── prettier.config.js       # Code formatter config
├── .husky/                  # Git hooks
├── lint-staged.config.js    # Linting on commit
└── README.md                # This file
```

---

## Database Schema

### Models Overview

#### **User**

Represents a platform user

```
- id: ObjectId (Primary Key)
- email: String (Unique)
- username: String (Unique)
- password: String (Hashed)
- avatar: String (Optional URL)
- createdAt: DateTime
- posts: [Post]
- savedPosts: [SavedPost]
- chats: [Chat]
- chatIDs: [ObjectId]
```

#### **Post**

Real estate property listing

```
- id: ObjectId
- title: String
- price: Integer
- images: [String] URLs
- address: String
- city: String
- bedroom: Integer
- bathroom: Integer
- latitude: Float
- longitude: Float
- type: Enum (sale, rent)
- property: Enum (apartment, house, condo, villa, duplex, townhouse, land)
- createdAt: DateTime
- userId: ObjectId (Foreign Key → User)
- postDetail: PostDetail (One-to-One)
- savedPosts: [SavedPost]
```

#### **PostDetail**

Extended information for posts

```
- id: ObjectId
- desc: String (Description)
- utilities: String (Included utilities)
- pet: String (Pet policy)
- income: String (Income requirement)
- size: Integer (Square footage)
- school: Integer (Distance to school)
- bus: Integer (Distance to bus stop)
- restaurant: Integer (Distance to restaurant)
- postId: ObjectId (Unique Foreign Key → Post)
```

#### **SavedPost**

Junction table for user's saved properties

```
- id: ObjectId
- userId: ObjectId (Foreign Key → User)
- postId: ObjectId (Foreign Key → Post)
- createdAt: DateTime
- @@unique([userId, postId]) - Composite unique constraint
```

#### **Chat**

Conversation between users

```
- id: ObjectId
- users: [User]
- userIDs: [ObjectId]
- createdAt: DateTime
- seenBy: [ObjectId]
- messages: [Message]
- lastMessage: String
```

#### **Message**

Individual message in a chat

```
- id: ObjectId
- chatId: ObjectId (Foreign Key → Chat)
- senderId: ObjectId
- text: String
- createdAt: DateTime
```

---

## API Documentation

### Interactive API Docs

Once the server is running, visit:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api-docs/swagger.json`

### API Endpoints Overview

#### Authentication (`/api/auth`)

| Method | Endpoint    | Description       | Auth |
| ------ | ----------- | ----------------- | ---- |
| POST   | `/register` | Register new user | No   |
| POST   | `/login`    | Login user        | No   |
| POST   | `/logout`   | Logout user       | No   |

#### Users (`/api/users`)

| Method | Endpoint        | Description              | Auth |
| ------ | --------------- | ------------------------ | ---- |
| GET    | `/`             | Get all users            | No   |
| PUT    | `/:id`          | Update user profile      | Yes  |
| DELETE | `/:id`          | Delete user account      | Yes  |
| POST   | `/save`         | Save/unsave post         | Yes  |
| GET    | `/profilePosts` | Get user's posts & saved | Yes  |

#### Posts (`/api/posts`)

| Method | Endpoint | Description                  | Auth |
| ------ | -------- | ---------------------------- | ---- |
| GET    | `/`      | Get all posts (with filters) | No   |
| POST   | `/`      | Create new post              | Yes  |
| GET    | `/:id`   | Get single post              | No   |
| PUT    | `/:id`   | Update post                  | Yes  |
| DELETE | `/:id`   | Delete post                  | Yes  |

#### Chats (`/api/chats`)

| Method | Endpoint    | Description       | Auth |
| ------ | ----------- | ----------------- | ---- |
| GET    | `/`         | Get user's chats  | Yes  |
| POST   | `/`         | Create new chat   | Yes  |
| GET    | `/:id`      | Get chat details  | Yes  |
| PUT    | `/read/:id` | Mark chat as read | Yes  |

#### Messages (`/api/messages`)

| Method | Endpoint   | Description  | Auth |
| ------ | ---------- | ------------ | ---- |
| POST   | `/:chatId` | Send message | Yes  |

### Query Parameters Example

Get filtered posts:

```bash
GET /api/posts?city=NewYork&type=rent&property=apartment&bedroom=2&minPrice=1000&maxPrice=3000
```

---

## Running the Application

### Development Mode (with Auto-reload)

```bash
npm start
```

This runs the server with **nodemon**, which automatically restarts on file changes.

### Production Mode

```bash
NODE_ENV=production node app.js
```

### Output

```
Server is running on port 3000
```

### Available Scripts

```bash
# Start development server
npm start

# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database (if seed.js exists)
npm run seed
```

---

## Development Workflow

### Code Quality Tools

#### ESLint - Linting

Catch errors and enforce code standards:

```bash
npm run lint                # Check for issues
npm run lint -- --fix       # Auto-fix issues
```

#### Prettier - Code Formatting

Auto-format code for consistency:

```bash
npm run format              # Format all files
npm run format:check        # Check formatting
```

#### Husky & Lint-Staged

Automatically run checks before commits:

```bash
git add .
git commit -m "Your message"  # Runs lint & format checks automatically
```

### Making API Changes

1. **Update Prisma Schema** (`prisma/schema.prisma`)

   ```bash
   npx prisma migrate dev --name your_change_name
   ```

2. **Update Controllers** (`src/controllers/`)
   - Add/modify business logic

3. **Update Routes** (`src/routes/`)
   - Add/modify endpoints
   - Add Swagger documentation

4. **Test with Swagger UI**
   ```bash
   npm start
   # Visit http://localhost:3000/api-docs
   ```

---

## Security Features

### Password Security

- Passwords hashed with **bcrypt** (salt rounds: 10)
- Never stored in plain text
- Only username/password validation on login

### Authentication

- **JWT Tokens** with 7-day expiration
- **HttpOnly Cookies** (prevents XSS attacks)
- Token verification middleware on protected routes

### Rate Limiting

- **Authentication Endpoints**: 5 requests per 15 minutes per IP
- Prevents brute force attacks
- Returns `429 Too Many Requests` when limit exceeded

### HTTP Security

- **Helmet.js** sets secure HTTP headers
- **CORS** validates request origins
- **Cookie Parser** for secure cookie handling

### Authorization

- Users can only modify/delete their own data
- Token ownership verification on protected endpoints
- Cascade delete for related records

### Input Validation

- Required field validation in controllers
- Type checking with Prisma
- MongoDB injection prevention via Prisma ORM

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Database Connection Error

```
Error: connect ECONNREFUSED
```

**Solutions:**

- Verify `DATABASE_URL` in `.env` is correct
- Check MongoDB service is running
- Ensure IP is whitelisted (if using Atlas)
- Test connection: `npx prisma db execute --stdin < test-connection.js`

### JWT Authentication Fails

```
Error: Invalid token
```

**Solutions:**

- Check `JWT_SECRET_KEY` matches across restarts
- Verify token hasn't expired (7 days)
- Clear cookies and re-login
- Check browser cookie settings

### Prisma Schema Conflicts

```bash
# Reset database (!! Deletes all data)
npx prisma migrate reset

# Or push latest schema
npx prisma db push
```

### CORS Errors

```
Access to XMLHttpRequest blocked by CORS
```

**Solution:** Update `CLIENT_URL` in `.env`:

```env
CLIENT_URL="http://localhost:5173"
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Create a Feature Branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Commit Changes**

   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

3. **Push to Branch**

   ```bash
   git push origin feature/amazing-feature
   ```

4. **Open a Pull Request**
   - Describe changes clearly
   - Reference any related issues

### Code Standards

- Run `npm run lint` before committing
- Run `npm run format` to ensure consistency
- Write descriptive commit messages
- Add Swagger documentation for new endpoints

---

## Author

**Mudeh Dieudonne Mukum**

- Portfolio: [Your Website]
- GitHub: [@mudeh](https://github.com/mudeh)
- Email: [your-email@example.com]

---

## License

This project is licensed under the **ISC License** - see the LICENSE file for details.

ISC License allows:

- Commercial use
- Modification
- Distribution
- Private use
- Warranty (use at own risk)
- Liability

---

## Support & Contact

For questions or issues:

- Email: [your-email@example.com]
- GitHub Issues: [Create an issue](https://github.com/mudeh/loko-estate-backend/issues)
- Discussions: [Community discussions](https://github.com/mudeh/loko-estate-backend/discussions)

---

## Roadmap

### Upcoming Features

- [ ] Image upload to cloud storage
- [ ] Email verification
- [ ] Password reset functionality
- [ ] User reviews and ratings
- [ ] Admin dashboard
- [ ] Mobile app support
- [ ] Property Managment

---

## Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [MongoDB](https://www.mongodb.com/) - Database
- [JWT.io](https://jwt.io/) - JSON Web Tokens
- [Swagger](https://swagger.io/) - API Documentation

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready

## Usage

Start the development server:

```bash
npm start
```

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running.

## License

ISC
