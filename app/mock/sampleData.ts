// Sample mock data for development
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
    members: ["David", "Eva"],
    mentor: "Prof. Green",
    status: "Pending"
  },
  {
    id: 3,
    name: "TechPioneers",
    project: "AI Tutoring Assistant",
    members: ["Fiona", "George", "Helen"],
    mentor: "Dr. Lee",
    status: "Active"
  }
];

export const mentors = [
  {
    id: 1,
    name: "Dr. Smith",
    expertise: "Energy Systems",
    assignedTeams: [1]
  },
  {
    id: 2,
    name: "Prof. Green",
    expertise: "Sustainable Design",
    assignedTeams: [2]
  },
  {
    id: 3,
    name: "Dr. Lee",
    expertise: "Artificial Intelligence",
    assignedTeams: [3]
  }
];

export const managers = [
  {
    id: 1,
    name: "Ms. Johnson",
    role: "Manager",
    teamsManaged: [1, 2]
  },
  {
    id: 2,
    name: "Mr. Brown",
    role: "Manager",
    teamsManaged: [3]
  }
];
