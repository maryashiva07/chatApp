# 💬 Real-Time Chat Application

A full-stack **real-time chat application** built with **Node.js, Express.js, MySQL, Sequelize, Redis, Socket.IO, and Google Gemini AI**.

The application supports private one-to-one messaging, group conversations, real-time notifications, unread message counts, media sharing, emoji support, Redis caching, AI-powered typing suggestions, and smart replies.

---

## 🚀 Features

### 🔐 Authentication

- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Persistent login using localStorage

### 💬 One-to-One Chat

- Real-time private messaging
- Message history
- Sender and receiver support
- Online communication using Socket.IO
- Automatic chat ordering based on recent activity
- Message seen status
- WhatsApp-style message ticks

### 👥 Group Chat

- Create groups
- Add multiple users to groups
- Real-time group messaging
- Group member information
- Group message notifications
- Group unread message counts
- Automatic Socket.IO group joining

### 🔔 Unread Messages

- Individual unread message counts
- Group unread message counts
- Automatic unread count update
- Messages are marked as seen when the chat is opened
- Unread chats can be moved to the top

### 📎 Media Sharing

Users can send:

- Images
- Videos
- PDF files
- DOC/DOCX files
- TXT files
- ZIP/RAR files

Media files are uploaded to the backend and displayed directly inside the chat where supported.

### 😊 Emoji Support

- Integrated emoji picker
- Insert emojis at the cursor position
- Works naturally with the message input
- Supports normal text + emojis together

### 🤖 AI-Powered Chat Suggestions

Google Gemini is integrated to provide AI-assisted communication.


#### Smart Replies

When a new message is received, the application can generate short replies.

Example:

Incoming:
Are you coming to the meeting?

AI:
Yes, I'll be there.
Running late, will join soon.
Can we reschedule?

AI responses are generated using Gemini and constrained to short, relevant conversational responses.

### ⚡ Redis

Redis is used for improving application performance.

Possible uses include:

- Message caching
- Frequently requested chat data
- Reducing repeated database queries
- Temporary application data
- Cache invalidation when new messages are created

### 🗄️ Chat Archiving

To prevent the active chat table from growing indefinitely, older messages can be moved to an archive table.

The application can:

1. Find messages older than the configured retention period.
2. Copy them to `ArchivedChat`.
3. Remove them from the active `Chat` table.
4. Run the process automatically using a cron job.

This keeps the active chat table smaller and improves query performance.

### 🔄 Real-Time Communication

Socket.IO is used for real-time events such as:

new_message
group_message
join_room
join_group
group_created
group_invite

This allows users to receive messages without manually refreshing the page.

---

# 🛠️ Tech Stack

## Frontend

- HTML
- CSS3
- JavaScript
- Emoji Picker Element
- Socket.IO Client
- Fetch API
- LocalStorage

## Backend

- Node.js
- Express.js
- Socket.IO
- JWT
- bcrypt
- Multer
- Cron

## Database

- MySQL
- Sequelize ORM

## Caching

- Redis

## Artificial Intelligence

- Google Gemini API
- Gemini Flash-Lite model

## Development Tools

- Git
- GitHub
- VS Code
- Postman
- npm

---

# 🗄️ Message Archiving

As the number of messages increases, keeping every message inside the active chat table can eventually increase query and maintenance costs.

The archiving system separates older messages from active conversations.

Example:

ChatMessage
     │
     │ older messages
     ↓
ArchivedChat

A cron job can execute the archive process periodically.

Example:

const archiveJob = new CronJob(
    "0 0 * * *",
    archiveOldChats,
    null,
    true,
    "Asia/Kolkata"
);

This runs the archive process every day at midnight IST.

---

# 🧠 Application Architecture


                    ┌───────────────┐
                    │    Browser    │
                    │ HTML/CSS/JS   │
                    └───────┬───────┘
                            │
                  HTTP / Socket.IO
                            │
              ┌─────────────▼─────────────┐
              │       Express Server      │
              │                           │
              │ REST APIs + Socket.IO     │
              └──────┬─────────┬──────────┘
                     │         │
             ┌───────▼───┐ ┌──▼─────────┐
             │   MySQL   │ │   Redis    │
             │ Sequelize │ │   Cache    │
             └───────────┘ └────────────┘
                     │
              ┌──────▼────────┐
              │ Gemini AI API │
              └───────────────┘

---

# 🔄 Typical Message Flow

### Sending a personal message

```text
User types message
        ↓
Frontend
        ↓
POST /api/messages
        ↓
Express Controller
        ↓
Sequelize
        ↓
MySQL
        ↓
Socket.IO event
        ↓
Receiver
        ↓
Message displayed


### Redis

Frequently accessed data can be cached instead of repeatedly querying MySQL.

### Database Indexing

Frequently queried fields such as:

userId
receiverId
createdAt
groupId

should be indexed as the dataset grows.

### Message Archiving

Old messages can be moved from the active table to `ArchivedChat`.

### Socket.IO

Real-time updates eliminate unnecessary polling requests.

---

# 🛡️ Security

The application includes:

- JWT authentication
- Password hashing with bcrypt
- Protected API endpoints
- Authorization headers
- Input validation
- HTML escaping on the frontend
- Environment variables for secrets
- Restricted media upload types

---

# 📱 Responsive UI

The chat interface supports desktop and mobile layouts.
The application switches to a mobile chat view and provides a back button to return to the conversation list.

---

# 📌 Future Improvements

Possible improvements include:

- Message reactions
- Message editing
- Message deletion
- Reply to specific messages
- Forward messages
- Voice messages
- Audio/video calling
- Typing indicators
- Online/offline presence
- Last seen
- Message delivery status
- Read receipts
- Push notifications
- End-to-end encryption
- Pagination/infinite scrolling
- AI personalization based on user communication style
- AI conversation summaries
- Better Redis caching strategy
- Database partitioning for very large chat datasets

---

# 🎯 Project Highlights

This project demonstrates practical implementation of:

- REST API development
- Authentication and authorization
- Real-time WebSocket communication
- Socket.IO rooms
- One-to-one messaging
- Group messaging
- MySQL database design
- Sequelize ORM
- Redis caching
- Cron jobs
- File uploads
- Responsive frontend development
- AI API integration
- Gemini structured JSON responses
- Unread notification systems
- Message archiving
- Client-side state management

---

# 👨‍💻 Author

**Shiva Kant Marya**

B.Tech Computer Science & Engineering

---

# ⭐ Project Goal

The goal of this project is to build a scalable and modern real-time communication platform while learning how technologies such as **Node.js, Express.js, MySQL, Sequelize, Redis, Socket.IO, and Generative AI** work together in a production-style application.
