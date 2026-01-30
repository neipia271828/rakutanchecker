import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../types';

const Dashboard: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('courses/');
                // Sort by deficit descending (highest risk first), then name
                const sorted = (res.data as Course[]).sort((a, b) => {
                    const defA = a.summary?.deficit || 0;
                    const defB = b.summary?.deficit || 0;
                    if (defA !== defB) return defB - defA;
                    return a.name.localeCompare(b.name);
                });
                setCourses(sorted);
            } catch (err) {
                console.error(err);
                if ((err as any).response?.status === 401) {
                    navigate('/login');
                }
            }
        };
        fetchCourses();
    }, [navigate]);

    return (
        <div className="container">
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <div className="flex items-center gap-2">
                    <h1>Dashboard</h1>
                    <div className="flex" style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius)', marginLeft: '1rem', overflow: 'hidden' }}>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                backgroundColor: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'table' ? '#000' : 'var(--text-primary)',
                                borderRadius: 0,
                                padding: '4px 12px',
                                fontSize: '0.9rem'
                            }}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                backgroundColor: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'grid' ? '#000' : 'var(--text-primary)',
                                borderRadius: 0,
                                padding: '4px 12px',
                                fontSize: '0.9rem'
                            }}
                        >
                            Grid
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/courses/new')}
                    style={{ backgroundColor: 'var(--primary)', color: '#000' }}
                >
                    + New Course
                </button>
            </div>

            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {courses.map(course => {
                        const summary = course.summary;
                        const isRisky = summary?.is_fail_predicted;
                        const isCertainFail = summary?.is_certain_fail;
                        const deficit = summary?.deficit || 0;

                        return (
                            <div
                                key={course.id}
                                className="card"
                                onClick={() => navigate(`/courses/${course.id}`)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    borderLeft: isCertainFail ? '4px solid var(--error)' : isRisky ? '4px solid var(--warning)' : '4px solid var(--success)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div className="flex justify-between items-center">
                                    <h3>{course.name}</h3>
                                    {course.is_required && <span style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--primary-variant)', color: 'white' }}>必修</span>}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: '0.5rem' }}>{course.year} {course.term === 'early' ? '前期' : course.term === 'late' ? '後期' : course.term}</p>

                                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <div>
                                        <div>予想: <b>{summary?.predicted_score?.toFixed(1) ?? '-'}</b></div>
                                        <div>最大: {summary?.max_score?.toFixed(1) ?? '-'}</div>
                                    </div>
                                    {deficit > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="text-warning" style={{ fontWeight: 'bold' }}>不足: {deficit.toFixed(1)}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>合格まで</div>
                                        </div>
                                    )}
                                </div>
                                {isCertainFail && <div className="text-error" style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>落単確定 (最大点不足)</div>}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bg-elevated)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>科目名</th>
                                <th style={{ padding: '1rem' }}>開講時期</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>取得済</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>予想</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>最大</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>状態</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(course => {
                                const summary = course.summary;
                                const isRisky = summary?.is_fail_predicted;
                                const isCertainFail = summary?.is_certain_fail;

                                return (
                                    <tr
                                        key={course.id}
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        style={{
                                            borderBottom: '1px solid var(--bg-surface)',
                                            cursor: 'pointer',
                                            backgroundColor: 'var(--bg-elevated)',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                                    >
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>
                                            <div className="flex items-center gap-2">
                                                {course.name}
                                                {course.is_required && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--primary-variant)', color: 'white' }}>必修</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {course.year} {course.term === 'early' ? '前期' : course.term === 'late' ? '後期' : course.term}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                                            {summary?.current_score?.toFixed(1) ?? '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                                            {summary?.predicted_score?.toFixed(1) ?? '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {summary?.max_score?.toFixed(1) ?? '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {isCertainFail ? (
                                                <span className="text-error" style={{ fontWeight: 'bold' }}>不可</span>
                                            ) : isRisky ? (
                                                <span className="text-warning" style={{ fontWeight: 'bold' }}>注意</span>
                                            ) : (
                                                <span className="text-success" style={{ fontWeight: 'bold' }}>順調</span>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
