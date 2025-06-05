import React, { useState } from 'react';
import axios from 'axios';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const { data } = await axios.post(
        'http://localhost:5000/api/auth/user/login',
        { email, password },
        config
      );
      localStorage.setItem('userInfo', JSON.stringify(data));
      setMessage('Login successful!');
      // Redirect to user dashboard or home
    } catch (error) {
      setMessage(error.response && error.response.data.message ? error.response.data.message : error.message);
    }
  };

  return (
    <div>
      <h1>User Login</h1>
      {message && <p>{message}</p>}
      <form onSubmit={submitHandler}>
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
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default UserLogin;
