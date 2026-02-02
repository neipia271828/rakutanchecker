import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CourseCreate: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [term, setTerm] = useState('early');
    const [totalClasses, setTotalClasses] = useState(15);
    const [isRequired, setIsRequired] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('courses/', {
                name,
                year,
                term,
                total_classes: totalClasses,
                is_required: isRequired
            });
            // Redirect to the new course detail
            navigate(`/courses/${res.data.id}`);
        } catch (err) {
            console.error(err);
            alert('Failed to create course');
        }
    };

    return (
        <div className="container">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1>Create New Course</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">

                    <div className="flex flex-col gap-1">
                        <label htmlFor="name">Course Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--bg-elevated)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                            <label htmlFor="year">Year</label>
                            <input
                                id="year"
                                type="number"
                                value={year}
                                onChange={e => setYear(parseInt(e.target.value))}
                                required
                                style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--bg-elevated)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                            <label htmlFor="term">Term</label>
                            <select
                                id="term"
                                value={term}
                                onChange={e => setTerm(e.target.value)}
                                style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--bg-elevated)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                            >
                                <option value="early">前期 (Early)</option>
                                <option value="late">後期 (Late)</option>
                                <option value="full_year">通年 (Full Year)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="totalClasses">授業数 (Number of Classes)</label>
                        <input
                            id="totalClasses"
                            type="number"
                            value={totalClasses}
                            onChange={e => setTotalClasses(parseInt(e.target.value))}
                            required
                            min={1}
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--bg-elevated)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <input
                            id="isRequired"
                            type="checkbox"
                            checked={isRequired}
                            onChange={e => setIsRequired(e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label htmlFor="isRequired">Required Subject (必修)</label>
                    </div>

                    <button type="submit" style={{ backgroundColor: 'var(--primary)', color: '#000', marginTop: '1rem' }}>
                        Create Course
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CourseCreate;
