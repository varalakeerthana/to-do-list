# 📝 Todo List Web Application

A full-stack Todo List application that helps users manage daily tasks efficiently. Users can create, update, complete, and delete tasks through a simple and responsive interface.

## Features

- Add new tasks
- Edit existing tasks
- Mark tasks as completed
- Delete tasks
- Store tasks in PostgreSQL database
- Responsive user interface

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

## Project Structure

```txt
todo-list/
│
├── client/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── server/
│   ├── server.js
│   ├── db.js
│   ├── .env
│   └── routes/
│
├── database.sql
├── package.json
└── README.md
```

## Installation & Setup

### Clone Repository

```bash
git clone <your-repository-link>
cd todo-list
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file inside the `server` folder.

Example:

```env
DATABASE_URL=your_database_connection_string
PORT=3000
```

### Run Project

```bash
node server/server.js
```

## API Functionality

- GET tasks
- POST new task
- PUT update task
- DELETE task

## Learning Outcomes

This project helped me learn:

- CRUD Operations
- REST APIs
- Backend development with Express.js
- PostgreSQL database integration
- Frontend & backend communication

## Future Improvements

- User Authentication
- Task Categories
- Due Dates & Reminders
- Deployment

## Author

Keerthana
