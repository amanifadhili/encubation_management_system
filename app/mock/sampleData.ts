// Sample mock data for development

// Incubators/Teams
export const incubators = [
  {
    id: 1,
    name: "InnovateX Team",
    project: "Smart Campus Energy Saver",
    members: ["Alice", "Bob", "Charlie"],
    mentor: "Dr. Smith",
    status: "Active"
  },
  {
    id: 2,
    name: "GreenMinds",
    project: "Eco-Friendly Packaging",
    members: ["Dave", "Eva"],
    mentor: "Prof. Green",
    status: "Pending"
  },
];

// Projects
export const projects = [
  {
    id: 1,
    name: "Smart Campus Energy Saver",
    incubatorId: 1,
    description: "IoT-based system to optimize campus energy usage.",
    status: "Active",
    files: ["proposal.pdf"],
  },
  {
    id: 2,
    name: "Eco-Friendly Packaging",
    incubatorId: 2,
    description: "Biodegradable packaging for campus cafeterias.",
    status: "Pending",
    files: [],
  },
];

// Mentors
export const mentors = [
  {
    id: 1,
    name: "Dr. Smith",
    expertise: "Energy Systems",
    assignedTeams: [1],
    email: "smith@university.edu",
    phone: "123-456-7890",
  },
  {
    id: 2,
    name: "Prof. Green",
    expertise: "Sustainable Design",
    assignedTeams: [2],
    email: "green@university.edu",
    phone: "234-567-8901",
  },
  // Add a fallback to ensure all mentors have assignedTeams
].map(m => ({ ...m, assignedTeams: Array.isArray(m.assignedTeams) ? m.assignedTeams : [] }));

// Managers
export const managers = [
  {
    id: 1,
    name: "Ms. Johnson",
    role: "Manager",
    teamsManaged: [1, 2],
    email: "johnson@university.edu",
  },
];

// Requests (tools, facilities, mentorship)
export const requests = [
  {
    id: 1,
    type: "tool",
    item: "3D Printer",
    incubatorId: 1,
    status: "Approved",
    requestedBy: "Alice",
    date: "2024-06-01",
  },
  {
    id: 2,
    type: "mentorship",
    mentor: "Prof. Green",
    incubatorId: 2,
    status: "Pending",
    requestedBy: "Eva",
    date: "2024-06-02",
  },
];

// Tools/Facilities (Inventory)
export const tools = [
  {
    id: 1,
    name: "3D Printer",
    available: true,
    assignedTo: 1,
    usageCount: 5,
  },
  {
    id: 2,
    name: "Laser Cutter",
    available: false,
    assignedTo: null,
    usageCount: 8,
  },
];

// Announcements
export const announcements = [
  {
    id: 1,
    title: "Welcome to the Incubation Hub!",
    content: "Kickoff event on June 10th. All teams must attend.",
    date: "2024-06-01",
    postedBy: "Ms. Johnson",
  },
];

// Evaluations
export const evaluations = [
  {
    id: 1,
    incubatorId: 1,
    evaluator: "Dr. Smith",
    score: 92,
    feedback: "Excellent progress and teamwork.",
    date: "2024-06-05",
  },
];

// Audit Logs
export const auditLogs = [
  {
    id: 1,
    action: "Login",
    user: "Alice Director",
    date: "2024-06-01T09:00:00Z",
  },
  {
    id: 2,
    action: "Request Tool",
    user: "Bob Manager",
    date: "2024-06-01T10:00:00Z",
  },
];

// Notifications
export const notifications = [
  {
    id: 1,
    user: "Dave Incubator",
    message: "Your request for 3D Printer was approved.",
    read: false,
    date: "2024-06-01T12:00:00Z",
  },
];

// Analytics (mocked)
export const analytics = {
  activeProjects: 2,
  incubatorEngagement: 87, // percent
  inventoryStatus: {
    available: 1,
    inUse: 1,
  },
  evaluationScores: [92, 85, 78],
};
