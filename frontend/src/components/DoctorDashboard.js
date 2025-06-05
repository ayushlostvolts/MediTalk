import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DoctorDashboard = () => {
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const doctorInfo = JSON.parse(localStorage.getItem('doctorInfo'));
        if (!doctorInfo || !doctorInfo.token) {
          setError('Doctor not logged in.');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${doctorInfo.token}`,
          },
        };

        const { data } = await axios.get('http://localhost:5000/api/doctors/profile', config);
        setDoctorProfile(data);
        setIsAvailable(data.isAvailable);
        setLoading(false);
      } catch (err) {
        setError(err.response && err.response.data.message ? err.response.data.message : err.message);
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  const handleAvailabilityToggle = async () => {
    try {
      const doctorInfo = JSON.parse(localStorage.getItem('doctorInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${doctorInfo.token}`,
        },
      };
      const { data } = await axios.put(
        'http://localhost:5000/api/doctors/availability',
        { isAvailable: !isAvailable },
        config
      );
      setIsAvailable(data.isAvailable);
      alert(`Availability updated to: ${data.isAvailable ? 'Available' : 'Not Available'}`);
    } catch (err) {
      setError(err.response && err.response.data.message ? err.response.data.message : err.message);
    }
  };

  if (loading) return <div>Loading doctor profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!doctorProfile) return <div>No doctor data found.</div>;

  return (
    <div>
      <h1>Doctor Dashboard</h1>
      <p>Welcome, Dr. {doctorProfile.name}!</p>
      <p>Email: {doctorProfile.email}</p>
      <p>Specialty: {doctorProfile.specialty}</p>
      <p>Experience: {doctorProfile.experience} years</p>
      <p>Rate Per Minute: ${doctorProfile.ratePerMinute}</p>

      <div>
        <label>
          Availability:
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={handleAvailabilityToggle}
          />
          {isAvailable ? ' Available' : ' Not Available'}
        </label>
      </div>

      {/* Placeholder for earnings and past consultations */}
      <h2>Earnings Summary</h2>
      <p>Total Earnings: $0.00 (To be implemented)</p>

      <h2>Past Consultations</h2>
      <p>No past consultations to display yet. (To be implemented)</p>
    </div>
  );
};

export default DoctorDashboard;
