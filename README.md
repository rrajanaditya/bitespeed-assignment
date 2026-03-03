# Bitespeed Assignment

This repository contains a backend service built to solve the Identity Reconciliation problem. The primary goal is to provide a single source of truth for customer identities by linking multiple contact points (emails and phone numbers) together into a unified profile.

The service helps businesses track customer loyalty and provide personalized experiences even when users provide different contact details across separate orders.

---

## Tech Stack

* Runtime: Node.js (v20+)
* Language: TypeScript (ESM)
* Web Framework: Express 5.x
* Database: PostgreSQL
* ORM: Prisma 7.4.2 (using Driver Adapters)
* Execution Tool: tsx for native TypeScript execution

---

## Project Structure

```text
├── src
│   ├── controllers/    # API request handling
│   ├── services/       # Core reconciliation logic
│   ├── routes/         # Endpoint definitions
│   ├── lib/            # Prisma client initialization
│   ├── generated/      # Output folder for Prisma Client
│   ├── app.ts          # Express application logic
│   └── server.ts       # Server startup script
├── prisma
│   ├── schema.prisma   # Database schema definitions
│   └── migrations/     # SQL migration files
├── .env                # Local configuration and secrets
├── tsconfig.json       # TypeScript configuration (NodeNext)
└── package.json        # Project scripts and dependencies
```

---

## Getting Started

### 1. Prerequisites
* Node.js v20 or higher installed.
* Access to a PostgreSQL database.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Setup
Create a .env file in the project root with the following variables:

.env Template:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public&sslmode=no-verify" 
(use sslmode=no-verify to make sure prisma works with hosted PostgreSQL like render)

# API Port configuration
PORT=3000
```

### 4. Database Setup
Initialize Prisma, apply the schema to your database, and generate the client types:
```bash
# Initialize Prisma in the project (if not already initialized)
npx prisma init

# Create and apply database migrations to sync your schema
npx prisma migrate dev --name init

# Generate the type-safe Prisma Client (updates your src/generated folder)
npx prisma generate
```

### 5. Running the Application
Start the development server with live reloading:
```bash
npm run dev
```
The API will be available at http://localhost:3000.

---

## Build and Production

To prepare the application for a production environment:

1. Build the project:
```bash
npm run build
```
This runs the Prisma generator and the TypeScript compiler, outputting the result to the dist/ folder.

2. Start the production server:
```bash
npm start
```

---

## API Documentation

### Identify Contact
This endpoint identifies and tracks customer identities across multiple purchase events.

** Endpoint: ** POST /identify

** Request Body: **
```json
{
  "email": "customer@example.com",
  "phoneNumber": "9876543210"
}
```

** Response (200 OK): **
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["customer@example.com", "alternate-email@example.com"],
    "phoneNumbers": ["9876543210"],
    "secondaryContactIds": [2, 5]
  }
}
```

---

## Reconciliation Rules

The service follows a specific logic flow to manage primary and secondary contacts:
* New User: If no matches are found for the email or phone number, a new record is created as a "primary" contact.
* New Information: If a match is found for one field but a new value is provided for the other, a "secondary" contact is created and linked to the existing primary.
* Primary Conflict: If an incoming request links two separate primary contacts, the older one remains primary, and the newer one is converted to a "secondary" contact.

---

## Testing
Test the endpoint using cURL or any API client:
```bash
curl -X POST http://localhost:3000/identify \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "phoneNumber": "1112223333"}'
```
