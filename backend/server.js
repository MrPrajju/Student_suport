const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersFilePath = path.join(dataDir, 'users.json');
const ticketsFilePath = path.join(dataDir, 'tickets.json');

// Helper to read JSON file
const readData = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  return content ? JSON.parse(content) : [];
};

// Helper to write JSON file
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Configure File Storage for ID Card & Selfie
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// API: Student Sign-Up
app.post('/api/signup', upload.fields([{ name: 'idCard' }, { name: 'selfie' }]), (req, res) => {
  const { collegeId, fullName, email, phone, password } = req.body;
  const users = readData(usersFilePath);

  if (users.find(u => u.collegeId === collegeId)) {
    return res.status(400).json({ error: 'College ID already registered' });
  }

  const newUser = {
    collegeId,
    fullName,
    email,
    phone,
    password, // In production, hash password
    idCardPath: req.files['idCard'] ? req.files['idCard'][0].filename : '',
    selfiePath: req.files['selfie'] ? req.files['selfie'][0].filename : '',
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);
  writeData(usersFilePath, users);
  res.status(201).json({ message: 'Registration successful', user: { collegeId, fullName, email } });
});

// API: Student/Admin Login
app.post('/api/login', (req, res) => {
  const { collegeId, password, role } = req.body;

  if (role === 'admin') {
    if (collegeId === 'ADMIN' && password === 'admin123') {
      return res.json({ role: 'admin', name: 'Admin User' });
    }
    return res.status(401).json({ error: 'Invalid Admin credentials' });
  }

  const users = readData(usersFilePath);
  const user = users.find(u => u.collegeId === collegeId && u.password === password);

  if (user) {
    res.json({ role: 'student', user: { collegeId: user.collegeId, fullName: user.fullName, email: user.email } });
  } else {
    res.status(401).json({ error: 'Invalid College ID or password' });
  }
});

// API: Get Tickets
app.get('/api/tickets', (req, res) => {
  const tickets = readData(ticketsFilePath);
  res.json(tickets);
});

// API: Create Ticket
app.post('/api/tickets', (req, res) => {
  const tickets = readData(ticketsFilePath);
  const newTicket = {
    ticket_id: `TCK-${1000 + tickets.length + 1}`,
    student_id: req.body.student_id || 'UNKNOWN',
    student_name: req.body.student_name || 'Anonymous',
    category: req.body.category || 'General',
    subject: req.body.subject,
    status: 'OPEN',
    priority: req.body.priority || 'MEDIUM',
    created_at: new Date().toISOString()
  };
  tickets.push(newTicket);
  writeData(ticketsFilePath, tickets);
  res.status(201).json(newTicket);
});

// API: Update Ticket Status (Admin)
app.patch('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const tickets = readData(ticketsFilePath);
  const ticket = tickets.find(t => t.ticket_id === id);

  if (ticket) {
    ticket.status = status;
    writeData(ticketsFilePath, tickets);
    res.json(ticket);
  } else {
    res.status(404).json({ error: 'Ticket not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));