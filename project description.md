✅ Project Title
Career Development and Incubation Hub Management System

✅ Project Goal
To develop a centralized web platform that enables the university's Career Development Unit to manage creative students (incubators), assign mentors, track project progress, and provide facilities and tools to support innovation, collaboration, and entrepreneurship.

✅ Tech Stack
🔹 Frontend
React.js – for dynamic UI components and state management

Tailwind CSS – for rapid, clean, and responsive styling

🔹 Backend
Node.js with Express.js – to handle server-side logic and API endpoints

MongoDB or MySQL – for database (based on your choice)

Socket.IO – for real-time chat (optional but ideal)

PDFKit or Puppeteer – for generating PDF reports

JWT / OAuth2 – for authentication and role-based access control

✅ Key System Users & Roles
🔹 Director
View overall system reports (incubators, mentors, tools, evaluations)

Add/remove managers

Export analytics and audit logs in PDF format

🔹 Manager
Add/edit incubators and their teams

Assign mentors to incubator teams

Approve/decline requests (tools, facilities, mentorship)

Manage inventory/tools

Post announcements

Evaluate incubators

Chat with incubators and mentors

🔹 Incubator (Student)
Register and maintain team profile

Submit and update project

View and contact assigned mentor

Request tools, facilities, or mentorship

Chat with manager/mentor

View calendar, events, and announcements

Receive evaluations and notifications

🔹 Mentor
View assigned incubator teams

Chat with incubators

Track team progress

Give evaluations or feedback

✅ Core Modules
🔸 1. Authentication & Roles
Role-based login: Director, Manager, Mentor, Incubator

JWT-based secure login, logout, and access protection

🔸 2. Incubator & Project Management
Add incubator profiles

Submit and update projects

Add/remove team members

Attach documents or media files

🔸 3. Mentor Management
Manager adds mentors

Assign mentor to each incubator team

Mentors track incubator team progress

🔸 4. Request Handling
Incubators request tools, facilities, or mentorship

Managers approve/decline

Request tracking & history

🔸 5. Messaging System
Incubator ↔ Manager & Incubator ↔ Mentor

Real-time chat via Socket.IO

Inbox history saved in DB

🔸 6. Calendar & Scheduling
Events, meetings, evaluations

View per user role (incubator, mentor, manager)

Event reminders

🔸 7. Stock Management (Manager)
Add/update/delete tools and facilities

Assign tools to incubators

Track availability and usage

🔸 8. Stock Reports (Director)
Monitor tool usage

Generate reports filtered by item, user, or time period

Export as PDF

🔸 9. PDF Report Generation
Export:

Team/project info

Evaluations

Inventory reports

Activity logs

🔸 10. Announcement Board
Post and view announcements

All incubators can view global notices

🔸 11. Evaluation Module
Score incubators periodically (by manager or mentor)

Add comments and feedback

Share evaluation results with incubators

🔸 12. Activity Log / Audit Trail
Tracks:

Logins

Requests

Assignments

Chats

File uploads

Viewable by managers/director

🔸 13. Notification System
Auto-notify on:

Request status

Assigned mentor

Upcoming events

Evaluation posted

New messages

🔸 14. Dashboard & Analytics
Graphs (via Chart.js or Recharts) showing:

Active projects

Incubator engagement

Inventory status

Evaluation scores