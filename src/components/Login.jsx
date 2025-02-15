import React, { useState } from 'react';

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    let endpoint = 'https://real-time-chat-strapi-server.onrender.com/api/auth/local';
    let payload = {};

    if (isRegistering) {
      // For registration, send username, email, and password (no identifier)
      const username = formData.get('username');
      payload = { username, email, password };
      endpoint = 'https://real-time-chat-strapi-server.onrender.com/api/auth/local/register';
    } else {
      // For login, send identifier (email or username) and password
      payload = { identifier: email, password };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLoading(false);
      if (data.jwt) {
        onLogin(data.user, data.jwt);
      } else {
        alert('Error: ' + JSON.stringify(data.error || data));
      }
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div>
            <input
              name="username"
              placeholder="Username"
              required
              disabled={loading}
            />
          </div>
        )}
        <div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            disabled={loading}
          />
        </div>
        <div>
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
        </button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)} disabled={loading}>
        {isRegistering ? 'Switch to Login' : 'Switch to Register'}
      </button>
    </div>
  );
}

export default Login;
