import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import EvaluationNode from '../components/EvaluationNode';
import type { Course, EvalNode, EvalEntry, CourseSummary } from '../types';

const CourseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [nodes, setNodes] = useState<EvalNode[]>([]);
    const [entries, setEntries] = useState<EvalEntry[]>([]);
    const [summary, setSummary] = useState<CourseSummary | null>(null);

    const fetchData = async () => {
        if (!id) return;
        try {
            const [courseRes, nodesRes, entriesRes, summaryRes] = await Promise.all([
                api.get(`courses/${id}/`),
                api.get(`courses/${id}/nodes/`),
                api.get(`courses/${id}/entries/`),
                api.get(`courses/${id}/summary/`)
            ]);
            setCourse(courseRes.data);
            setNodes(nodesRes.data);
            setEntries(entriesRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Convert entries array to map for easy lookup
    const entriesMap = useMemo(() => {
        const map: { [key: number]: EvalEntry } = {};
        entries.forEach(entry => {
            map[entry.node] = entry;
        });
        return map;
    }, [entries]);

    const handleCreateRoot = async () => {
        const name = prompt("ルート項目名を入力してください（例: 成績、全体評価）");
        if (!name) return;
        try {
            // Create root as container (is_leaf=false) to allow adding children
            await api.post(`courses/${id}/nodes/`, {
                course: id,
                parent: null,
                name: name,
                weight: 100,
                input_type: 'none',
                is_leaf: false,
                order: 0
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('ルート項目の作成に失敗しました');
        }
    };

    const handleRefresh = () => {
        fetchData();
    };

    if (!course) return <div className="container">Loading...</div>;

    return (
        <div className='container'>
            <h1 style={{ marginBottom: '0.5rem' }}>{course.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {course.year} {course.term === 'early' ? '前期' : course.term === 'late' ? '後期' : course.term}
                {course.is_required && ' (必修)'}
            </p>

            {/* Summary Section */}
            {summary && (
                <div className='card flex flex-col gap-2' style={{ borderColor: summary.is_fail_predicted ? 'var(--error)' : 'var(--success)', borderWidth: '1px', borderStyle: 'solid' }}>
                    <div className="flex justify-between items-center">
                        <h2>成績状況</h2>
                        <span className={summary.is_fail_predicted ? 'text-error' : 'text-success'} style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                            {summary.is_fail_predicted ? '危険' : '合格圏'}
                        </span>
                    </div>

                    <div className="flex justify-between" style={{ textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>取得済</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.current_score.toFixed(1)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>予想</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.predicted_score.toFixed(1)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>最大</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.max_score.toFixed(1)}</div>
                        </div>
                    </div>

                    {/* Visualization: Stacked Bar */}
                    <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', position: 'relative' }}>
                        {/* Threshold Line */}
                        <div style={{
                            position: 'absolute',
                            left: `${summary.threshold}%`,
                            top: '-6px',
                            bottom: '-6px',
                            width: '2px',
                            backgroundColor: '#ffffff',
                            zIndex: 10,
                            boxShadow: '0 0 4px rgba(0,0,0,0.8)'
                        }} title={`Border: ${summary.threshold}%`} />

                        {/* Threshold Label */}
                        <div style={{
                            position: 'absolute',
                            left: `${summary.threshold}%`,
                            top: '-24px',
                            transform: 'translateX(-50%)',
                            fontSize: '0.75rem',
                            color: 'var(--text-primary)',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                        }}>
                            Border {summary.threshold}
                        </div>

                        <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-elevated)' }}>
                            {/* Secured: current_score */}
                            <div style={{ width: `${summary.current_score}%`, backgroundColor: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Secured">
                                {summary.current_score > 8 && <span style={{ fontSize: '0.7rem', color: '#000', fontWeight: 'bold' }}>{Math.round(summary.current_score)}</span>}
                            </div>

                            {/* Estimate Get: predicted_score - current_score */}
                            <div style={{ width: `${summary.predicted_score - summary.current_score}%`, backgroundColor: 'var(--success)', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Est. Get">
                                {(summary.predicted_score - summary.current_score) > 8 && <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }}>{Math.round(summary.predicted_score - summary.current_score)}</span>}
                            </div>

                            {/* Estimate Lost: max_score - predicted_score */}
                            <div style={{ width: `${summary.max_score - summary.predicted_score}%`, backgroundColor: 'var(--warning)', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Est. Lost">
                                {(summary.max_score - summary.predicted_score) > 8 && <span style={{ fontSize: '0.7rem', color: '#000', fontWeight: 'bold' }}>{Math.round(summary.max_score - summary.predicted_score)}</span>}
                            </div>

                            {/* Lost: 100 - max_score */}
                            <div style={{ width: `${100 - summary.max_score}%`, backgroundColor: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Lost">
                                {(100 - summary.max_score) > 8 && <span style={{ fontSize: '0.7rem', color: '#000', fontWeight: 'bold' }}>{Math.round(100 - summary.max_score)}</span>}
                            </div>
                        </div>
                        <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <div className="flex gap-2">
                                <span style={{ color: 'var(--success)' }}>● 取得済</span>
                                <span style={{ color: 'var(--success)', opacity: 0.5 }}>● 取得見込</span>
                            </div>
                            <div className="flex gap-2">
                                <span style={{ color: 'var(--warning)' }}>● 失点見込</span>
                                <span style={{ color: 'var(--error)' }}>● 確定失点</span>
                            </div>
                        </div>
                    </div>

                    {summary.is_certain_fail && (
                        <div className="text-error" style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '1rem' }}>
                            落単確定 (最大点 &lt; {summary.threshold})
                        </div>
                    )}
                </div>
            )}

            {/* Tree Section */}
            <h2 style={{ marginTop: '2rem' }}>評価内訳</h2>
            {nodes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ marginBottom: '1rem' }}>評価項目がまだありません。</p>
                    <button onClick={handleCreateRoot} style={{ backgroundColor: 'var(--primary)', color: '#000' }}>
                        評価項目を作成する
                    </button>
                </div>
            ) : (
                <div>
                    {nodes.map(node => (
                        <EvaluationNode
                            key={node.id}
                            node={node}
                            entries={entriesMap}
                            onEntryUpdate={handleRefresh}
                            onStructureUpdate={handleRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseDetail;
