import { useState } from 'react';
import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';

async function authRequest(path, body) {
  const response = await fetch(`${import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://aswani-product-api-prg-g6h3b4c6djhscxfj.indiasouthcentral-01.azurewebsites.net')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed (${response.status})`);
  }

  return response.json();
}

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const navigate = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        await authRequest('/auth/register', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        setMode('login');
        setForm((current) => ({ ...current, name: '', password: '', confirmPassword: '' }));
        setMessage('Account created successfully. You can now sign in.');
        return;
      }

      const result = await authRequest('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      if (!result?.access_token) {
        throw new Error('Login did not return an access token.');
      }
      const user = result.user || {};
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      localStorage.setItem('current_user_name', user.name || '');
      localStorage.setItem('current_user_email', user.email || form.email.trim());
      localStorage.setItem('current_user_role', user.role || 'USER');  
      localStorage.setItem('current_user_permissions', JSON.stringify(user.permissions || []));  
      onAuthenticated(user);
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === 'register') {
    return (
      <RegisterPage
        onSubmit={submit}
        onNavigate={navigate}
        form={form}
        onChange={update}
        error={error}
        message={message}
        submitting={submitting}
      />
    );
  }

  return (
    <LoginPage
      onSubmit={submit}
      onNavigate={navigate}
      email={form.email}
      password={form.password}
      onChange={update}
      error={error}
      message={message}
      submitting={submitting}
    />
  );
}
