import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'https://student-support-tickets.onrender.com';

const DEPARTMENTS = [
  'CSE (HOD)',
  'ECE (HOD)',
  'EEE (HOD)',
  'Accounts & Fees',
  'Sports Department',
  'Library Services',
  'Examination Cell'
];

function App() {
  const [view, setView] = useState('login'); // 'login', 'signup', 'student_dash', 'admin_dash'
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);

  // Login Form
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('student');
  const [loginError, setLoginError] = useState('');

  // Signup Form
  const [signupData, setSignupData] = useState({ collegeId: '', fullName: '', email: '', phone: '', password: '' });
  const [idCardFile, setIdCardFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  // Student Complaint Form
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('CSE (HOD)');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  // Admin Filtering & Editing
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL', 'Pending', 'Active Pending', 'Resolved'
  //const [editingRemark, setEditingRemark] = useState({});

  // Camera handling for selfie
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

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
          setUser(data.user);
          setView('admin_dash');
        } else {
          setUser(data.user);
          setView('student_dash');
        }
      })
      .catch((err) => setLoginError(err.message));
  };

  const fillAdminCredentials = () => {
    setLoginRole('admin');
    setLoginId('ADMIN');
    setLoginPassword('admin123');
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

      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

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

  const handleCreateTicket = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: user.collegeId,
        student_name: user.fullName,
        department,
        subject,
        description,
        priority
      })
    })
      .then((res) => res.json())
      .then(() => {
        setSubject('');
        setDescription('');
        fetchTickets();
      });
  };

  const handleUpdateStatusAndRemark = (ticketId, newStatus, newRemark) => {
    fetch(`http://localhost:5000/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, remark: newRemark })
    })
      .then((res) => res.json())
      .then(() => fetchTickets());
  };

  const renderStatusBadge = (status) => {
    let color = '#ffc107'; // Pending (Yellow)
    let textColor = '#000';
    if (status === 'Active Pending') {
      color = '#17a2b8'; // Blue
      textColor = '#fff';
    } else if (status === 'Resolved') {
      color = '#28a745'; // Green
      textColor = '#fff';
    }
    return (
      <span style={{ backgroundColor: color, color: textColor, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
        {status}
      </span>
    );
  };

  // Filtered lists
  const studentTickets = tickets.filter(t => t.student_id === user?.collegeId);
  const adminFilteredTickets = statusTab === 'ALL' ? tickets : tickets.filter(t => t.status === statusTab);

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', padding: '2rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        
        {/* Navigation Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e9ecef', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>College Student Support System</h2>
            <small style={{ color: '#6c757d' }}>Automated Ticket Routing & Incident Management</small>
          </div>
          <div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span>Logged in as: <b>{user.fullName || user.name}</b> ({view === 'admin_dash' ? 'Administrator' : 'Student'})</span>
                <button onClick={() => { setUser(null); setView('login'); }} style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
              </div>
            ) : (
              <div>
                <button onClick={() => setView('login')} style={{ marginRight: '10px', padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Login</button>
                <button onClick={() => setView('signup')} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Register</button>
              </div>
            )}
          </div>
        </header>

        {/* VIEW 1: LOGIN */}
        {view === 'login' && (
          <div style={{ maxWidth: '420px', margin: '2rem auto', border: '1px solid #dee2e6', padding: '2rem', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3 style={{ marginTop: 0, color: '#343a40' }}>Sign In to Portal</h3>
            {loginError && <p style={{ color: 'red', backgroundColor: '#f8d7da', padding: '8px', borderRadius: '4px' }}>{loginError}</p>}
            
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label><b>Select Role:</b></label>
                <select value={loginRole} onChange={(e) => setLoginRole(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ced4da' }}>
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label><b>{loginRole === 'admin' ? 'Admin Username' : 'College ID'}:</b></label>
                <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ced4da' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label><b>Password:</b></label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ced4da' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>Log In</button>
            </form>

            <hr style={{ margin: '1.5rem 0' }} />
            <div style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
              <small style={{ display: 'block', marginBottom: '5px' }}><b>Testing as Admin?</b></small>
              <button onClick={fillAdminCredentials} style={{ padding: '6px 12px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fill Admin Test Credentials</button>
            </div>
          </div>
        )}

        {/* VIEW 2: SIGNUP */}
        {view === 'signup' && (
          <div style={{ maxWidth: '500px', margin: '1rem auto', border: '1px solid #dee2e6', padding: '2rem', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Student Registration</h3>
            <form onSubmit={handleSignup}>
              <input type="text" placeholder="College Registration ID" required onChange={(e) => setSignupData({ ...signupData, collegeId: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Full Name" required onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <input type="email" placeholder="Email Address" required onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <input type="tel" placeholder="Phone Number" required onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <input type="password" placeholder="Password" required onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc' }} />

              <div style={{ marginBottom: '15px' }}>
                <label><b>1. Upload Student ID Card:</b></label>
                <input type="file" accept="image/*" required onChange={(e) => setIdCardFile(e.target.files[0])} style={{ display: 'block', marginTop: '5px' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label><b>2. Webcam Selfie Capture:</b></label>
                {!isCameraActive ? (
                  <button type="button" onClick={startCamera} style={{ display: 'block', marginTop: '5px', padding: '8px 12px' }}>Open Camera</button>
                ) : (
                  <div style={{ marginTop: '10px' }}>
                    <video ref={videoRef} autoPlay style={{ width: '100%', maxHeight: '200px', borderRadius: '4px' }}></video>
                    <button type="button" onClick={capturePhoto} style={{ marginTop: '5px', padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}>Capture Photo</button>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                {selfieFile && <p style={{ color: 'green', fontWeight: 'bold' }}>✓ Selfie Captured ({selfieFile.name})</p>}
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>Complete Registration</button>
            </form>
          </div>
        )}

        {/* VIEW 3: STUDENT DASHBOARD */}
        {view === 'student_dash' && (
          <div>
            <h3>Student Dashboard</h3>
            
            {/* Stat Counters */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, backgroundColor: '#e9ecef', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <h4 style={{ margin: 0, color: '#6c757d' }}>Total Submitted</h4>
                <h2 style={{ margin: '5px 0 0 0' }}>{studentTickets.length}</h2>
              </div>
              <div style={{ flex: 1, backgroundColor: '#fff3cd', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <h4 style={{ margin: 0, color: '#856404' }}>Pending / In Progress</h4>
                <h2 style={{ margin: '5px 0 0 0' }}>{studentTickets.filter(t => t.status !== 'Resolved').length}</h2>
              </div>
              <div style={{ flex: 1, backgroundColor: '#d4edda', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <h4 style={{ margin: 0, color: '#155724' }}>Resolved</h4>
                <h2 style={{ margin: '5px 0 0 0' }}>{studentTickets.filter(t => t.status === 'Resolved').length}</h2>
              </div>
            </div>

            {/* Submit Complaint Box */}
            <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h4 style={{ marginTop: 0 }}>Register New Complaint</h4>
              <form onSubmit={handleCreateTicket}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                  <div>
                    <label><b>Department / Branch HOD:</b></label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label><b>Priority Level:</b></label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label><b>Subject / Short Summary:</b></label>
                  <input type="text" placeholder="e.g. Fee Receipt acknowledgment pending" value={subject} onChange={(e) => setSubject(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label><b>Detailed Description:</b></label>
                  <textarea placeholder="Provide specific details about your issue..." value={description} onChange={(e) => setDescription(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}></textarea>
                </div>
                <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Submit Complaint</button>
              </form>
            </div>

            {/* Complaints List */}
            <h4>My Complaint History & Updates</h4>
            <table border="1" cellPadding="12" style={{ borderCollapse: 'collapse', width: '100%', borderColor: '#dee2e6' }}>
              <thead>
                <tr style={{ background: '#e9ecef', textAlign: 'left' }}>
                  <th>Ticket ID</th>
                  <th>Submitted Date & Time</th>
                  <th>Department</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                </tr>
              </thead>
              <tbody>
                {studentTickets.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#6c757d' }}>No complaints submitted yet.</td></tr>
                ) : (
                  studentTickets.map((t) => (
                    <tr key={t.ticket_id}>
                      <td><b>{t.ticket_id}</b></td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                      <td>{t.department}</td>
                      <td>{t.subject}</td>
                      <td>{renderStatusBadge(t.status)}</td>
                      <td style={{ color: '#495057', fontStyle: 'italic' }}>{t.remark || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {view === 'admin_dash' && (
          <div>
            <h3>Admin Management Portal</h3>

            {/* Summary Counters */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, backgroundColor: '#e2e3e5', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <small>Total Complaints</small>
                <h3 style={{ margin: '5px 0 0 0' }}>{tickets.length}</h3>
              </div>
              <div style={{ flex: 1, backgroundColor: '#fff3cd', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <small>Pending (Open)</small>
                <h3 style={{ margin: '5px 0 0 0' }}>{tickets.filter(t => t.status === 'Pending').length}</h3>
              </div>
              <div style={{ flex: 1, backgroundColor: '#d1ecf1', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <small>Active Pending</small>
                <h3 style={{ margin: '5px 0 0 0' }}>{tickets.filter(t => t.status === 'Active Pending').length}</h3>
              </div>
              <div style={{ flex: 1, backgroundColor: '#d4edda', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <small>Resolved</small>
                <h3 style={{ margin: '5px 0 0 0' }}>{tickets.filter(t => t.status === 'Resolved').length}</h3>
              </div>
            </div>

            {/* Tabbed Navigation Filter */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #dee2e6', paddingBottom: '10px', marginBottom: '1.5rem' }}>
              {['ALL', 'Pending', 'Active Pending', 'Resolved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: statusTab === tab ? '#007bff' : '#e9ecef',
                    color: statusTab === tab ? '#fff' : '#495057'
                  }}
                >
                  {tab === 'ALL' ? 'All Complaints' : tab}
                </button>
              ))}
            </div>

            {/* Complaints Table */}
            <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', borderColor: '#dee2e6' }}>
              <thead>
                <tr style={{ background: '#343a40', color: '#fff', textAlign: 'left' }}>
                  <th>Date & Time</th>
                  <th>Ticket Details</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Current Status</th>
                  <th>Update Status & Remark</th>
                </tr>
              </thead>
              <tbody>
                {adminFilteredTickets.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#6c757d' }}>No tickets found in this section.</td></tr>
                ) : (
                  adminFilteredTickets.map((t) => (
                    <tr key={t.ticket_id}>
                      <td style={{ fontSize: '13px' }}>
                        {new Date(t.created_at).toLocaleDateString()}<br />
                        <small style={{ color: '#6c757d' }}>{new Date(t.created_at).toLocaleTimeString()}</small>
                      </td>
                      <td>
                        <b>{t.ticket_id}</b> <br />
                        <span style={{ fontSize: '14px' }}>{t.subject}</span>
                      </td>
                      <td>
                        {t.student_name}<br />
                        <small style={{ color: '#6c757d' }}>ID: {t.student_id}</small>
                      </td>
                      <td><b>{t.department}</b></td>
                      <td>{renderStatusBadge(t.status)}</td>
                      <td style={{ width: '280px' }}>
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateStatusAndRemark(t.ticket_id, e.target.value, t.remark)}
                          style={{ width: '100%', padding: '6px', marginBottom: '6px', borderRadius: '4px' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Active Pending">Active Pending</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        
                        <input
                          type="text"
                          placeholder="Add Admin remark..."
                          defaultValue={t.remark}
                          onBlur={(e) => handleUpdateStatusAndRemark(t.ticket_id, t.status, e.target.value)}
                          style={{ width: '92%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;