// Mock chat messages and conversations
export const conversations = [
  {
    id: 1,
    name: null, // DM
    participants: ["Dave Incubator", "Carol Mentor"],
    messages: [
      {
        sender: "Dave Incubator",
        content: "Hi Mentor, I have a question about my project.",
        timestamp: "2024-06-01T09:00:00Z"
      },
      {
        sender: "Carol Mentor",
        content: "Sure, go ahead!",
        timestamp: "2024-06-01T09:01:00Z"
      },
      {
        sender: "Dave Incubator",
        content: "How can we improve our prototype for the next review?",
        timestamp: "2024-06-01T09:02:00Z"
      },
      {
        sender: "Carol Mentor",
        content: "Focus on user feedback and document your changes.",
        timestamp: "2024-06-01T09:03:00Z"
      }
    ]
  },
  {
    id: 2,
    name: null, // DM
    participants: ["Bob Manager", "Dave Incubator"],
    messages: [
      {
        sender: "Bob Manager",
        content: "Please submit your project update by Friday.",
        timestamp: "2024-06-02T10:00:00Z"
      },
      {
        sender: "Dave Incubator",
        content: "Will do, thank you!",
        timestamp: "2024-06-02T10:05:00Z"
      }
    ]
  },
  {
    id: 3,
    name: "#GreenMinds Team", // Group chat (incubator, mentor, manager)
    participants: ["Dave Incubator", "Eva", "Carol Mentor", "Bob Manager"],
    messages: [
      {
        sender: "Eva",
        content: "Team, our next milestone is next week.",
        timestamp: "2024-06-03T08:00:00Z"
      },
      {
        sender: "Bob Manager",
        content: "Let me know if you need any resources.",
        timestamp: "2024-06-03T08:05:00Z"
      },
      {
        sender: "Carol Mentor",
        content: "I can review your progress on Thursday.",
        timestamp: "2024-06-03T08:10:00Z"
      }
    ]
  },
  {
    id: 4,
    name: "#Directors", // Group chat (directors only)
    participants: ["Alice Director"],
    messages: [
      {
        sender: "Alice Director",
        content: "Monthly report is ready for review.",
        timestamp: "2024-06-04T12:00:00Z"
      }
    ]
  },
  {
    id: 5,
    name: "#All Managers", // Group chat (all managers)
    participants: ["Bob Manager", "Ms. Johnson"],
    messages: [
      {
        sender: "Ms. Johnson",
        content: "Reminder: Inventory audit this Friday.",
        timestamp: "2024-06-05T09:00:00Z"
      },
      {
        sender: "Bob Manager",
        content: "Thanks for the heads up!",
        timestamp: "2024-06-05T09:10:00Z"
      }
    ]
  }
]; 