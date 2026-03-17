# YouTube Mini App

A backend service for a YouTube mini application, providing features such as video details, channel information, and comment management. This project supports both SQL and MongoDB for data storage and uses Google OAuth 2.0 for authentication.

## 🌐 Live Demo & Backend

- 🚀 **Live App:** https://youtube-mini-app-p93f.onrender.com/  
- 🔧 **Backend Repository:** https://github.com/harmeet773/youtube-mini-app
- 🔧 **Frontend Repository:** https://github.com/harmeet773/frontend-of-youtube-mini-app


## 🚀 Features

- **YouTube Integration**: Fetch home videos, channel details, and video comments.
- **Comment Management**: Add, edit, delete, and reply to comments.
- **Rating System**: Like and dislike videos and comments.
- **Authentication**: Secure Google OAuth 2.0 integration with JWT-based session handling.
- **Multi-Database Support**: Configurable support for MongoDB, Local SQL, or Remote SQL (TiDB).
- **CORS Support**: Configurable allowed origins for frontend communication.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js (Google OAuth 2.0, JWT, Local)
- **Database**: 
  - **NoSQL**: MongoDB (via Mongoose)
  - **SQL**: MySQL/PostgreSQL (via Sequelize)
- **Tools**: Axios, Bcrypt, Dotenv, Nodemon

## 📂 Project Structure

```text
├── config/             # Database and Passport configurations
├── controllers/        # Business logic for YouTube and auth
├── models/             # Mongoose and Sequelize models
├── routes/             # Express route definitions
├── views/              # EJS templates (if applicable)
├── public/             # Static assets
├── server.js           # Main entry point
└── .env                # Environment variables configuration
```

## ⚙️ Setup and Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harmeet773/Express-ejs-Boilerplate.git
   cd youtube-mini-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and configure the following:

   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret
   STATE_SECRET=your_state_encryption_secret

   # Auth Redirects
   LOCAL_FRONTEND=http://localhost:5173
   PUBLIC_FRONTEND=your_deployed_frontend_url
   ALLOWED_ORIGINS=http://localhost:5173,https://your-app.com

   # Database Selection
   USE_LOCAL_MONGODB=true
   USE_LOCAL_SQL=false
   USE_REMOTE_SQL=false

   # MongoDB
   MONGODB_CONNECTION_STRING=

   # SQL Config (if used)
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASS=your_db_pass
   DB_HOST=localhost
   DB_PORT=3306
   DB_DIALECT=mysql

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Run the application**:
   - For development: `npm run dev`
   - For production: `npm start`

## 📡 API Endpoints

### Authentication
- `GET /auth/google`: Initiate Google OAuth flow.
- `GET /auth/google/callback`: OAuth callback handler.
- `GET /auth/logout`: Log out the user.

### YouTube Data
- `GET /api/`: Get home page video.
- `GET /api/video/:videoId`: Get details of a specific video.
- `GET /api/channel/:channelId`: Get channel details.
- `GET /api/channel-videos`: Get videos from a specific channel.
- `GET /api/video/:videoId/comments`: Get comments for a video.

### Interactions (Requires Auth)
- `POST /api/add-comment`: Add a new comment.
- `POST /api/edit-comment`: Edit an existing comment.
- `POST /api/delete-comment`: Delete a comment.
- `POST /api/reply-comment`: Reply to a comment.
- `POST /api/video-rating`: Like/Dislike a video.
- `POST /api/comment-rating`: Like/Dislike a comment.

### System
- `GET /api/serverStatus`: Check server health.
- `GET /api/getUserProfile`: Get current user's profile information.

