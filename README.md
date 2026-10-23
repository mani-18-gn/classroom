# ClassGuard AI — Smart Classroom Safety & Attention Monitoring System

ClassGuard AI is an intelligent, privacy-first classroom attention monitoring and student safety system. Powered by on-device computer vision (MediaPipe) and real-time biometric analysis, it assists educators and administrators in maintaining an engaged, safe learning environment without compromising student privacy.

---

## 🌟 Key Features

- **Real-Time Attention & Drowsiness Tracking**: Client-side face landmarking and head pose estimation powered by `@mediapipe/tasks-vision` (Eye Aspect Ratio and Yaw distraction detection).
- **Multi-Role Portals**: Dedicated, secure dashboards tailored for **Students**, **Teachers**, and **Administrators**.
- **Privacy-First Architecture**: Edge processing minimizes video transmission, storing only safety telemetry and biometric consents with strict retention policies.
- **Biometric Profiles & Consents**: Explicit digital consent workflows for monitoring compliance.
- **Timeline & Event Auditing**: Verification timeline markers, teacher action auditing, and automated retention management.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Computer Vision**: Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)

### Backend (`/server`)
- **Runtime**: Node.js + Express
- **Database**: SQLite (via `better-sqlite3` with WAL mode enabled)
- **Auth & Security**: JWT (`jsonwebtoken`), `bcryptjs`, CORS

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mani-18-gn/classroom.git
   cd classroom
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client && npm install

   # Install server dependencies
   cd ../server && npm install
   cd ..
   ```

3. **Initialize & Seed the Database**:
   ```bash
   npm run seed
   ```

4. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   - Frontend runs at: `http://localhost:5173`
   - Backend API runs at: `http://localhost:5000`

---

## 📜 Available Scripts

From the root directory:
- `npm run dev` — Starts both backend and frontend concurrently
- `npm run client` — Starts Vite dev server
- `npm run server` — Starts Node.js backend server
- `npm run seed` — Resets and seeds initial database records
- `npm run build` — Compiles TypeScript and creates production frontend bundle

---

## 🔒 Privacy & Compliance

ClassGuard AI is designed with student privacy as a primary constraint:
- Facial landmark detection runs locally on the browser edge.
- Automated data retention workers prune session telemetry according to configurable institutional policies.
- Explicit student/parental consent management built into the core workflow.
