# Developer Collaboration Hub 🚀

A modern full-stack Single Page Application (SPA) built with the **MERN Stack** (MongoDB, Express.js, React.js 19, and Node.js) featuring real-time bi-directional WebSockets via **Socket.io**.

Developer Collaboration Hub is an enterprise-grade platform connecting software engineers, designers, and open-source creators. It streamlines peer recruitment through a weighted skill-matching algorithm, task coordination through an interactive 4-stage Kanban board, and instant team communication through authenticated project chat rooms.

---

## 🌟 Key Features

- **🔐 Secure Authentication & Role-Based Access Control**:
  - Encrypted credential storage with `bcryptjs`.
  - Stateless authentication via JSON Web Tokens (JWT) with automatic request header injection.
  - Granular permissions separating standard Developers from Platform Administrators.
- **🎯 Weighted Skill-Matching Engine**:
  - Dynamically computes compatibility percentages between user skills and project requirements.
  - Normalized formula prioritizing high-weight skills for targeted recommendations.
- **📂 Project Showcase & Discovery**:
  - Filter projects by category, required skills, and collaboration status.
  - Interactive project cards highlighting match scores, member counts, and repository links.
- **📝 Application & Membership Workflow**:
  - Developers apply to projects with custom pitches and target roles.
  - Project leads review, accept, or decline applications with instant in-app toast notifications.
- **📋 Agile Multi-Stage Kanban Task Board**:
  - Interactive columns: `TODO`, `IN PROGRESS`, `REVIEW`, and `DONE`.
  - Task priority indicators (`Low`, `Medium`, `High`, `Critical`), assignees, and due dates.
- **💬 Real-Time Socket.io Team Chat**:
  - Room-based channels (`project_{projectId}`) isolated to verified team members.
  - Sub-second message delivery with persistent storage in MongoDB.
- **🛡️ Administrative Supervision Dashboard**:
  - Moderation portal for user suspension, project approval/removal, and telemetry metrics.
- **🎨 Modern Glassmorphism UI**:
  - Built with React 19, Vite, Tailwind CSS, and Lucide Icons. Fully responsive across mobile, tablet, and desktop.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router DOM v7, Tailwind CSS, Lucide React Icons, Axios |
| **Backend** | Node.js (v18+), Express.js RESTful API, Socket.io |
| **Database** | MongoDB (Atlas / Local v7.0), Mongoose v8.3 ODM |
| **Real-Time** | WebSockets via Socket.io & Socket.io-client |
| **Security** | JWT (jsonwebtoken), bcryptjs, CORS origin whitelisting |
| **Tooling** | ESLint, Oxlint, Postman, Chrome DevTools, npm |

---

## 📁 Project Structure

```text
developer-collaboration-hub/
├── README.md                      # Project documentation (this file)
├── package.json                   # Root package orchestration
├── .env.example                   # Root environment template
├── server/                        # Express + Socket.io Backend
│   ├── server.js                  # Main server entry point
│   ├── package.json
│   ├── .env                       # Backend environment variables
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection
│   ├── middleware/
│   │   ├── auth.js                # JWT token authentication guard
│   │   ├── errorHandler.js        # Global API error boundary
│   │   └── role.js                # Admin role authorization guard
│   ├── models/                    # Mongoose Data Models
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Application.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   └── Report.js
│   ├── controllers/               # Business Logic Controllers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── applicationController.js
│   │   └── adminController.js
│   ├── routes/                    # RESTful Express Routes
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── chatRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── skillMatching.js       # Weighted skill calculation algorithm
│   │   └── notificationService.js # In-app notification dispatcher
│   └── socket/
│       └── chatSocket.js          # Socket.io JWT handshake & room handlers
└── client/                        # React 19 Frontend SPA
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── main.jsx               # Application bootstrap
        ├── App.jsx                # Router & context providers
        ├── App.css                # Custom glassmorphism styles
        ├── index.css              # Tailwind CSS directives
        ├── routes/                # Protected & Admin route guards
        ├── context/               # Global State (Auth, Socket, Notifications)
        ├── services/api.js        # Axios instance with JWT interceptors
        ├── components/
        │   ├── common/            # Navbar, Modal, Badges, Avatar Uploader
        │   ├── projects/          # ProjectCard, ProjectFilter
        │   ├── tasks/             # KanbanBoard, TaskCard, TaskModal
        │   └── chat/              # ProjectChat room
        └── pages/                 # Full-page views
            ├── Home.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── DiscoverProjects.jsx
            ├── ProjectDetails.jsx
            ├── CreateProject.jsx
            ├── ProjectWorkspace.jsx
            ├── DeveloperProfile.jsx
            ├── EditProfile.jsx
            ├── MyApplications.jsx
            ├── Showcase.jsx
            └── AdminDashboard.jsx
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Active MongoDB Atlas cluster URI or local MongoDB daemon running on port 27017

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/developer-collaboration-hub.git
cd developer-collaboration-hub

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 3. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/devcollab?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Run Development Servers

**Option A — Run Both Concurrently from Root:**
```bash
npm run dev
```

**Option B — Run Separately:**
```bash
# Terminal 1: Backend API & WebSocket Server
cd server
npm run dev

# Terminal 2: Frontend Vite Development Server
cd client
npm run dev
```

Once started:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 📡 RESTful API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Yes |
| `GET` | `/api/projects` | Discover projects with match scores | Optional |
| `POST` | `/api/projects` | Create a new project listing | Yes |
| `GET` | `/api/projects/:id` | Fetch complete project details | Yes |
| `PUT` | `/api/projects/:id` | Update project metadata | Yes (Owner) |
| `POST` | `/api/projects/:id/apply` | Apply to join project team | Yes |
| `GET` | `/api/tasks/:projectId` | Fetch project Kanban tasks | Yes (Member) |
| `POST` | `/api/tasks/:projectId` | Create a new task | Yes (Member) |
| `PUT` | `/api/tasks/:id` | Update task status or assignee | Yes (Member) |
| `GET` | `/api/chat/:projectId` | Retrieve chat message history | Yes (Member) |
| `GET` | `/api/notifications` | Fetch user notifications | Yes |
| `GET` | `/api/admin/metrics` | System telemetry & statistics | Yes (Admin) |
| `PUT` | `/api/admin/users/:id/suspend` | Suspend or activate user | Yes (Admin) |

---

## 🔌 WebSocket Events (Socket.io)

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `connection` | Client -> Server | Auth token in handshake | Authenticates socket connection |
| `join_project` | Client -> Server | `{ projectId }` | Joins room `project_{projectId}` |
| `send_message` | Client -> Server | `{ projectId, text }` | Persists message and emits to room |
| `new_message` | Server -> Client | Message object | Broadcasts message to room members |

---

## 🎓 Academic Details

- **Course:** 24CS810 - Modern Front-End Frameworks and SPA Development
- **Student Name:** K. KARTEEK
- **Registration Number:** 241FA04F15
- **Program & Section:** B.Tech CSE - Section F (3rd Year)
- **Project Title:** DEVELOPER COLLABORATION HUB - A FULL-STACK MERN PLATFORM
- **Comprehensive Project Report:** Available as [`Developer_Collaboration_Hub_MERN_Project_Report.docx`](./Developer_Collaboration_Hub_MERN_Project_Report.docx) (42 pages).

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

