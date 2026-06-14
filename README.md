# 🎓 Skill Swap for Student Learning

A peer-to-peer skill exchange platform designed for college students. Students can connect with classmates who have expertise in subjects they want to learn, swap tutoring roles, and collaborate through real-time chat and video calls — all within a verified college community.

---

## ✨ Features

- **College-verified accounts** — Registration is restricted to institutional email addresses (`.ac.in` domains), keeping the community trusted and campus-specific.
- **Skill profiles** — Students list their specializations with a proficiency level (1–5), so peers can find the right person to learn from.
- **Smart matching** — Browse and connect with students based on the skills you want to learn and the skills you can teach.
- **Real-time chat** — One-on-one chat rooms for students to discuss sessions, ask questions, and coordinate.
- **Video call sessions** — Integrated video calling directly within the platform for live tutoring sessions.
- **Availability status** — Students can set their availability and a status message so others know when they're open for sessions.
- **Dual roles** — Every student can be both a learner and a tutor, enabling genuine skill swapping.

---

## 🏗️ Project Structure

```
Skill_Swap_For_Student_Learning/
├── College_Tutor_Backend/     # Node.js/TypeScript REST API
├── College_Tutor_Frontend/    # TypeScript frontend application
├── images/                    # Static assets / screenshots
└── DB.sql                     # MySQL database schema
```

---

## 🗄️ Database Schema

The MySQL database (`SkillSwap`) includes the following tables:

| Table | Description |
|---|---|
| `College` | Registered colleges with their email domains |
| `Students` | Student accounts linked to a college |
| `specializations` | Master list of available skills/subjects |
| `student_specializations` | Skills a student has, with a proficiency rating |
| `availability_status` | Whether a student is currently available |
| `chat_rooms` | One-on-one chat sessions between two students |
| `messages` | Messages sent within a chat room |
| `video_call_sessions` | Video call records tied to chat rooms |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, HTML/CSS |
| Backend | Node.js, TypeScript |
| Database | MySQL |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL (v8+)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/nixme1122004/Skill_Swap_For_Student_Learning.git
cd Skill_Swap_For_Student_Learning
```

### 2. Set up the database

```bash
mysql -u root -p < DB.sql
```

This creates the `SkillSwap` database and all required tables.

### 3. Configure the backend

```bash
cd College_Tutor_Backend
npm install
```

Create a `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=SkillSwap
PORT=3000
```

Start the backend:

```bash
npm run dev
```

### 4. Set up the frontend

```bash
cd ../College_Tutor_Frontend
npm install
npm run dev
```

The app should now be running at `http://localhost:5173` (or whichever port your frontend framework uses).

### 5. Deploy with Docker Compose

A full end-to-end deployment is available using Docker Compose.

1. Install Docker Desktop (or Docker Engine) on your machine.
2. From the repository root, run:

```bash
docker compose up --build
```

3. When the services are ready:
   - Frontend: `http://localhost:4173`
   - Backend: `http://localhost:5000`
   - MySQL port: `3306`

4. To stop the deployment:

```bash
docker compose down
```

If you need to change the backend URL for the frontend, update `docker-compose.yml` or pass a different `VITE_BACKEND_URL` build argument.

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to your branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source. See the repository for details.

---

## 👤 Author

**Nithesh** — [@nixme1122004](https://github.com/nixme1122004)
**Akhilesh** — [akhilesh0809](https://github.com/akhilesh0809)
