# Campus Placement Management System

A full-stack placement management system designed for universities to streamline campus recruitment workflows across Students, Companies, and Placement Officers.

## Project Overview
Most educational institutions manage campus placements using fragmented spreadsheets, emails, and manual tracking. This application consolidates recruitment activities into a single platform featuring role-based dashboards, automated eligibility checks, real-time status tracking, and company profile management.

## Key Features

### Student Features
- Student registration and authenticated portal access
- Browse active job postings and placement drives
- View detailed job descriptions, salary packages, and eligibility criteria
- Apply for jobs and track application status in real time
- Access interview schedules and online/offline interview details
- Resume link management and profile customization

### Company Features
- Recruiter account creation and institution association
- Post job opportunities with custom skills and eligibility requirements
- Review candidate applications and student details
- Update application statuses (Shortlisted, Interview Scheduled, Hired, Rejected)
- Schedule candidate interviews with date, time, and session links
- Manage company profile, headquarters, description, and company logo

### Admin Features
- Comprehensive Placement Cell control center
- Overview of placement drives, active jobs, and hiring stats
- Institutional oversight and approval management
- Real-time placement analytics feed

## Technology Stack

- **Frontend**: React (Vite), React Router DOM, Vanilla CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **API Client**: Axios

## System Architecture

```
Campus Placement System
├── Frontend (React + Vite)
│   ├── Landing Page
│   ├── Authentication (Login / Register / Password Reset)
│   ├── Student Dashboard
│   ├── Company Dashboard
│   └── Admin Dashboard
│
└── Backend (Express + Node.js)
    ├── REST APIs (/api/auth, /api/student, /api/company, /api/jobs, /api/placements)
    ├── Authentication & Role Authorization Middleware
    └── MongoDB Database Models (Student, Company, Job, Application, Placement)
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Database (Local instance or MongoDB Atlas)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/varalaxmi123-NU/mern_stack.git
cd mern_stack
```

2. Setup Backend:
```bash
cd backend
npm install
```
Configure environment variables in `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```
Start backend server:
```bash
npm run dev
```

3. Setup Frontend:
```bash
cd ../frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Node.js REST API service connected to MongoDB Atlas

## License
Distributed under the ISC License.
