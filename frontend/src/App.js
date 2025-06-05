import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import UserLogin from './components/UserLogin';
import UserRegister from './components/UserRegister';
import DoctorLogin from './components/DoctorLogin';
import DoctorRegister from './components/DoctorRegister';

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/user/login">User Login</Link>
          </li>
          <li>
            <Link to="/user/register">User Register</Link>
          </li>
          <li>
            <Link to="/doctor/login">Doctor Login</Link>
          </li>
          <li>
            <Link to="/doctor/register">Doctor Register</Link>
          </li>
          <li>
            <Link to="/user/dashboard">User Dashboard</Link>
          </li>
          <li>
            <Link to="/doctor/dashboard">Doctor Dashboard</Link>
          </li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/register" element={<UserRegister />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/register" element={<DoctorRegister />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/call/:callId" element={<CallPage />} />
      </Routes>
    </Router>
  );
}

export default App;
