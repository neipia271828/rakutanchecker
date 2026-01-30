import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Use direct URL for token endpoint as it might not be under /api/
            const res = await axios.post('http://localhost:8000/api-token-auth/', { username, password });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Login</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="username" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={{
                                padding: '0.8rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--bg-elevated)',
                                backgroundColor: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{
                                padding: '0.8rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--bg-elevated)',
                                backgroundColor: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                            required
                        />
                    </div>
                    <button type="submit" style={{ marginTop: '1rem', backgroundColor: 'var(--primary)', color: '#000' }}>
                        Sign In
                    </button>
                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Sign Up</Link>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Login;
