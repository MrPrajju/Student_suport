import React, { useState, useEffect } from 'react';

function App() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Fees');

  useEffect(() => {
    fetch('http://localhost:5000/api/tickets')
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, category, student_name: 'Prajwal Gundmi' })
    })
      .then((res) => res.json())
      .then((newTicket) => {
        setTickets([...tickets, newTicket]);
        setSubject('');
      });
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Student Support & Ticket Dashboard</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <h3>Submit New Request</h3>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px', marginRight: '10px' }}>
          <option value="Fees">Fees</option>
          <option value="ID Card">ID Card</option>
          <option value="Certificates">Certificates</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px' }}>Submit Ticket</button>
      </form>

      <h3>Active Tickets</h3>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Student</th>
            <th>Category</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.ticket_id}>
              <td>{t.ticket_id}</td>
              <td>{t.student_name}</td>
              <td>{t.category}</td>
              <td>{t.subject}</td>
              <td><b>{t.status}</b></td>
              <td>{t.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
