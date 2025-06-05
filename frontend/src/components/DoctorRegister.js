import React, { useState } from 'react';
import axios from 'axios';

const DoctorRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [ratePerMinute, setRatePerMinute] = useState('');
  const [message, setMessage] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
          },
        };
        const { data } = await axios.post(
          'http://localhost:5000/api/auth/doctor/register',
          { name, email, password, specialty, experience, ratePerMinute },
          config
        );
        localStorage.setItem('doctorInfo', JSON.stringify(data));
        setMessage('Registration successful!');
        // Redirect to doctor dashboard or home
      } catch (error) {
        setMessage(error.response && error.response.data.message ? error.response.data.message : error.message);
      }
    }
  };

  return (
    <div>
      <h1>Doctor Register</h1>
      {message && <p>{message}</p>}
      <form onSubmit={submitHandler}>
        <div>
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Specialty</label>
          <input
            type="text"
            placeholder="Enter specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>
        <div>
          <label>Experience (Years)</label>
          <input
            type="number"
            placeholder="Enter experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </div>
        <div>
          <label>Rate Per Minute</label>
          <input
            type="number"
            placeholder="Enter rate per minute"
            value={ratePerMinute}
            onChange={(e) => setRatePerMinute(e.target.value)}
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default DoctorRegister;
