import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [view, setView] = useState('login'); // 'login', 'signup', 'student_dash', 'admin_dash'
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);

  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('student');
  const [loginError, setLoginError] = useState('');

  // Signup Form State
  const [signupData, setSignupData] = useState({
    collegeId: '', fullName: '', email: '', phone: '', password: ''
  });
  const [idCardFile, setIdCardFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  // Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Fees');
  const [priority, setPriority] = useState('MEDIUM');

  // Camera handling for selfie
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Fetch tickets whenever entering a dashboard
  useEffect(() => {
    if (view === 'student_dash' || view === 'admin_dash') {
      fetchTickets();
    }
  }, [view]);

  const fetchTickets = () => {
    fetch('http://localhost:5000/api/tickets')
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch((err) => console.error('Error fetching tickets:', err));
  };

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collegeId: loginId, password: loginPassword, role: loginRole })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        return data;
      })
      .then((data) => {
        if (data.role === 'admin') {
          setUser({ name: 'System Administrator' });
          setView('admin_dash');
        } else {
          setUser(data.user);
          setView('student_dash');
        }
      })
      .catch((err) => setLoginError(err.message));
  };

  // Camera Functions
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera access denied or unavailable.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `selfie-${Date.now()}.png`, { type: 'image/png' });
        setSelfieFile(file);
      });

      // Stop camera stream
      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  // Handle Signup Submission
  const handleSignup = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(signupData).forEach((key) => formData.append(key, signupData[key]));
    if (idCardFile) formData.append('idCard', idCardFile);
    if (selfieFile) formData.append('selfie', selfieFile);

    fetch('http://localhost:5000/api/signup', {
      method: 'POST',
      body: formData
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        return data;
      })
      .then(() => {
        alert('Registration successful! Please log in.');
        setView('login');
      })
      .catch((err) => alert(err.message));
  };

  // Create Ticket (Student)
  const handleCreateTicket = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: user.collegeId,
        student_name: user.fullName,
        subject,
        category,
        priority
      })
    })
      .then((res) => res.json())
      .then(() => {
        setSubject('');
        fetchTickets();
      });
  };

  // Update Status (Admin)
  const handleStatusChange = (ticketId, newStatus) => {
    fetch(`http://localhost:5000/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then((res) => res.json())
      .then(() => fetchTickets());
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Navigation Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ccc', pb: '10px', mb: '20px' }}>
        <h2>Student Support Portal</h2>
        <div>
          {user ? (
            <button onClick={() => { setUser(null); setView('login'); }} style={{ padding: '8px 12px' }}>Logout</button>
          ) : (
            <>
              <button onClick={() => setView('login')} style={{ marginRight: '10px', padding: '8px 12px' }}>Login</button>
              <button onClick={() => setView('signup')} style={{ padding: '8px 12px' }}>Register</button>
            </>
          )}
        </div>
      </header>

      {/* VIEW 1: LOGIN */}
      {view === 'login' && (
        <div style={{ maxWidth: '400px', margin: '0 auto', border: '1px solid #ddd', padding: '2rem', borderRadius: '8px' }}>
          <h3>Sign In</h3>
          {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Role:</label><br />
              <select value={loginRole} onChange={(e) => setLoginRole(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>{loginRole === 'admin' ? 'Admin ID' : 'College ID'}:</label>
              <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Password:</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none' }}>Login</button>
          </form>
        </div>
      )}

      {/* VIEW 2: SIGNUP */}
      {view === 'signup' && (
        <div style={{ maxWidth: '500px', margin: '0 auto', border: '1px solid #ddd', padding: '2rem', borderRadius: '8px' }}>
          <h3>Student Sign-Up</h3>
          <form onSubmit={handleSignup}>
            <input type="text" placeholder="College ID" required onChange={(e) => setSignupData({ ...signupData, collegeId: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <input type="text" placeholder="Full Name" required onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <input type="email" placeholder="Email Address" required onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <input type="tel" placeholder="Phone Number" required onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
            <input type="password" placeholder="Set Password" required onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />

            <div style={{ marginBottom: '15px' }}>
              <label><b>Upload ID Card:</b></label><br />
              <input type="file" accept="image/*" required onChange={(e) => setIdCardFile(e.target.files[0])} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label><b>Selfie Verification:</b></label><br />
              {!isCameraActive ? (
                <button type="button" onClick={startCamera}>Open Camera to Take Selfie</button>
              ) : (
                <div>
                  <video ref={videoRef} autoPlay style={{ width: '100%', maxHeight: '200px' }}></video>
                  <button type="button" onClick={capturePhoto} style={{ marginTop: '5px' }}>Capture Photo</button>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              {selfieFile && <p style={{ color: 'green' }}>✓ Selfie Captured ({selfieFile.name})</p>}
            </div>

            <button type="submit" style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none' }}>Register</button>
          </form>
        </div>
      )}

      {/* VIEW 3: STUDENT DASHBOARD */}
      {view === 'student_dash' && (
        <div>
          <h3>Welcome, {user?.fullName} ({user?.collegeId})</h3>
          <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h4>Submit a New Ticket</h4>
            <form onSubmit={handleCreateTicket}>
              <input type="text" placeholder="Subject / Summary" value={subject} onChange={(e) => setSubject(e.target.value)} required style={{ padding: '8px', marginRight: '10px', width: '40%' }} />
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px', marginRight: '10px' }}>
                <option value="Fees">Fees</option>
                <option value="ID Card">ID Card</option>
                <option value="Certificates">Certificates</option>
                <option value="Attendance">Attendance</option>
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '8px', marginRight: '10px' }}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none' }}>Submit Ticket</button>
            </form>
          </div>

          <h4>Your Tickets</h4>
          <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#f2f2f2' }}>
                <th>Ticket ID</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.filter(t => t.student_id === user?.collegeId).map((t) => (
                <tr key={t.ticket_id}>
                  <td>{t.ticket_id}</td>
                  <td>{t.category}</td>
                  <td>{t.subject}</td>
                  <td>{t.priority}</td>
                  <td><b>{t.status}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 4: ADMIN PORTAL */}
      {view === 'admin_dash' && (
        <div>
          <h3>Admin Management Portal</h3>
          <p>Logged in as System Administrator</p>
          <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '1rem' }}>
            <thead>
              <tr style={{ background: '#f2f2f2' }}>
                <th>Ticket ID</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Current Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.ticket_id}>
                  <td>{t.ticket_id}</td>
                  <td>{t.student_id}</td>
                  <td>{t.student_name}</td>
                  <td>{t.category}</td>
                  <td>{t.subject}</td>
                  <td>{t.priority}</td>
                  <td><b>{t.status}</b></td>
                  <td>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.ticket_id, e.target.value)}
                      style={{ padding: '5px' }}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="PENDING_STUDENT_ACTION">PENDING_STUDENT_ACTION</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="ESCALATED">ESCALATED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;