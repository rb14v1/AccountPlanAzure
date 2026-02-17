# Account Management Platform

## Overview
This project is a full-stack account management platform built with React (Vite, TypeScript, MUI) and Django (REST Framework, Azure integrations).

## Prerequisites
- Node.js >= 18
- Python >= 3.10
- pip
- SQL Server or PostgreSQL (for backend DB)
- Azure account (for production)

## Setup

### 1. Clone the repository
```
git clone <repo-url>
cd account_management/accountmanagement
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your secrets:
```
cp .env.example .env
```

### 3. Install dependencies
#### Frontend
```
cd accountmanagement
npm install
```
#### Backend
```
cd ../backend
pip install -r requirements.txt
```

### 4. Run the app
#### Backend
```
cd backend
python manage.py migrate
python manage.py runserver
```
#### Frontend
```
cd ../accountmanagement
npm run dev
```

## Linting & Formatting
- Run `npm run lint` for frontend code quality.
- Use `black` or `isort` for Python formatting.

## Deployment
- Set all secrets in environment variables (never hardcode in code).
- Use production DB and Azure resources.
- Use `npm run build` for frontend production build.

## Security
- Never commit secrets or passwords.
- Use HTTPS in production.

