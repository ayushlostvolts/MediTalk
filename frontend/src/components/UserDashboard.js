import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserDashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
          setError('User not logged in.');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get('http://localhost:5000/api/users/profile', config);
        setUserProfile(data);
        setLoading(false);
      } catch (err) {
        setError(err.response && err.response.data.message ? err.response.data.message : err.message);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <div>Loading user profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userProfile) return <div>No user data found.</div>;

  const totalSpent = userProfile.consultationHistory.reduce((acc, call) => acc + call.billAmount, 0);

  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Welcome, {userProfile.name}!</p>
      <p>Email: {userProfile.email}</p>

      <h2>Consultation History</h2>
      {userProfile.consultationHistory.length === 0 ? (
        <p>No past consultations.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date</th>
              <th>Duration (minutes)</th>
              <th>Bill Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            {userProfile.consultationHistory.map((call) => (
              <tr key={call._id}>
                <td>{call.doctor ? call.doctor.name : 'N/A'}</td> {/* Assuming doctor name can be populated */}
                <td>{new Date(call.callDate).toLocaleDateString()}</td>
                <td>{call.callDuration}</td>
                <td>{call.billAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3>Total Spent: ${totalSpent.toFixed(2)}</h3>
    </div>
  );
};

export default UserDashboard;
