import React, { useState } from 'react';

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    let endpoint = 'http://localhost:1337/api/auth/local';
    let payload = {};

    if (isRegistering) {
      // For registration, send username, email, and password (no identifier)
      const username = formData.get('username');
      payload = { username, email, password };
      endpoint = 'http://localhost:1337/api/auth/local/register';
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
      if (data.jwt) {
        onLogin(data.user, data.jwt);
      } else {
        alert('Error: ' + JSON.stringify(data.error || data));
      }
    } catch (error) {
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
            <input name="username" placeholder="Username" required />
          </div>
        )}
        <div>
          <input name="email" type="email" placeholder="Email" required />
        </div>
        <div>
          <input name="password" type="password" placeholder="Password" required />
        </div>
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? 'Switch to Login' : 'Switch to Register'}
      </button>
    </div>
  );
}

export default Login;
