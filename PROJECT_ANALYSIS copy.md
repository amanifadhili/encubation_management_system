# 🚀 Incubation Management System - Full Stack Development Guide

## 📋 Executive Summary

The **Incubation Management System** is a sophisticated full-stack web application designed for educational institutions to manage student incubation programs, mentorship, and resource allocation. Built with modern web technologies, it provides role-based access control for Directors, Managers, Mentors, and Incubator Teams to collaborate on innovative projects.

**Tech Stack:**
- **Frontend**: React 19.1.0 + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js + TypeScript
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer + Cloudinary
- **Real-time**: Socket.io
- **PDF Generation**: jsPDF (client-side)

## 🏗️ Project Architecture

### Directory Structure
```
encubation_management_system/
├── encubation_frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── context/         # React Context providers
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   └── tailwind.config.js
├── encubation_backend/                 # Express.js Backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   └── config/          # Configuration files
│   ├── uploads/             # File uploads directory
│   ├── package.json
│   └── .env
├── database/                # Database files
│   ├── migrations/           # Database migrations
│   ├── seeders/             # Database seeders
│   └── schema.sql           # Database schema
└── docs/                    # Documentation
```

## 🗄️ Database Schema (MySQL)

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('director', 'manager', 'mentor', 'incubator') NOT NULL,
  team_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);
```

#### Teams Table
```sql
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  team_leader_id INT,
  mentor_id INT,
  status ENUM('Active', 'Pending', 'Completed') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_leader_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Team Members Table
```sql
CREATE TABLE team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(100) DEFAULT 'Member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_member (team_id, user_id)
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  team_id INT NOT NULL,
  description TEXT,
  status ENUM('Active', 'Pending', 'Completed') DEFAULT 'Active',
  category ENUM('Technology', 'Agriculture', 'Health', 'Education', 'Design') NOT NULL,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

#### Project Files Table
```sql
CREATE TABLE project_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Inventory Items Table
```sql
CREATE TABLE inventory_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 0,
  status ENUM('available', 'unavailable') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Inventory Assignments Table
```sql
CREATE TABLE inventory_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  team_id INT NOT NULL,
  quantity INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Material Requests Table
```sql
CREATE TABLE material_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  note TEXT,
  status ENUM('Requested', 'Approved', 'Declined', 'Given') DEFAULT 'Requested',
  requested_by INT NOT NULL,
  reviewed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  file_path VARCHAR(500) NULL,
  file_name VARCHAR(255) NULL,
  reply_to_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NULL,
  type ENUM('direct', 'group') DEFAULT 'direct',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Conversation Participants Table
```sql
CREATE TABLE conversation_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (conversation_id, user_id)
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_id INT NOT NULL,
  sender_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Announcements Table
```sql
CREATE TABLE announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔐 Authentication & Authorization System

### JWT Implementation
```typescript
// Backend - JWT Service
interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  teamId?: number;
}

// Generate JWT token
const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
};

// Verify JWT token
const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};
```

### Authentication Middleware
```typescript
// backend/src/middleware/auth.ts
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Role-based authorization
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
```

## 🚀 Backend Development (Express.js + MySQL)

### Package.json Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "sequelize": "^6.32.1",
    "sequelize-cli": "^6.6.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.40.0",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "joi": "^17.9.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.0",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/bcryptjs": "^2.4.2",
    "@types/multer": "^1.4.7",
    "typescript": "^5.1.6",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1"
  }
}
```

### API Routes Structure

#### Authentication Routes
```typescript
// backend/src/routes/auth.ts
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
```

#### Team Routes
```typescript
// backend/src/routes/teams.ts
router.get('/', authenticate, authorize(['director', 'manager']), teamController.getAllTeams);
router.get('/:id', authenticate, teamController.getTeam);
router.post('/', authenticate, authorize(['manager']), teamController.createTeam);
router.put('/:id', authenticate, authorize(['manager']), teamController.updateTeam);
router.delete('/:id', authenticate, authorize(['manager']), teamController.deleteTeam);
router.post('/:id/members', authenticate, teamController.addMember);
router.delete('/:id/members/:userId', authenticate, teamController.removeMember);
```

#### Project Routes
```typescript
// backend/src/routes/projects.ts
router.get('/', authenticate, projectController.getAllProjects);
router.get('/:id', authenticate, projectController.getProject);
router.post('/', authenticate, authorize(['incubator']), projectController.createProject);
router.put('/:id', authenticate, projectController.updateProject);
router.delete('/:id', authenticate, authorize(['incubator']), projectController.deleteProject);
router.post('/:id/files', authenticate, upload.array('files'), projectController.uploadFiles);
router.delete('/:id/files/:fileId', authenticate, projectController.deleteFile);
```

