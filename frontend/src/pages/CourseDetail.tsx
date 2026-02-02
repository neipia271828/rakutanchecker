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
    const [showCreateRoot, setShowCreateRoot] = useState(false);
    const [newRootName, setNewRootName] = useState('');

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
        console.log("CourseDetail loaded - v2");
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

    const openCreateRootModal = () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/100ed86f-04e8-4341-85c1-44d471a9a0a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseDetail.tsx:openCreateRootModal',message:'クリック:評価項目作成モーダル表示',data:{courseId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setNewRootName('');
        setShowCreateRoot(true);
    };

    const submitCreateRoot = async () => {
        const name = newRootName.trim();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/100ed86f-04e8-4341-85c1-44d471a9a0a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseDetail.tsx:submitCreateRoot',message:'送信:評価項目作成',data:{courseId:id,hasName:!!name,nameLen:name.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        if (!name) {
            alert('項目名を入力してください');
            return;
        }
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/100ed86f-04e8-4341-85c1-44d471a9a0a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseDetail.tsx:submitCreateRoot',message:'API呼び出し開始 courses/:id/nodes',data:{courseId:id,name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion

            // Create root as container (is_leaf=false) to allow adding children
            await api.post(`courses/${id}/nodes/`, {
                parent: null,
                name: name,
                weight: 100,
                input_type: 'none',
                is_leaf: false,
                order: 0
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/100ed86f-04e8-4341-85c1-44d471a9a0a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseDetail.tsx:submitCreateRoot',message:'API成功 courses/:id/nodes',data:{courseId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            setShowCreateRoot(false);
            fetchData();
        } catch (err) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/100ed86f-04e8-4341-85c1-44d471a9a0a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseDetail.tsx:submitCreateRoot',message:'API失敗 courses/:id/nodes',data:{status:(err as any)?.response?.status,detail:(err as any)?.response?.data,error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            console.error(err);
            const detail = (err as any)?.response?.data;
            alert(`ルート項目の作成に失敗しました: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
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

            {showCreateRoot && (
                <div
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setShowCreateRoot(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '16px',
                    }}
                >
                    <div
                        className="card"
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 'min(520px, 100%)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>ルート評価項目を作成</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            例: 「全体評価」「成績」など
                        </div>
                        <input
                            value={newRootName}
                            onChange={(e) => setNewRootName(e.target.value)}
                            placeholder="ルート項目名"
                            autoFocus
                            style={{ width: '100%' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') submitCreateRoot();
                                if (e.key === 'Escape') setShowCreateRoot(false);
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setShowCreateRoot(false)} style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                                キャンセル
                            </button>
                            <button onClick={submitCreateRoot} style={{ backgroundColor: 'var(--primary)', color: '#000' }}>
                                作成
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Section */}
            {summary && (
                <div className='card flex flex-col gap-2' style={{
                    borderColor: summary.current_score === 0 ? 'var(--border)' : (summary.is_fail_predicted ? 'var(--error)' : 'var(--success)'),
                    borderWidth: '1px',
                    borderStyle: 'solid'
                }}>
                    <div className="flex justify-between items-center">
                        <h2>成績状況</h2>
                        <span
                            className={summary.current_score === 0 ? '' : (summary.is_fail_predicted ? 'text-error' : 'text-success')}
                            style={{
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                color: summary.current_score === 0 ? 'var(--text-secondary)' : undefined
                            }}
                        >
                            {summary.current_score === 0 ? '未入力' : (summary.is_fail_predicted ? '危険' : '合格圏')}
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
                        {/* 60% Threshold Line (Passing) */}
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

                        {/* 60% Threshold Label */}
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

                        {/* 30% Threshold Line (Grade Retention) */}
                        <div style={{
                            position: 'absolute',
                            left: '30%',
                            top: '-6px',
                            bottom: '-6px',
                            width: '2px',
                            backgroundColor: 'var(--error)',
                            zIndex: 10,
                            boxShadow: '0 0 4px rgba(0,0,0,0.8)'
                        }} title="留年確定ライン: 30%" />

                        {/* 30% Threshold Label */}
                        <div style={{
                            position: 'absolute',
                            left: '30%',
                            top: '-24px',
                            transform: 'translateX(-50%)',
                            fontSize: '0.75rem',
                            color: 'var(--error)',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                        }}>
                            留年 30
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

                    {/* Attendance Visualization Bar */}
                    <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>出席状況 ({summary.current_attended}/{course.total_classes})</h3>
                            <div className="flex items-center gap-2">
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    出席率: {Math.round(summary.attendance_rate)}%
                                </span>
                                <span
                                    className={summary.is_attendance_safe ? 'text-success' : 'text-error'}
                                    style={{
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: summary.is_attendance_safe ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                                    }}
                                >
                                    {summary.is_attendance_safe ? '合格圏' : '不合格'}
                                </span>
                            </div>
                        </div>

                        {/* Attendance Bar */}
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            {/* 2/3 Attendance Threshold Line (1/3 Absence = Fail) */}
                            <div style={{
                                position: 'absolute',
                                left: '66.67%',
                                top: '-6px',
                                bottom: '-6px',
                                width: '2px',
                                backgroundColor: 'var(--error)',
                                zIndex: 10,
                                boxShadow: '0 0 4px rgba(0,0,0,0.8)'
                            }} title="欠席1/3で落単" />

                            {/* 2/3 Threshold Label */}
                            <div style={{
                                position: 'absolute',
                                left: '66.67%',
                                top: '-24px',
                                transform: 'translateX(-50%)',
                                fontSize: '0.75rem',
                                color: 'var(--error)',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                            }}>
                                欠席1/3
                            </div>

                            <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-elevated)' }}>
                                {/* Attended */}
                                <div style={{
                                    width: `${summary.attendance_rate}%`,
                                    backgroundColor: summary.attendance_rate >= 66.67 ? 'var(--primary)' : 'var(--error)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }} title={`出席: ${summary.current_attended}回`}>
                                    {summary.attendance_rate > 10 && <span style={{ fontSize: '0.7rem', color: '#000', fontWeight: 'bold' }}>{summary.current_attended}</span>}
                                </div>

                                {/* Absent */}
                                <div style={{
                                    width: `${100 - summary.attendance_rate}%`,
                                    backgroundColor: 'var(--bg-surface)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--border)'
                                }} title={`欠席: ${course.total_classes - summary.current_attended}回`}>
                                    {(100 - summary.attendance_rate) > 10 && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{course.total_classes - summary.current_attended}</span>}
                                </div>
                            </div>

                            <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                <div className="flex gap-2">
                                    <span style={{ color: summary.attendance_rate >= 66.67 ? 'var(--primary)' : 'var(--error)' }}>● 出席 {summary.current_attended}回</span>
                                </div>
                                <div className="flex gap-2">
                                    <span style={{ color: 'var(--text-secondary)' }}>● 欠席 {course.total_classes - summary.current_attended}回</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Box UI */}
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>出席チェック ({summary.current_attended}/{course.total_classes})</h3>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Rate: {Math.round(summary.attendance_rate)}%
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Array.from({ length: course.total_classes }).map((_, index) => {
                                // Bit indices: 0 = 1st class, 1 = 2nd class...
                                // Check if bit at index is 1
                                // Note: Typescript number is float, but bitwise works on 32bit ints.
                                // For >32 classes we'd need BigInt, but JS requires 'n' suffix or BigInt wrapper.
                                // Let's assume standard JS number (max safe integer 2^53) is safe for bitmask < 53 bits (classes).
                                // 1 << index works for index < 31. For >= 31 we need BigInt.
                                // Let's use BigInt for safety if classes > 30.

                                const mask = BigInt(course.attendance_mask);
                                const isAttended = (mask & (1n << BigInt(index))) !== 0n;

                                return (
                                    <div
                                        key={index}
                                        onClick={async () => {
                                            const currentMask = BigInt(course.attendance_mask);
                                            const bit = 1n << BigInt(index);
                                            let newMask;
                                            if (isAttended) {
                                                newMask = currentMask & ~bit;
                                            } else {
                                                newMask = currentMask | bit;
                                            }

                                            // Optimistic update
                                            setCourse({ ...course, attendance_mask: Number(newMask) });

                                            try {
                                                // Convert BigInt back to string for JSON if needed, but standard JSON doesn't support BigInt.
                                                // We should send it as string or ensure backend handles integer properly.
                                                // Backend expects integer. JS can send large int as number if < 2^53.
                                                // Update attendance via new endpoint
                                                await api.patch(`courses/${id}/attendance/`, { attendance_mask: newMask.toString() });
                                                fetchData();
                                            } catch (err) {
                                                console.error(err);
                                                // Revert on error
                                                setCourse({ ...course, attendance_mask: Number(currentMask) });
                                            }
                                        }}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            backgroundColor: isAttended ? 'var(--primary)' : 'var(--bg-elevated)',
                                            border: `1px solid ${isAttended ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isAttended ? '#000' : 'var(--text-secondary)',
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title={`第${index + 1}回`}
                                    >
                                        {index + 1}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {summary.is_certain_fail && (
                        <div className="text-error" style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '1rem' }}>
                            落単確定 (最大点 &lt; {summary.threshold})
                        </div>
                    )}
                    {summary.is_attendance_fail && (
                        <div className="text-error" style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '0.5rem' }}>
                            出席不足により落単 (欠席 &gt; 1/3)
                        </div>
                    )}
                </div>
            )}

            {/* Tree Section */}
            <h2 style={{ marginTop: '2rem' }}>評価内訳</h2>
            {nodes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ marginBottom: '1rem' }}>評価項目がまだありません。</p>
                    <button onClick={openCreateRootModal} style={{ backgroundColor: 'var(--primary)', color: '#000' }}>
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
