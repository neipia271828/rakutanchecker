import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Simple check to highlight active link
    const isActive = (path: string) => location.pathname === path;

    return (
        <header style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--bg-elevated)',
            padding: '0 2rem',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div className="flex items-center gap-2">
                <Link to="/dashboard" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>
                    Rakutan Checker
                </Link>
            </div>

            <nav className="flex items-center gap-2">
                <Link
                    to="/dashboard"
                    style={{
                        color: isActive('/dashboard') ? 'var(--primary)' : 'var(--text-primary)',
                        textDecoration: 'none',
                        padding: '0.5rem 1rem',
                        fontWeight: 500
                    }}
                >
                    科目一覧
                </Link>
                <Link
                    to="/calendar"
                    style={{
                        color: isActive('/calendar') ? 'var(--primary)' : 'var(--text-primary)',
                        textDecoration: 'none',
                        padding: '0.5rem 1rem',
                        fontWeight: 500
                    }}
                >
                    カレンダー
                </Link>
                <button
                    onClick={handleLogout}
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid var(--error)',
                        color: 'var(--error)',
                        padding: '0.4rem 1rem',
                        fontSize: '0.9rem',
                        marginLeft: '1rem'
                    }}
                >
                    Logout
                </button>
            </nav>
        </header>
    );
};

export default Header;
