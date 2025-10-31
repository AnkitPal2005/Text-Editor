# DocuCollab - Modern Collaborative Document Editor

A beautiful, real-time collaborative document editor built with the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.IO. Features a modern UI with dark/light themes, real-time collaboration, and comprehensive document management.

## Features

### Core Features
- **Real-time Collaboration** - Multiple users can edit documents simultaneously
- **Rich Text Editor** - Full-featured editor with formatting, lists, links, and more
- **Smart Comments** - Add contextual comments with real-time updates
- **Version History** - Track changes and restore previous versions
- **Document Sharing** - Share documents with view/edit permissions
- **PDF Export** - Export documents to PDF format

### Modern UI/UX
- **Beautiful Design** - Clean, modern interface with smooth animations
- **Dark/Light Themes** - Seamless theme switching with system preference detection
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Loading States** - Smooth loading indicators and error handling
- **Search & Filter** - Find documents quickly with advanced filtering
- **Grid/List Views** - Choose your preferred document layout

### Security & Authentication
- **Secure Authentication** - JWT-based auth with password strength validation
- **Protected Routes** - Role-based access control
- **Input Validation** - Comprehensive form validation and error handling
- **Password Security** - Bcrypt hashing with strength indicators

## Tech Stack

### Frontend
- **React 19** - Latest React with modern hooks and features
- **Vite** - Lightning-fast build tool and dev server
- **React Router DOM** - Client-side routing
- **React Quill** - Rich text editor component
- **Socket.IO Client** - Real-time communication
- **Modern CSS** - Custom CSS with CSS variables and animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **PDFKit** - PDF generation

## Quick Start

### Prerequisites
- Node.js (v18 or later)
- MongoDB (v6 or later)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd googleDocs
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend/frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/docucollab
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

### Running the Application

1. **Start MongoDB**
   Make sure MongoDB is running on your system

2. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start the frontend development server**
   ```bash
   cd frontend/frontend
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
DocuCollab/
├── backend/                 # Backend server
│   ├── middleware/         # Custom middleware (auth, etc.)
│   ├── models/            # MongoDB models
│   │   ├── User.js        # User model
│   │   ├── Document.js    # Document model
│   │   └── Comment.js     # Comment model
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   ├── document.js    # Document CRUD routes
│   │   └── comment.js     # Comment routes
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main server file
│
└── frontend/frontend/       # Frontend React application
    ├── public/             # Static files
    ├── src/
    │   ├── auth/          # Authentication components
    │   │   ├── login.jsx  # Login form
    │   │   └── signup.jsx # Registration form
    │   ├── component/     # Reusable components
    │   │   ├── ThemeToggle.jsx    # Theme switcher
    │   │   └── CommentPanel.jsx   # Comments sidebar
    │   ├── routes/        # Main application routes
    │   │   ├── Dashboard.jsx      # Document dashboard
    │   │   ├── Editor.jsx         # Document editor
    │   │   ├── router.jsx         # Route configuration
    │   │   └── ThemeContext.jsx   # Theme context provider
    │   ├── styles/        # CSS stylesheets
    │   │   ├── AuthForm.css       # Authentication styling
    │   │   ├── Dashboard.css      # Dashboard styling
    │   │   ├── Editor.css         # Editor styling
    │   │   ├── CommentPanel.css   # Comments styling
    │   │   ├── ThemeToggle.css    # Theme toggle styling
    │   │   └── Failed404.css      # 404 page styling
    │   ├── App.jsx        # Main App component
    │   ├── main.jsx       # Entry point
    │   └── index.css      # Global styles
    └── package.json       # Frontend dependencies
```

## Available Scripts

### Backend
```bash
npm run dev     # Start development server with nodemon
npm start       # Start production server
```

### Frontend
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user

### Documents
- `GET /docs/list/:ownerId` - Get all documents for a user
- `POST /docs/create` - Create a new document
- `GET /docs/getdata/:id` - Get document content
- `PUT /docs/:id` - Update document content
- `DELETE /docs/:id` - Delete a document
- `POST /docs/share/:id` - Generate shareable link
- `GET /docs/:id/export/pdf` - Export document as PDF
- `GET /docs/:id/versions` - Get document version history
- `POST /docs/:id/restore/:versionId` - Restore document version

### Comments
- `GET /api/comments/:docId/:sectionId` - Get comments for a document section
- `POST /api/comments` - Create a new comment
- `PATCH /api/comments/resolve/:id` - Resolve (delete) a comment

## UI Improvements Made

### Authentication Pages
- **Modern split-screen design** with illustration and form
- **Advanced form validation** with real-time feedback
- **Password strength indicator** for registration
- **Loading states** and error handling
- **Responsive design** for all screen sizes

### Dashboard
- **Clean, card-based layout** for documents
- **Search and filtering** functionality
- **Grid/List view toggle** for different preferences
- **Improved document actions** with better UX
- **Loading states** and empty states
- **Better responsive design**

### Editor
- **Modern toolbar** with better organization
- **Improved comment panel** with user avatars and timestamps
- **Better version history** interface
- **Responsive editor** that works on mobile
- **Auto-save indicators** and better feedback

### General Improvements
- **Consistent theming** with CSS variables
- **Smooth animations** and transitions
- **Better error handling** throughout the app
- **Improved accessibility** with proper ARIA labels
- **Modern 404 page** with helpful navigation

## Bug Fixes

- Fixed duplicate Router components in main.jsx
- Improved theme toggle positioning and styling
- Fixed comment panel API endpoints
- Added proper error handling for all API calls
- Improved form validation and user feedback
- Fixed responsive design issues
- Added loading states for better UX

## Key Features Showcase

### Real-time Collaboration
Documents update in real-time as multiple users edit simultaneously, with conflict resolution and smooth synchronization.

### Modern Theme System
Seamless dark/light theme switching with system preference detection and persistent storage.

### Advanced Document Management
Create, edit, share, and organize documents with powerful search, filtering, and sorting capabilities.

### Rich Text Editing
Full-featured editor with formatting options, lists, links, images, and more.

### Smart Comments
Contextual commenting system with real-time updates and user management.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/) - UI library
- [MongoDB](https://www.mongodb.com/) - Database
- [Express](https://expressjs.com/) - Backend framework
- [Node.js](https://nodejs.org/) - Runtime environment
- [Socket.IO](https://socket.io/) - Real-time communication
- [React Quill](https://quilljs.com/) - Rich text editor
- [Vite](https://vitejs.dev/) - Build tool

---

**Built for modern collaborative document editing**
