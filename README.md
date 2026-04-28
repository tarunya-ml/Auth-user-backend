# 🔐 AuthUserDemo — Node.js Authentication API

A production-ready REST API for user authentication built with **Node.js**, **Express**, **MongoDB**, **Redis**, and **JWT**. Supports email/password login, email OTP login, and phone OTP login with secure token-based sessions.

---

## ✨ Features

- ✅ Register user with name, email, phone & password
- ✅ Login via **email + password**
- ✅ Login via **email OTP** (passwordless)
- ✅ Login via **phone OTP**
- ✅ OTP hashed with SHA-256 before storing in Redis
- ✅ OTP expiry (5 minutes)
- ✅ JWT token stored in secure `httpOnly` cookie
- ✅ Protected routes via auth middleware
- ✅ Global error handling
- ✅ Request logging with **Morgan** + **Winston**
- ✅ Daily rotating log files

---

## 🏗️ Project Structure

```
├── server.js
└── src/
    ├── app.js                        # Express app + middleware setup
    ├── config/
    │   ├── database.js               # MongoDB connection
    │   ├── logger.js                 # Winston logger config
    │   └── redis.js                  # Redis client config
    ├── controllers/
    │   └── user.controller.js        # Login, register, verify OTP logic
    ├── middlewares/
    │   ├── authUser.middleware.js    # JWT auth guard
    │   └── morganLogger.middleware.js# HTTP request logger
    ├── models/
    │   └── user.model.js             # Mongoose user schema + generateToken
    ├── routes/
    │   └── user.route.js             # All /user routes
    ├── services/
    │   ├── otp.service.js            # OTP generate, store, verify
    │   └── user.service.js           # User business logic
    ├── validations/
    │   └── authUser.validation.js    # Request body validators
    └── logs/
        ├── app.log                   # All logs
        └── error.log                 # Error-only logs
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Redis instance (RedisLabs / Upstash / local)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/auth-user-demo.git
cd auth-user-demo

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Fill in your values (see Environment Variables section)

# 4. Start the server
npm run dev       # development (nodemon)
npm start         # production
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=4000

# MongoDB
MONGODB_CONNECTION_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/AuthUserDemo

# JWT
JWTSECRET=your_jwt_secret_here

# Redis
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

# OTP
OTP_SECRET=your_otp_secret_here
```


---

## 📡 API Reference

### Base URL
```
http://localhost:4000/user
```

---

### Register

```http
POST /user/register
```

**Request Body**
```json
{
  "name": "Tarun Chaudhary",
  "email": "tarun@gmail.com",
  "phone": "8757509484",
  "password": "tarunya87"
}
```

**Response `201`**
```json
{
  "message": "User registered successfully!"
}
```

---

### Login — Email + Password

```http
POST /user/login
```

**Request Body**
```json
{
  "email": "tarun@gmail.com",
  "password": "Tarun9633"
}
```

**Response `200`** — sets `token` cookie
```json
{
  "message": "Login successful!"
}
```

---

### Login — Email OTP (send OTP)

```http
POST /user/login
```

**Request Body**
```json
{
  "email": "tarun@gmail.com"
}
```

**Response `200`**
```json
{
  "message": "otp sent on tarun@gmail.com."
}
```

---

### Login — Phone OTP (send OTP)

```http
POST /user/login
```

**Request Body**
```json
{
  "phone": "8757509484"
}
```

**Response `200`**
```json
{
  "message": "otp sent on 8757509484."
}
```

---

### Verify OTP

```http
POST /user/verify-otp
```

**Request Body** (use either `email` or `phone`, not both)
```json
{
  "email": "tarun@gmail.com",
  "otp": "482910"
}
```

**Response `200`** — sets `token` cookie
```json
{
  "message": "Login successful, welcome Tarun"
}
```

**Error Responses**

| Status | Message |
|--------|---------|
| `401` | `invalid username or password!` |
| `401` | `invalid email!` |
| `401` | `invalid phone!` |
| `400` | `OTP expired or not found` |
| `400` | `Invalid OTP` |
| `409` | `user not found!` |
| `500` | `Internal server error` |

---

## 🔒 Authentication Flow

### Email + Password
```
POST /user/login (email + password)
    → validate credentials
    → generate JWT
    → set httpOnly cookie
```

### OTP Flow
```
POST /user/login (email or phone only)
    → generate 6-digit OTP
    → hash OTP with SHA-256 + OTP_SECRET
    → store in Redis with 5min TTL with rate limiting(otp attempts)
    → send OTP via email/SMS

POST /user/verify-otp (email/phone + otp)
    → hash incoming OTP
    → compare with Redis stored hash (timing-safe)
    → delete OTP from Redis
    → generate JWT
    → set httpOnly cookie
```

---

## 🛡️ Security

| Feature | Implementation |
|---------|---------------|
| Password storage | Plain text ⚠️ — recommend `bcrypt` hashing |
| OTP storage | SHA-256 hashed in Redis |
| OTP comparison | `crypto.timingSafeEqual` (prevents timing attacks) |
| JWT | Stored in `httpOnly` + `sameSite: strict` cookie |
| OTP expiry | 5 minutes TTL in Redis |

> 💡 **Recommended improvement**: Hash passwords with `bcrypt` before storing.
> ```bash
> npm install bcrypt
> ```

---

## 📋 Logging

All logs are written to files using **Winston** and streamed from **Morgan**:

| File | Contents |
|------|----------|
| `logs/app.log` | All logs — info, warn, error, http requests |
| `logs/error.log` | Errors only with full stack trace |

Log levels: `error` → `warn` → `info` → `http` → `debug`

Set log level in `.env`:
```env
LOG_LEVEL=info
NODE_ENV=development
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Cache / OTP store | Redis (RedisLabs) |
| Auth | JWT (jsonwebtoken) |
| Logging | Winston + Morgan |
| OTP generation | Node.js `crypto` |
| Cookie parser | cookie-parser |

---

## 📦 Scripts

```bash
npm start         # Start production server
npm run dev       # Start with nodemon (auto-restart)
```

---

## 🗂️ .gitignore

Make sure your `.gitignore` includes:

```
node_modules/
.env
logs/
```

---

## 📄 .env.example

Commit this file (without real values) so other developers know what's needed:

```env
PORT=4000
MONGODB_CONNECTION_URI=
JWTSECRET=
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
OTP_SECRET=
LOG_LEVEL=info
NODE_ENV=development
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m 'add: your feature'`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👤 Author

**Tarun Chaudhary**

---
