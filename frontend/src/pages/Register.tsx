import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // Optional, but good practice
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [enrollmentYear, setEnrollmentYear] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure token is cleared before request to avoid Invalid token error from server
        localStorage.removeItem('token');

        try {
            await api.post('register/', {
                username,
                email,
                password,
                full_name: fullName,
                student_id: studentId,
                date_of_birth: dateOfBirth || null,
                enrollment_year: enrollmentYear ? parseInt(enrollmentYear) : null
            });
            // After registration, maybe auto-login or redirect to login?
            // Let's redirect to login for now.
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.username || err.response?.data?.student_id || err.response?.data?.enrollment_year || err.response?.data?.detail || err.message || 'Registration failed';
            alert(`Error: ${errorMessage}`);
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
                        <label htmlFor="fullName" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>氏名</label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="山田 太郎"
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
                        <label htmlFor="studentId" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>学籍番号</label>
                        <input
                            id="studentId"
                            type="text"
                            value={studentId}
                            onChange={e => setStudentId(e.target.value)}
                            placeholder="2024001"
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
                        <label htmlFor="dateOfBirth" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>生年月日</label>
                        <input
                            id="dateOfBirth"
                            type="date"
                            value={dateOfBirth}
                            onChange={e => setDateOfBirth(e.target.value)}
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
                        <label htmlFor="enrollmentYear" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>入学年</label>
                        <input
                            id="enrollmentYear"
                            type="number"
                            value={enrollmentYear}
                            onChange={e => setEnrollmentYear(e.target.value)}
                            placeholder="2024"
                            min="1900"
                            max="2100"
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
