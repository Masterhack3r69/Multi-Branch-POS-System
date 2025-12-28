# Multi-Branch POS System

A comprehensive Point of Sale system designed for retail businesses with multiple branches, featuring real-time inventory tracking, offline capability, and role-based access control.

## Features

- **Multi-Branch Support**: Manage stock and sales across different locations.
- **Offline First**: POS terminals continue to function without internet, syncing when online.
- **Real-time Inventory**: Track stock levels, adjustments, and movements.
- **Role-Based Access**: Granular permissions for Admins, Managers, and Cashiers.
- **Sales Integrity**: Secure sales processing, detailed history, and validated refunds.

## Tech Stack

### Frontend

- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `tailwind-merge` and `clsx`
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand)
- **Offline Storage**: [IDB](https://github.com/jakearchibald/idb) (IndexedDB wrapper)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: [Zod](https://zod.dev/)
- **Security**: Helmet, CORS, bcryptjs

### Language

- **TypeScript**: Used across the full stack for type safety.

## Project Structure

The project is organized as a monorepo with separate directories for client and server:

```
Multi-Branch-POS/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views/routes
│   │   ├── services/       # API and offline logic
│   │   └── stores/         # Zustand state stores
│   └── ...
├── server/                 # Backend Node.js/Express application
│   ├── prisma/             # Database schema and seed scripts
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Auth and validation middleware
│   │   └── ...
│   └── ...
├── API_DOCS.md             # Detailed API documentation
├── MVP_STATUS.md           # Current project status tracking
└── README.md               # Project documentation (this file)
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL installed and running

### Installation

1.  **Clone the repository**:

    ```bash
    git clone <repo-url>
    cd Multi-Branch-POS
    ```

2.  **Install Dependencies**:
    Since this project manages dependencies separately for client and server:

    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

3.  **Database Setup**:

    - Create a PostgreSQL database (e.g., `multi_branch_pos`).
    - **Configure Environment**:
      Create a `.env` file in the `server/` directory:
      ```env
      DATABASE_URL="postgresql://user:password@localhost:5432/multi_branch_pos?schema=public"
      JWT_SECRET="your_super_secret_key"
      PORT=3000
      ```
    - **Run Migrations & Seed**:
      Initialize the database schema and populate it with initial data (default admin user, branches, etc.).
      ```bash
      cd server
      npx prisma migrate dev --name init
      npx prisma db seed
      ```

4.  **Running the Application**:
    You need to run both the backend and frontend servers.

    - **Start Backend**:

      ```bash
      cd server
      npm start
      ```

      The server runs on `http://localhost:3000`.

    - **Start Frontend**:
      Open a new terminal window:
      ```bash
      cd client
      npm run dev
      ```
      The client runs on `http://localhost:5173`.

## Documentation

- **[API Documentation](./API_DOCS.md)**: Detailed reference for all backend API endpoints.

## Default Login credentials

Use these credentials to log in as the default Administrator:

- **Email**: `admin@example.com`
- **Password**: `password123`

## Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

![alt text](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXh4aGE3Y3BrZHQ2Ynd5b2I1ZTY0andheW85dzRldWp0YnpxZmQ0OSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KbdF8DCgaoIVC8BHTK/giphy.gif)
