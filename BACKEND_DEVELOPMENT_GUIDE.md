# 🔧 Backend Development Guide
## Career Development and Incubation Hub Management System

This guide provides comprehensive specifications for developing the backend API to support the frontend React application. All current functionality uses mock data that needs to be replaced with real API endpoints.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Recommendations](#technology-recommendations)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [File Upload Requirements](#file-upload-requirements)
- [Real-time Features](#real-time-features)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Testing Requirements](#testing-requirements)
- [Deployment Specifications](#deployment-specifications)

---

## 🎯 Overview

The frontend application currently uses mock data stored in `app/mock/sampleData.ts`. Your task is to create a backend API that provides the same data structure and functionality through RESTful endpoints.

### Current Mock Data Structure
- **Teams/Incubators**: 2 teams with members and credentials
- **Projects**: 2 projects with categories and file uploads
- **Mentors**: 2 mentors with team assignments
- **Managers**: 1 manager with team management
- **Inventory**: Tools with assignment tracking
- **Requests**: Material requests with status tracking
- **Messages**: Real-time chat conversations
- **Notifications**: System notifications with read status
- **Announcements**: System-wide announcements

### Key Requirements
- **RESTful API**: JSON-based endpoints
- **Authentication**: JWT-based with role-based access
- **File Upload**: Support for documents and images
- **Real-time**: WebSocket support for messaging
- **Database**: Relational database (PostgreSQL recommended)
- **CORS**: Configured for frontend domain

---

## 🛠️ Technology Recommendations

### Backend Framework
- **Node.js + Express.js** or **Python + FastAPI/Django**
- **TypeScript** (if using Node.js) for type safety
- **JWT** for authentication
- **bcrypt** for password hashing

### Database
- **PostgreSQL** (recommended) or **MySQL**
- **Prisma** or **TypeORM** (Node.js) / **SQLAlchemy** (Python) for ORM
- **Redis** for session management and caching

### File Storage
- **AWS S3** or **Google Cloud Storage** for file uploads
- **Multer** (Node.js) or equivalent for file handling

### Real-time Communication
- **Socket.io** (Node.js) or **WebSockets** implementation
- **Redis** for message persistence and scaling

### Additional Tools
- **Joi** or **Zod** for request validation
- **Helmet** for security headers
- **CORS** middleware
- **Morgan** for request logging

---

## 🗄️ Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('director', 'manager', 'mentor', 'incubator') NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Teams Table
```sql
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    status ENUM('active', 'pending', 'inactive') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Team Members Table
```sql
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role ENUM('team_leader', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);
```

#### 4. Projects Table
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    status ENUM('active', 'pending', 'completed', 'on_hold') DEFAULT 'pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Project Files Table
```sql
CREATE TABLE project_files (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Mentors Table
```sql
CREATE TABLE mentors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expertise VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Mentor Assignments Table
```sql
CREATE TABLE mentor_assignments (
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER REFERENCES mentors(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mentor_id, team_id)
);
```

#### 8. Inventory Items Table
```sql
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    status ENUM('available', 'low_stock', 'out_of_stock') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. Inventory Assignments Table
```sql
CREATE TABLE inventory_assignments (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP NULL
);
```

#### 10. Material Requests Table
```sql
CREATE TABLE material_requests (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    requested_by INTEGER REFERENCES users(id),
    reviewed_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL
);
```

#### 11. Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type ENUM('text', 'file') DEFAULT 'text',
    file_path VARCHAR(500) NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 12. Conversations Table
```sql
CREATE TABLE conversations (
    id VARCHAR(255) PRIMARY KEY,
    participants JSON NOT NULL, -- Array of user IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 13. Notifications Table
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_type ENUM('team', 'user') NOT NULL,
    recipient_id INTEGER NOT NULL, -- team_id or user_id
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 14. Announcements Table
```sql
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "user_id": 123,
  "email": "user@example.com",
  "role": "manager",
  "team_id": 456, // Only for incubator role
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Authentication Endpoints

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "manager",
    "team_id": null
  }
}
```

#### POST /api/auth/logout
- Invalidate JWT token
- Clear session data

#### GET /api/auth/me
- Return current user information
- Requires valid JWT token

### Role-Based Middleware
Implement middleware to check user roles and permissions:

```javascript
// Example middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

---

## 🌐 API Endpoints

### 1. Teams Management

#### GET /api/teams
- **Access**: Director, Manager
- **Query Parameters**: 
  - `status` (optional): Filter by status
  - `search` (optional): Search by team name
  - `page` (optional): Pagination
  - `limit` (optional): Items per page

#### POST /api/teams
- **Access**: Manager
- **Body**:
```json
{
  "team_name": "InnovateX Team",
  "company_name": "InnovateX Solutions",
  "credentials": {
    "email": "team@example.com",
    "password": "Team123"
  }
}
```

#### GET /api/teams/:id
- **Access**: Director, Manager, Mentor (assigned), Incubator (own team)

#### PUT /api/teams/:id
- **Access**: Manager, Incubator (own team)

#### DELETE /api/teams/:id
- **Access**: Manager

#### GET /api/teams/:id/members
- **Access**: Director, Manager, Mentor (assigned), Incubator (own team)

#### POST /api/teams/:id/members
- **Access**: Incubator (own team)
- **Body**:
```json
{
  "name": "New Member",
  "email": "member@example.com"
}
```

#### PUT /api/teams/:id/members/:memberId
- **Access**: Incubator (own team)

#### DELETE /api/teams/:id/members/:memberId
- **Access**: Incubator (own team)

### 2. Projects Management

#### GET /api/projects
- **Access**: All roles (filtered by permissions)
- **Query Parameters**:
  - `category` (optional): Filter by category
  - `status` (optional): Filter by status
  - `team_id` (optional): Filter by team
  - `search` (optional): Search by name

#### POST /api/projects
- **Access**: Incubator
- **Body**:
```json
{
  "name": "Project Name",
  "description": "Project description",
  "category": "Technology",
  "status": "active"
}
```

#### GET /api/projects/:id
- **Access**: All roles (based on team assignment)

#### PUT /api/projects/:id
- **Access**: Incubator (own team), Manager, Director

#### DELETE /api/projects/:id
- **Access**: Incubator (own team), Manager, Director

#### POST /api/projects/:id/files
- **Access**: Incubator (own team)
- **Content-Type**: multipart/form-data
- **Body**: File upload

#### GET /api/projects/:id/files
- **Access**: All roles (based on team assignment)

#### DELETE /api/projects/:id/files/:fileId
- **Access**: Incubator (own team)

### 3. Mentors Management

#### GET /api/mentors
- **Access**: Director, Manager

#### POST /api/mentors
- **Access**: Director, Manager
- **Body**:
```json
{
  "name": "Dr. Smith",
  "email": "smith@university.edu",
  "expertise": "Energy Systems",
  "phone": "123-456-7890"
}
```

#### GET /api/mentors/:id
- **Access**: Director, Manager, Incubator (assigned mentor)

#### PUT /api/mentors/:id
- **Access**: Director, Manager

#### DELETE /api/mentors/:id
- **Access**: Director, Manager

#### POST /api/mentors/:id/assign
- **Access**: Director, Manager
- **Body**:
```json
{
  "team_id": 123
}
```

#### DELETE /api/mentors/:id/assign/:teamId
- **Access**: Director, Manager

### 4. Inventory Management

#### GET /api/inventory
- **Access**: Director, Manager, Incubator (assigned items)

#### POST /api/inventory
- **Access**: Manager
- **Body**:
```json
{
  "name": "3D Printer",
  "description": "High-quality 3D printer",
  "total_quantity": 5,
  "status": "available"
}
```

#### GET /api/inventory/:id
- **Access**: Director, Manager, Incubator (assigned)

#### PUT /api/inventory/:id
- **Access**: Manager

#### DELETE /api/inventory/:id
- **Access**: Manager

#### POST /api/inventory/:id/assign
- **Access**: Manager
- **Body**:
```json
{
  "team_id": 123,
  "quantity": 2
}
```

#### DELETE /api/inventory/:id/assign/:teamId
- **Access**: Manager

### 5. Material Requests

#### GET /api/requests
- **Access**: Manager, Incubator (own team)

#### POST /api/requests
- **Access**: Incubator
- **Body**:
```json
{
  "item_name": "Coffee Maker",
  "description": "Need coffee maker for team meetings"
}
```

#### GET /api/requests/:id
- **Access**: Manager, Incubator (own team)

#### PUT /api/requests/:id/status
- **Access**: Manager
- **Body**:
```json
{
  "status": "approved",
  "notes": "Approved with conditions"
}
```

### 6. Messaging System

#### GET /api/conversations
- **Access**: All roles (filtered by permissions)

#### POST /api/conversations
- **Access**: All roles
- **Body**:
```json
{
  "participants": [123, 456]
}
```

#### GET /api/conversations/:id/messages
- **Access**: Conversation participants

#### POST /api/conversations/:id/messages
- **Access**: Conversation participants
- **Body**:
```json
{
  "content": "Hello!",
  "message_type": "text"
}
```

#### POST /api/conversations/:id/messages/file
- **Access**: Conversation participants
- **Content-Type**: multipart/form-data

### 7. Notifications

#### GET /api/notifications
- **Access**: Manager (sent), Incubator (received)

#### POST /api/notifications
- **Access**: Manager
- **Body**:
```json
{
  "title": "Important Update",
  "message": "Please check your project status",
  "recipient_type": "team",
  "recipient_id": 123
}
```

#### PUT /api/notifications/:id/read
- **Access**: Incubator (recipient)

#### DELETE /api/notifications/:id
- **Access**: Manager (sender)

### 8. Announcements

#### GET /api/announcements
- **Access**: All roles

#### POST /api/announcements
- **Access**: Director, Manager
- **Body**:
```json
{
  "title": "System Maintenance",
  "content": "System will be down for maintenance"
}
```

#### GET /api/announcements/:id
- **Access**: All roles

#### PUT /api/announcements/:id
- **Access**: Director, Manager

#### DELETE /api/announcements/:id
- **Access**: Director, Manager

### 9. Reports & Analytics

#### GET /api/reports/teams
- **Access**: Director, Manager
- **Query Parameters**:
  - `category` (optional): Filter by project category
  - `status` (optional): Filter by team status

#### GET /api/reports/inventory
- **Access**: Director, Manager

#### GET /api/reports/projects
- **Access**: Director, Manager, Mentor (assigned teams)

#### POST /api/reports/export
- **Access**: Director, Manager
- **Body**:
```json
{
  "report_type": "teams",
  "filters": {
    "category": "Technology",
    "status": "active"
  }
}
```

### 10. Dashboard Analytics

#### GET /api/dashboard/analytics
- **Access**: All roles (filtered by permissions)
- **Response**:
```json
{
  "summary": {
    "total_teams": 10,
    "total_projects": 25,
    "total_inventory": 150,
    "total_requests": 15
  },
  "charts": {
    "project_categories": [...],
    "inventory_assignment": [...]
  }
}
```

---

## 📁 File Upload Requirements

### File Storage Configuration
- **Storage Provider**: AWS S3 or Google Cloud Storage
- **File Types**: Images (jpg, png, gif), Documents (pdf, doc, docx, txt)
- **Size Limits**: 10MB per file
- **Security**: Signed URLs for secure uploads

### File Upload Endpoints

#### POST /api/upload
- **Access**: Authenticated users
- **Content-Type**: multipart/form-data
- **Response**:
```json
{
  "success": true,
  "file_url": "https://storage.example.com/files/filename.pdf",
  "file_name": "filename.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf"
}
```

### File Management
- Implement file cleanup for deleted projects
- Generate thumbnails for images
- Validate file types and sizes
- Implement virus scanning (optional)

---

## ⚡ Real-time Features

### WebSocket Events

#### Connection
```javascript
// Client connects with JWT token
socket.emit('authenticate', { token: 'jwt_token' });
```

#### Message Events
```javascript
// New message
socket.emit('new_message', {
  conversation_id: 'conv_123',
  content: 'Hello!',
  sender_id: 123
});

// Message received
socket.on('message_received', (data) => {
  // Handle new message
});
```

#### Notification Events
```javascript
// New notification
socket.emit('new_notification', {
  recipient_id: 123,
  notification: { ... }
});

// Notification received
socket.on('notification_received', (data) => {
  // Handle new notification
});
```

### WebSocket Rooms
- Create rooms for each conversation
- Join users to appropriate rooms based on permissions
- Handle user disconnections gracefully

---

## 🔗 Integration Points

### Frontend Integration
The frontend expects these response formats:

#### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

#### Paginated Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### CORS Configuration
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## ❌ Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

### Error Response Structure
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED`
- `INSUFFICIENT_PERMISSIONS`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_ERROR`
- `FILE_UPLOAD_ERROR`
- `DATABASE_ERROR`

---

## 🔒 Security Considerations

### Authentication Security
- Use bcrypt for password hashing (cost factor 12)
- Implement JWT token expiration (24 hours)
- Use refresh tokens for extended sessions
- Implement rate limiting on auth endpoints

### Data Protection
- Validate all input data
- Sanitize user inputs
- Use parameterized queries
- Implement SQL injection protection

### File Upload Security
- Validate file types and sizes
- Scan uploaded files for malware
- Store files outside web root
- Use signed URLs for secure access

### API Security
- Implement rate limiting
- Use HTTPS in production
- Add security headers (Helmet)
- Log security events

---

## 🧪 Testing Requirements

### Unit Tests
- Test all API endpoints
- Test authentication and authorization
- Test data validation
- Test error handling

### Integration Tests
- Test database operations
- Test file upload functionality
- Test WebSocket connections
- Test role-based access

### API Testing
- Use Postman or similar tool
- Test all endpoints with different roles
- Test error scenarios
- Test pagination and filtering

### Performance Testing
- Test with multiple concurrent users
- Test file upload performance
- Test database query performance
- Test WebSocket scalability

---

## 🚀 Deployment Specifications

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/incubation_db

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# File Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# Redis (for sessions and caching)
REDIS_URL=redis://localhost:6379
```

### Production Checklist
- [ ] HTTPS enabled
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] File storage configured
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 📞 Support & Communication

### Development Phases
1. **Phase 1**: Core API endpoints (teams, projects, mentors)
2. **Phase 2**: File upload and inventory management
3. **Phase 3**: Messaging and notifications
4. **Phase 4**: Reports and analytics
5. **Phase 5**: Real-time features and optimization

### Communication Channels
- **GitHub Issues**: For bug reports and feature requests
- **Pull Requests**: For code reviews and integration
- **Documentation**: Keep API documentation updated
- **Testing**: Share test results and coverage reports

### Integration Timeline
- **Week 1-2**: Core endpoints and authentication
- **Week 3-4**: File upload and inventory
- **Week 5-6**: Messaging and notifications
- **Week 7-8**: Reports and real-time features
- **Week 9-10**: Testing, optimization, and deployment

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] All mock data replaced with real API endpoints
- [ ] Authentication and authorization working
- [ ] File upload functionality implemented
- [ ] Real-time messaging operational
- [ ] Role-based access control enforced
- [ ] All CRUD operations functional

### Performance Requirements
- [ ] API response time < 200ms for most endpoints
- [ ] File upload support up to 10MB
- [ ] Support for 100+ concurrent users
- [ ] Database queries optimized
- [ ] Proper indexing implemented

### Security Requirements
- [ ] JWT authentication secure
- [ ] Input validation implemented
- [ ] SQL injection protection
- [ ] File upload security
- [ ] Rate limiting enabled

---

**Good luck with the backend development! 🚀**

This guide provides everything needed to build a robust, scalable backend that will seamlessly integrate with the frontend application. Feel free to reach out with any questions or clarifications needed during development. 