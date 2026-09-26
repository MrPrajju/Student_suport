const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();

// Enable CORS for all incoming cross-origin requests
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Ensure data directory exists inside backend
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersFilePath = path.join(dataDir, 'users.json');
const ticketsFilePath = path.join(dataDir, 'tickets.json');

const readData = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content ? JSON.parse(content) : [];
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
};

// Storage setup for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Root Health Check Route
app.get('/', (req, res) => {
  res.status(200).send('Student Support API is live and running!');
});

// Student Sign-Up
app.post('/api/signup', upload.fields([{ name: 'idCard' }, { name: 'selfie' }]), (req, res) => {
  const { collegeId, fullName, email, phone, password } = req.body;
  const users = readData(usersFilePath);

  if (users.find(u => u.collegeId === collegeId)) {
    return res.status(400).json({ error: 'College ID already registered' });
  }

  const idCardFile = req.files && req.files['idCard'] ? req.files['idCard'][0].filename : '';
  const selfieFile = req.files && req.files['selfie'] ? req.files['selfie'][0].filename : '';

  const newUser = {
    collegeId,
    fullName,
    email,
    phone,
    password,
    idCardPath: idCardFile,
    selfiePath: selfieFile,
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);
  writeData(usersFilePath, users);
  res.status(201).json({ message: 'Registration successful', user: { collegeId, fullName, email } });
});

// Authentication Endpoint
app.post('/api/login', (req, res) => {
  const { collegeId, password, role } = req.body;

  if (role === 'admin') {
    if (collegeId === 'ADMIN' && password === 'admin123') {
      return res.json({ role: 'admin', user: { name: 'System Administrator', collegeId: 'ADMIN' } });
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

// Get Tickets
app.get('/api/tickets', (req, res) => {
  const tickets = readData(ticketsFilePath);
  // Sort by created date descending (newest first)
  tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(tickets);
});

// Create Complaint Ticket
app.post('/api/tickets', (req, res) => {
  const tickets = readData(ticketsFilePath);
  const newTicket = {
    ticket_id: `TCK-${1000 + tickets.length + 1}`,
    student_id: req.body.student_id || 'UNKNOWN',
    student_name: req.body.student_name || 'Anonymous',
    department: req.body.department || 'CSE (HOD)',
    subject: req.body.subject,
    description: req.body.description || '',
    status: 'Pending',
    priority: req.body.priority || 'MEDIUM',
    remark: 'Awaiting official review',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  tickets.push(newTicket);
  writeData(ticketsFilePath, tickets);
  res.status(201).json(newTicket);
});

// Update Status & Remark (Admin)
app.patch('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;
  const tickets = readData(ticketsFilePath);
  const ticket = tickets.find(t => t.ticket_id === id);

  if (ticket) {
    if (status) ticket.status = status;
    if (remark !== undefined) ticket.remark = remark;
    ticket.updated_at = new Date().toISOString();
    writeData(ticketsFilePath, tickets);
    res.json(ticket);
  } else {
    res.status(404).json({ error: 'Ticket not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));