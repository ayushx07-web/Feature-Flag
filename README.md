# Feature Flag System

Production-grade Feature Flag Management System consisting of a Spring Boot backend, React + Vite frontend, and a Node/Browser compatible JS SDK.

## Prerequisites
- Docker & Docker Compose
- Java 21 & Maven
- Node.js 18+

## Running Locally

### 1. Start Infrastructure (PostgreSQL & Redis)
```bash
cd feature-flag-system
docker compose up -d
```

### 2. Start Backend (Spring Boot)
Open a new terminal:
```bash
cd feature-flag-system/backend
mvn spring-boot:run
```
The application will run on `http://localhost:8080`. Flyway will automatically migrate the DB.

### 3. Start Frontend (React + Vite)
Open a new terminal:
```bash
cd feature-flag-system/frontend
npm install
npm run dev
```
The application will run on `http://localhost:5173`.

### 4. Build SDK 
```bash
cd feature-flag-system/sdk
npm install
npm run build
```

## Sample Evaluation cURL

Once a project and flag is created via the Console, you can test the evaluation endpoint directly:

```bash
curl -X POST http://localhost:8080/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ff_live_your_project_key_here" \
  -d '{
    "flagKey": "my-new-feature",
    "userId": "user_123",
    "userAttributes": {
      "plan": "pro"
    }
  }'
```