#### Inventory Routes
```typescript
// backend/src/routes/inventory.ts
router.get('/', authenticate, inventoryController.getAllItems);
router.get('/:id', authenticate, inventoryController.getItem);
router.post('/', authenticate, authorize(['manager']), inventoryController.createItem);
router.put('/:id', authenticate, authorize(['manager']), inventoryController.updateItem);
router.delete('/:id', authenticate, authorize(['manager']), inventoryController.deleteItem);
router.post('/:id/assign', authenticate, authorize(['manager']), inventoryController.assignToTeam);
router.delete('/:id/unassign/:teamId', authenticate, authorize(['manager']), inventoryController.unassignFromTeam);
```

### Database Models (Sequelize)

#### User Model
```typescript
// backend/src/models/User.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'director' | 'manager' | 'mentor' | 'incubator';
  public teamId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('director', 'manager', 'mentor', 'incubator'),
    allowNull: false,
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
});
```

#### Team Model
```typescript
// backend/src/models/Team.ts
export class Team extends Model {
  public id!: number;
  public teamName!: string;
  public companyName?: string;
  public teamLeaderId?: number;
  public mentorId?: number;
  public status!: 'Active' | 'Pending' | 'Completed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Team.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  teamName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  teamLeaderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  mentorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Pending', 'Completed'),
    defaultValue: 'Active',
  },
}, {
  sequelize,
  modelName: 'Team',
  tableName: 'teams',
});
```

### Controllers Example

#### Auth Controller
```typescript
// backend/src/controllers/authController.ts
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    });
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

#### Team Controller
```typescript
// backend/src/controllers/teamController.ts
export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const { role, teamId } = req.user;
    let teams;
    
    if (role === 'director') {
      teams = await Team.findAll({
        include: [
          { model: User, as: 'teamLeader' },
          { model: User, as: 'mentor' },
          { model: User, as: 'members' },
        ],
      });
    } else if (role === 'manager') {
      // Get teams managed by this manager
      teams = await Team.findAll({
        where: { managerId: req.user.userId },
        include: [
          { model: User, as: 'teamLeader' },
          { model: User, as: 'mentor' },
          { model: User, as: 'members' },
        ],
      });
    } else if (role === 'mentor') {
      teams = await Team.findAll({
        where: { mentorId: req.user.userId },
        include: [
          { model: User, as: 'teamLeader' },
          { model: User, as: 'members' },
        ],
      });
    } else {
      teams = await Team.findAll({
        where: { id: teamId },
        include: [
          { model: User, as: 'teamLeader' },
          { model: User, as: 'mentor' },
          { model: User, as: 'members' },
        ],
      });
    }
    
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

## 💻 Frontend Development (React + TypeScript + Tailwind)

### Package.json Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "socket.io-client": "^4.7.2",
    "react-query": "^3.39.3",
    "react-hook-form": "^7.45.4",
    "react-hot-toast": "^2.4.1",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.5.31",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.21",
    "@types/react-dom": "^18.2.7",
    "@types/node": "^20.5.0",
    "typescript": "^5.1.6",
    "vite": "^4.4.9",
    "@vitejs/plugin-react": "^4.0.4",
    "tailwindcss": "^3.3.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29"
  }
}
```

### API Service Layer
```typescript
// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Authentication Context
```typescript
// frontend/src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      api.get('/auth/profile')
        .then(response => setUser(response.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Custom Hooks
```typescript
// frontend/src/hooks/useTeams.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';

