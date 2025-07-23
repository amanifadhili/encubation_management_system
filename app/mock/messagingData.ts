// Mock chat messages and conversations
export const conversations = [
  {
    id: 1,
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
      }
    ]
  },
  {
    id: 2,
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
  }
]; 