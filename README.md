# Multi-Branch POS System

A comprehensive Point of Sale system designed for retail businesses with multiple branches, featuring real-time inventory tracking, offline capability, and role-based access control.

## Features

- **Multi-Branch Support**: Manage stock and sales across different locations.
- **Offline First**: POS terminals continue to function without internet, syncing when online.
- **Real-time Inventory**: Track stock levels, adjustments, and movements.
- **Role-Based Access**: Granular permissions for Admins, Managers, and Cashiers.
- **Sales Integrity**: Secure sales processing, detailed history, and validated refunds.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand (State), IDB (Offline Storage).
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Language**: TypeScript (Full Stack).

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL

### Installation

1.  **Clone the repository**:

    ```bash
    git clone <repo-url>
    cd Multi-Branch-POS
    ```

2.  **Install Dependencies**:

    ```bash
    cd server && npm install
    cd ../client && npm install
    ```

3.  **Database Setup**:

    - Create a PostgreSQL database.
    - Configure `.env` in `server/` with `DATABASE_URL`.
    - Run migrations:
      ```bash
      cd server
      npx prisma migrate dev
      npx prisma db seed
      ```

4.  **Running the App**:
    - **Server**: `cd server && npm start` (Port 3000)
    - **Client**: `cd client && npm run dev` (Port 5173)

## Default Login

- **Email**: `admin@example.com`
- **Password**: `password123`