export const useTeams = () => {
  return useQuery('teams', async () => {
    const response = await api.get('/teams');
    return response.data;
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (teamData: CreateTeamData) => api.post('/teams', teamData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
      },
    }
  );
};
```

### Component Examples

#### Team Management Component
```typescript
// frontend/src/components/TeamManagement.tsx
export const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const { data: teams, isLoading } = useTeams();
  const createTeamMutation = useCreateTeam();
  
  const canModify = user?.role === 'manager';
  
  const handleCreateTeam = (data: CreateTeamData) => {
    createTeamMutation.mutate(data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        {canModify && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Team
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams?.map((team) => (
          <TeamCard key={team.id} team={team} canModify={canModify} />
        ))}
      </div>
    </div>
  );
};
```

#### Project Card Component
```typescript
// frontend/src/components/ProjectCard.tsx
interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
        <span className={clsx(
          'px-2 py-1 rounded-full text-xs font-medium',
          {
            'bg-green-100 text-green-800': project.status === 'Active',
            'bg-yellow-100 text-yellow-800': project.status === 'Pending',
            'bg-gray-100 text-gray-800': project.status === 'Completed',
          }
        )}>
          {project.status}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{project.description}</p>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      
      {(onEdit || onDelete) && (
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

## 🔐 User Roles & Permissions

### 1. Director
- **Access Level**: Full system access
- **Capabilities**:
  - View all teams, projects, and reports
  - Manage mentors and announcements
  - Access comprehensive analytics
  - View all messaging conversations
- **Restrictions**: Cannot send notifications or manage inventory directly

### 2. Manager
- **Access Level**: Operational management
- **Capabilities**:
  - Manage assigned teams (CRUD operations)
  - Approve/decline material requests
  - Send notifications to teams
  - Manage inventory and generate reports
  - Add/edit mentors and assign teams
- **Restrictions**: Limited to assigned teams only

### 3. Mentor
- **Access Level**: Team-specific guidance
- **Capabilities**:
  - View assigned teams and their projects
  - Monitor team project progress
  - Communicate with assigned teams
  - Access team-specific analytics
- **Restrictions**: Cannot manage resources or send notifications

### 4. Incubator (Team)
- **Access Level**: Team-focused operations
- **Capabilities**:
  - Manage team members and projects
  - Request materials from managers
  - View announcements and notifications
  - Communicate with mentors and other teams
  - Update project progress
- **Restrictions**: Limited to own team data only


## 📊 Core Modules & Functionality

### 1. Dashboard & Analytics
**Purpose**: Role-specific overview and metrics dashboard

**Features**:
- Interactive charts using Chart.js
- Project category distribution (Pie chart)
- Inventory assignment visualization (Bar chart)
- Summary cards with key metrics
- Role-filtered data display

### 2. Incubator Management
**Purpose**: Manage student teams and their members

**Features**:
- Add/edit/delete teams (Manager only)
- Team member management
- Team leader assignment
- Credential management
- Status tracking (Active, Pending, Completed)
- Search and pagination
- Detailed team view modal

### 3. Mentor Management
**Purpose**: Manage mentors and their team assignments

**Features**:
- Add/edit/delete mentors (Manager only)
- Team assignment system
- Expertise tracking
- Contact information management
- Assignment visualization
- Search and pagination

### 4. Project Management
**Purpose**: Track team projects and progress

**Features**:
- Create/edit projects (Teams only)
- File upload system (real file handling)
- Progress tracking with sliders
- Category classification (Technology, Agriculture, Health, Education, Design)
- Status management
- Comments system
- Search and filtering

### 5. Material Request System
**Purpose**: Handle resource requests and approvals

**Features**:
- Material request submission (Teams)
- Request approval/decline (Managers)
- Material catalog management
- Quantity tracking
- Request status monitoring
- Note system for requests

**Workflow**:
1. Team requests material
2. Manager reviews request
3. Manager approves/declines
4. Status updates automatically

### 6. Inventory Management
**Purpose**: Track and manage physical resources

**Features**:
- Add/edit/delete inventory items (Manager only)
- Team assignment system
- Stock level tracking
- Availability status management
- Assignment visualization
- Search and filtering

### 7. Messaging System
**Purpose**: Real-time communication between users

**Features**:
- Direct messaging between users
- Role-based conversation filtering
- File attachments with preview
- Message reactions (emoji)
- Reply to messages
- Conversation persistence
- Real-time message display

**Communication Rules**:
- Mentors: Can message assigned teams, directors, managers
- Teams: Can message assigned mentors, directors, managers, other teams
- Directors/Managers: Can message all users

### 8. Notification System
**Purpose**: System-wide announcements and alerts

**Features**:
- Send notifications (Managers only)
- Read/unread status tracking
- Notification editing and deletion
- Team-specific targeting
- Timestamp tracking

### 9. Announcement Board
**Purpose**: Post important updates and information

**Features**:
- Create/edit announcements (Directors/Managers)
- Public announcement display
- Announcement deletion
- Author tracking
- Date sorting

### 10. Reports & Analytics
**Purpose**: Generate comprehensive system reports

**Features**:
- Team assignment reports
- Project status summaries
- Inventory usage reports
- PDF export functionality
- Advanced filtering options
- Detailed team views

## 🔄 Role-Based Access Matrix

| Feature | Director | Manager | Mentor | Incubator |
|---------|----------|---------|--------|-----------|
| Dashboard | ✅ Global | ✅ Managed | ✅ Assigned | ✅ Team |
| Incubators | ✅ View All | ✅ CRUD | ✅ Assigned | ❌ |
| Mentors | ✅ CRUD | ✅ View | ❌ | ✅ View Assigned |
| Projects | ✅ View All | ✅ View All | ✅ Assigned | ✅ CRUD Own |
| Material Requests | ❌ | ✅ Manage | ❌ | ✅ Request |
| Inventory | ✅ View All | ✅ CRUD | ❌ | ✅ View Assigned |
| Reports | ✅ All | ✅ Managed | ❌ | ❌ |
| Announcements | ✅ CRUD | ✅ CRUD | ❌ | ✅ View |
| Notifications | ❌ | ✅ Send | ❌ | ✅ Receive |
| Messaging | ✅ All | ✅ All | ✅ Assigned | ✅ Assigned |

## 🎯 Key Workflows

### Educational Institution Workflow
1. **Director**: Oversees entire incubation program
2. **Manager**: Manages day-to-day operations
3. **Mentor**: Guides assigned teams
4. **Team**: Develops projects and requests resources

### Typical User Journey
1. **Login**: Role-based authentication
2. **Dashboard**: View role-specific overview
3. **Project Management**: Create and track projects
4. **Resource Requests**: Request materials and tools
5. **Communication**: Message with mentors/teams
6. **Reporting**: Generate progress reports

### Collaboration Scenarios
- **Team-Mentor**: Project guidance and feedback
- **Team-Manager**: Resource requests and approvals
- **Manager-Director**: Program oversight and reporting
- **Team-Team**: Peer collaboration and knowledge sharing

## 🚀 Development Setup & Deployment

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=incubation_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# File Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3001
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

### Database Setup

#### 1. Create Database
```sql
CREATE DATABASE incubation_db;
USE incubation_db;
```

#### 2. Run Migrations
```bash
cd backend
npm run db:migrate
npm run db:seed
```

#### 3. Sample Migration File
```typescript
// backend/src/migrations/20240101000001-create-users.ts
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('director', 'manager', 'mentor', 'incubator'),
        allowNull: false
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'teams',
          key: 'id'
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
```

### Development Commands

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

### Real-time Features (Socket.io)

#### Backend Socket Setup
```typescript
// backend/src/socket/socketHandler.ts
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt';

export const setupSocketIO = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their role-based rooms
    socket.join(`user_${socket.userId}`);
    socket.join(`role_${socket.userRole}`);

    // Handle new message
    socket.on('send_message', async (data) => {
      const { conversationId, content, recipientId } = data;
      
      // Save message to database
      const message = await Message.create({
        conversationId,
        senderId: socket.userId,
        content,
      });

      // Send to recipient
      socket.to(`user_${recipientId}`).emit('new_message', {
        id: message.id,
        conversationId,
        senderId: socket.userId,
        content,
        createdAt: message.createdAt,
      });
    });

    // Handle notifications
    socket.on('send_notification', async (data) => {
      const { recipientId, title, message, type } = data;
      
      // Save notification to database
      const notification = await Notification.create({
        recipientId,
        senderId: socket.userId,
        title,
        message,
        type,
      });

      // Send to recipient
      socket.to(`user_${recipientId}`).emit('new_notification', notification);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};
```

#### Frontend Socket Integration
```typescript
// frontend/src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL!, {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
      });

      socketRef.current.on('new_message', (message) => {
        // Handle new message
        console.log('New message:', message);
      });

      socketRef.current.on('new_notification', (notification) => {
        // Handle new notification
        console.log('New notification:', notification);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const sendMessage = (conversationId: number, content: string, recipientId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        conversationId,
        content,
        recipientId,
      });
    }
  };

  return { socket: socketRef.current, sendMessage };
};
```

### File Upload Implementation

#### Backend File Upload
```typescript
// backend/src/middleware/upload.ts
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'incubation-system',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'auto',
  },
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
```

#### Frontend File Upload
```typescript
// frontend/src/hooks/useFileUpload.ts
import { useState } from 'react';
import api from '../services/api';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = async (files: FileList, projectId: number) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await api.post(`/projects/${projectId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });

      return response.data;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadFiles, uploading, progress };
};
```

### Production Deployment

#### Docker Setup
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: incubation_db
      MYSQL_USER: appuser
      MYSQL_PASSWORD: apppassword
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      - DB_HOST=mysql
      - DB_USER=appuser
      - DB_PASSWORD=apppassword
      - DB_NAME=incubation_db
      - JWT_SECRET=your_jwt_secret_here
    depends_on:
      - mysql
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_URL=http://localhost:3001/api
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Testing Strategy

#### Backend Testing
```typescript
// backend/src/tests/auth.test.ts
import request from 'supertest';
import app from '../app';

describe('Authentication', () => {
  test('Should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'director@example.com',
        password: 'password123'
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('role', 'director');
  });

  test('Should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
      .expect(400);
  });
});
```

#### Frontend Testing
```typescript
// frontend/src/components/__tests__/TeamCard.test.tsx
import { render, screen } from '@testing-library/react';
import { TeamCard } from '../TeamCard';

const mockTeam = {
  id: 1,
  teamName: 'Test Team',
  status: 'Active',
  teamLeader: { name: 'John Doe' },
};

test('renders team card with correct information', () => {
  render(<TeamCard team={mockTeam} />);
  
  expect(screen.getByText('Test Team')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

---

**Built with ❤️ for educational innovation and student success**

*This comprehensive development guide provides everything your developers need to build the full-stack Incubation Management System with Express.js, MySQL, React, and Tailwind CSS.*
