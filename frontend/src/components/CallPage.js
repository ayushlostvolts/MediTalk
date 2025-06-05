import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import ChatWindow from './ChatWindow';

const CallPage = () => {
  const { callId } = useParams();
  const location = useLocation();
  const { doctorId, userId, userType, userName, doctorName } = location.state || {};

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const [callStatus, setCallStatus] = useState('connecting');
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef(null);

  const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  useEffect(() => {
    socket.current = io('http://localhost:5000');

    socket.current.emit('joinCall', { callId, userId, doctorId, userType });

    socket.current.on('callStarted', ({ startTime }) => {
      setCallStatus('active');
      console.log('Call started at:', startTime);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    });

    socket.current.on('callEnded', () => {
      setCallStatus('ended');
      clearInterval(timerIntervalRef.current);
      alert('Call has ended.');
      // Optionally redirect or show summary
    });

    socket.current.on('participantDisconnected', ({ disconnectedSocketId }) => {
      console.log(`Participant ${disconnectedSocketId} disconnected.`);
      setCallStatus('disconnected');
      clearInterval(timerIntervalRef.current);
      alert('Other participant disconnected. Call ended.');
    });

    // WebRTC setup
    const setupWebRTC = async () => {
      peerConnection.current = new RTCPeerConnection(configuration);

      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit('ice-candidate', {
            callId,
            candidate: event.candidate,
          });
        }
      };

      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = localStream;
      localStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream);
      });

      if (userType === 'user') {
        // User initiates the offer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.current.emit('offer', { callId, offer });
      }
    };

    socket.current.on('offer', async ({ offer }) => {
      if (userType === 'doctor') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.current.emit('answer', { callId, answer });
      }
    });

    socket.current.on('answer', async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.current.on('ice-candidate', async ({ candidate }) => {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    setupWebRTC();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (socket.current) {
        socket.current.disconnect();
      }
      clearInterval(timerIntervalRef.current);
    };
  }, [callId, userId, doctorId, userType]);

  const handleEndCall = async () => {
    try {
      // Notify backend to end call and process billing
      const token = userType === 'user' ? JSON.parse(localStorage.getItem('userInfo')).token : JSON.parse(localStorage.getItem('doctorInfo')).token;
      await fetch(`http://localhost:5000/api/calls/end/${callId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      socket.current.emit('endCall', { callId });
    } catch (error) {
      console.error('Error ending call:', error);
      alert('Failed to end call.');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <h1>Call with {userType === 'user' ? doctorName : userName}</h1>
      <p>Call ID: {callId}</p>
      <p>Status: {callStatus}</p>
      <p>Duration: {formatTime(timer)}</p>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        <div>
          <h2>My Video</h2>
          <video ref={localVideoRef} autoPlay muted style={{ width: '400px', height: '300px', border: '1px solid black' }}></video>
        </div>
        <div>
          <h2>Remote Video</h2>
          <video ref={remoteVideoRef} autoPlay style={{ width: '400px', height: '300px', border: '1px solid black' }}></video>
        </div>
      </div>

      <button onClick={handleEndCall} disabled={callStatus === 'ended'}>End Call</button>

      <div style={{ marginTop: '20px' }}>
        <h2>Chat</h2>
        <ChatWindow callId={callId} senderName={userType === 'user' ? userName : doctorName} senderType={userType} />
      </div>
    </div>
  );
};

export default CallPage;
