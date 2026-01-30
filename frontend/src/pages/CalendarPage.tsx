import React, { useEffect, useState } from 'react';
import api from '../api';

interface Event {
    id: number;
    name: string;
    course_name: string;
    due_date: string;
    input_type: string;
    weight: number;
}

const CalendarPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [view, setView] = useState<'calendar' | 'weekly'>('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('events/');
                setEvents(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchEvents();
    }, []);

    // Navigation handlers
    const prev = () => {
        const newDate = new Date(currentDate);
        if (view === 'calendar') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        setCurrentDate(newDate);
    };

    const next = () => {
        const newDate = new Date(currentDate);
        if (view === 'calendar') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        setCurrentDate(newDate);
    };

    const today = () => setCurrentDate(new Date());

    // Filter events based on view type
    // Request: "Calendar: Tests etc (important)", "Weekly: Attendance etc (frequent)"
    // We can filter by input_type. 'score'/'rate' -> important? 'attendance' -> frequent?
    // 'none' is intermediate, probably won't have due_date usually?
    const getFilteredEvents = () => {
        if (view === 'calendar') {
            // Calendar: Show major events (exclude attendance)
            return events.filter(e => e.input_type !== 'attendance');
        } else {
            // Weekly: Show ALL events (attendance + tasks)
            return events;
        }
    };

    const filteredEvents = getFilteredEvents();

    // Calendar generation helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Pad start
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        // Days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const getDaysInWeek = (date: Date) => {
        // Start from Sunday? Or Monday? Let's do Sunday start.
        const day = date.getDay();
        const start = new Date(date);
        start.setDate(date.getDate() - day);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const getEventsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return filteredEvents.filter(e => e.due_date === dateStr);
    };

    const renderCalendar = () => {
        const days = getDaysInMonth(currentDate);
        const weeks: (Date | null)[][] = [];
        let week: (Date | null)[] = [];

        days.forEach((day) => {
            week.push(day);
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        });
        if (week.length > 0) {
            // Pad end
            while (week.length < 7) week.push(null);
            weeks.push(week);
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bg-elevated)' }}>
                {/* Header Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
                    {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                        <div key={d} style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', backgroundColor: 'var(--bg-surface)' }}>{d}</div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
                    {/* Weeks */}
                    {weeks.flat().map((date, i) => (
                        <div key={i} style={{
                            minHeight: '100px',
                            backgroundColor: 'var(--bg-surface)',
                            padding: '0.5rem',
                            opacity: date ? 1 : 0.5
                        }}>
                            {date && (
                                <>
                                    <div style={{
                                        fontWeight: date.toDateString() === new Date().toDateString() ? 'bold' : 'normal',
                                        color: date.toDateString() === new Date().toDateString() ? 'var(--primary)' : 'inherit',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {date.getDate()}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {getEventsForDay(date).map(ev => (
                                            <div key={ev.id} style={{
                                                fontSize: '0.75rem',
                                                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                                                borderLeft: '2px solid var(--success)',
                                                padding: '2px 4px',
                                                borderRadius: '2px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }} title={`${ev.course_name}: ${ev.name}`}>
                                                {ev.course_name.substring(0, 5)}...: {ev.name}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderWeekly = () => {
        const days = getDaysInWeek(currentDate);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {days.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayEvents = getEventsForDay(date);
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                        <div key={dateStr} className="card" style={{
                            borderColor: isToday ? 'var(--primary)' : 'transparent',
                            borderWidth: isToday ? '1px' : '0'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: isToday ? 'var(--primary)' : 'inherit' }}>
                                {date.toLocaleDateString('ja-JP', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                            </div>
                            {dayEvents.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>予定なし</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {dayEvents.map(ev => (
                                        <div key={ev.id} style={{
                                            padding: '0.5rem',
                                            backgroundColor: 'var(--bg-surface)',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{ev.course_name}</div>
                                                <div style={{ fontSize: '0.85rem' }}>{ev.name}</div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {ev.input_type === 'attendance' ? '出席' : '課題'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="container">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div className="flex items-center gap-2">
                    <h1>スケジュール</h1>
                    <div className="flex" style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius)', marginLeft: '1rem', overflow: 'hidden' }}>
                        <button
                            onClick={() => setView('calendar')}
                            style={{
                                backgroundColor: view === 'calendar' ? 'var(--primary)' : 'transparent',
                                color: view === 'calendar' ? '#000' : 'var(--text-primary)',
                                borderRadius: 0,
                                padding: '4px 12px',
                                fontSize: '0.9rem'
                            }}
                        >
                            カレンダー
                        </button>
                        <button
                            onClick={() => setView('weekly')}
                            style={{
                                backgroundColor: view === 'weekly' ? 'var(--primary)' : 'transparent',
                                color: view === 'weekly' ? '#000' : 'var(--text-primary)',
                                borderRadius: 0,
                                padding: '4px 12px',
                                fontSize: '0.9rem'
                            }}
                        >
                            ウィークリー
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={prev} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>&lt;</button>
                    <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center' }}>
                        {view === 'calendar'
                            ? currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
                            : `週: ${currentDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}`
                        }
                    </span>
                    <button onClick={next} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>&gt;</button>
                    <button onClick={today} style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>今日</button>
                </div>
            </div>

            {view === 'calendar' ? renderCalendar() : renderWeekly()}
        </div>
    );
};

export default CalendarPage;
