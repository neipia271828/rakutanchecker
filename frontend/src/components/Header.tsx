import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [displayName, setDisplayName] = useState<string | null>(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Simple check to highlight active link
    const isActive = (path: string) => location.pathname === path;

    useEffect(() => {
        let cancelled = false;
        const fetchMe = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setDisplayName(null);
                return;
            }
            try {
                const res = await api.get('me/');
                if (cancelled) return;
                const name = res.data?.full_name || res.data?.username || null;
                setDisplayName(name);
            } catch (err) {
                if (!cancelled) {
                    setDisplayName(null);
                }
            }
        };
        fetchMe();
        return () => {
            cancelled = true;
        };
    }, []);

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
                {displayName && (
                    <div
                        style={{
                            marginLeft: '0.75rem',
                            padding: '0.35rem 0.8rem',
                            borderRadius: '999px',
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            maxWidth: '220px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                        title={displayName}
                    >
                        {displayName}
                    </div>
                )}
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
