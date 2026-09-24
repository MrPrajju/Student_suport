const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data store for demonstration
let tickets = [
  {
    ticket_id: 'TCK-1001',
    student_name: 'Alex Johnson',
    category: 'Fee Receipt',
    subject: 'Fee Payment Acknowledgment Pending',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    sla_hours: 24,
    created_at: new Date().toISOString()
  },
  {
    ticket_id: 'TCK-1002',
    student_name: 'Prajwal Gundmi',
    category: 'ID Card Replacement',
    subject: 'Lost ID Card Replacement Request',
    status: 'OPEN',
    priority: 'MEDIUM',
    sla_hours: 48,
    created_at: new Date().toISOString()
  }
];

// Get all tickets
app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

// Create a new ticket
app.post('/api/tickets', (req, res) => {
  const newTicket = {
    ticket_id: `TCK-${1000 + tickets.length + 1}`,
    student_name: req.body.student_name || 'Anonymous Student',
    category: req.body.category || 'General Issue',
    subject: req.body.subject,
    status: 'OPEN',
    priority: req.body.priority || 'MEDIUM',
    sla_hours: 24,
    created_at: new Date().toISOString()
  };
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

// Update ticket status
app.patch('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ticket = tickets.find((t) => t.ticket_id === id);

  if (ticket) {
    ticket.status = status;
    res.json(ticket);
  } else {
    res.status(404).json({ error: 'Ticket not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
