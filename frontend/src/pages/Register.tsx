import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // Optional, but good practice
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/register/', { username, email, password });
            // After registration, maybe auto-login or redirect to login?
            // Let's redirect to login for now.
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert('Registration failed. Username might be taken.');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Account</h2>
                <form onSubmit={handleRegister} className="flex flex-col gap-2">
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
                        <label htmlFor="email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email (Optional)</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{
                                padding: '0.8rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--bg-elevated)',
                                backgroundColor: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
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
                        Sign Up
                    </button>
                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
