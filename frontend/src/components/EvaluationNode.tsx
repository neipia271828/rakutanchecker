import React, { useState } from 'react';
import api from '../api';
import type { EvalNode, EvalEntry } from '../types';

interface EvalNodeProps {
    node: EvalNode;
    entries: { [key: number]: EvalEntry };
    onEntryUpdate: () => void;
    onStructureUpdate: () => void;
    indentLevel?: number;
}

const EvaluationNode: React.FC<EvalNodeProps> = ({ node, entries, onEntryUpdate, onStructureUpdate, indentLevel = 0 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showAddChild, setShowAddChild] = useState(false);
    const [isOpen, setIsOpen] = useState(true); // Default open

    // State for new child form
    const [newChildName, setNewChildName] = useState('');
    const [newChildWeight, setNewChildWeight] = useState(100);
    const [newChildInputType, setNewChildInputType] = useState('score');
    const [newChildIsLeaf, setNewChildIsLeaf] = useState(true);
    const [newChildDueDate, setNewChildDueDate] = useState('');


    // State for leaf entry editing
    const entry = entries[node.id];
    const [earned, setEarned] = useState<number | string>(entry?.earned ?? '');
    const [max, setMax] = useState<number | string>(entry?.max ?? 100);
    const [rate, setRate] = useState<number | string>(entry?.rate ?? '');
    const [attended, setAttended] = useState<number | string>(entry?.attended ?? '');
    const [total, setTotal] = useState<number | string>(entry?.total ?? '');
    const [adjustment, setAdjustment] = useState<number | string>(entry?.adjustment ?? 0);

    const handleCreateChild = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`courses/${node.course}/nodes/`, {
                parent: node.id,
                name: newChildName,
                weight: newChildWeight,
                input_type: newChildIsLeaf ? newChildInputType : 'none',
                is_leaf: newChildIsLeaf,
                order: (node.children?.length || 0) + 1,
                due_date: newChildDueDate || null
            });
            setShowAddChild(false);
            setNewChildName('');
            setNewChildDueDate('');
            onStructureUpdate();

        } catch (err) {
            console.error(err);
            alert('childの作成に失敗しました');
        }
    };

    const handleSaveEntry = async () => {
        try {
            const payload: any = { node: node.id, adjustment: parseFloat(String(adjustment)) || 0 };

            if (node.input_type === 'score' || node.input_type === 'none') {
                payload.earned = parseFloat(String(earned));
                payload.max = parseFloat(String(max));
                payload.status = (payload.earned !== undefined && !isNaN(payload.earned)) ? 'completed' : 'pending';
            } else if (node.input_type === 'rate') {
                payload.rate = parseFloat(String(rate));
                payload.status = (payload.rate !== undefined && !isNaN(payload.rate)) ? 'completed' : 'pending';
            } else if (node.input_type === 'attendance') {
                payload.attended = parseInt(String(attended));
                payload.total = parseInt(String(total));
                payload.status = (payload.attended !== undefined && !isNaN(payload.attended)) ? 'completed' : 'pending';
            }

            await api.post(`courses/${node.course}/entries/`, payload);
            setIsEditing(false);
            onEntryUpdate();
        } catch (err) {
            console.error(err);
            alert('保存に失敗しました');
        }
    };

    return (
        <div style={{ marginLeft: indentLevel > 0 ? '1rem' : 0, borderLeft: indentLevel > 0 ? '1px solid var(--bg-elevated)' : 'none', paddingLeft: indentLevel > 0 ? '1rem' : 0, marginBottom: '0.5rem' }}>
            <div className="card" style={{ padding: '1rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {!node.is_leaf && node.children && node.children.length > 0 && (
                            <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                                {isOpen ? '▼' : '▶'}
                            </button>
                        )}
                        <span style={{ fontWeight: 600 }}>{node.name} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.9em' }}>({node.weight}%)</span></span>
                        {node.due_date && (
                            <span style={{
                                marginLeft: '8px',
                                fontSize: '0.8rem',
                                color: new Date(node.due_date) < new Date() ? 'var(--error)' : 'var(--text-secondary)',
                                border: '1px solid var(--bg-surface)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                期限: {node.due_date}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {/* If it's a leaf, show Edit button for entry */}
                        {node.is_leaf && (
                            <button onClick={() => setIsEditing(!isEditing)} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                                {isEditing ? 'キャンセル' : '入力'}
                            </button>
                        )}
                        {/* Allow adding children if not leaf */}
                        {!node.is_leaf && (
                            <button onClick={() => setShowAddChild(!showAddChild)} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                                + child
                            </button>
                        )}
                    </div>
                </div>

                {/* Input Form for Leaf */}
                {node.is_leaf && (
                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--bg-elevated)', paddingTop: '0.5rem' }}>
                        {isEditing ? (
                            <div className="flex flex-col gap-1">
                                {(node.input_type === 'score' || node.input_type === 'none') && (
                                    <div className="flex gap-1 items-center">
                                        <input type="number" placeholder="Earned" value={earned} onChange={e => setEarned(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                                        <span>/</span>
                                        <input type="number" placeholder="Max" value={max} onChange={e => setMax(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                                    </div>
                                )}
                                {node.input_type === 'rate' && (
                                    <div className="flex gap-1 items-center">
                                        <input type="number" placeholder="Rate %" value={rate} onChange={e => setRate(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                                        <span>%</span>
                                    </div>
                                )}
                                {node.input_type === 'attendance' && (
                                    <div className="flex gap-1 items-center">
                                        <input type="number" placeholder="Attended" value={attended} onChange={e => setAttended(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                                        <span>/</span>
                                        <input type="number" placeholder="Total" value={total} onChange={e => setTotal(e.target.value)} style={{ width: '80px', padding: '4px' }} />
                                    </div>
                                )}
                                <div className="flex gap-1 items-center">
                                    <label style={{ fontSize: '0.8rem' }}>調整点 (+/-): </label>
                                    <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} style={{ width: '60px', padding: '4px' }} />
                                </div>
                                <button onClick={handleSaveEntry} style={{ backgroundColor: 'var(--primary)', color: '#000', alignSelf: 'flex-start', marginTop: '4px' }}>保存</button>
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.9rem' }}>
                                {/* Display Current Value */}
                                {entry ? (
                                    <>
                                        {(node.input_type === 'score' || node.input_type === 'none') && <span>{entry.earned ?? '-'} / {entry.max ?? '-'}</span>}
                                        {node.input_type === 'rate' && <span>{entry.rate ?? '-'} %</span>}
                                        {node.input_type === 'attendance' && <span>{entry.attended ?? '-'} / {entry.total ?? '-'}</span>}
                                        {entry.adjustment !== 0 && <span style={{ marginLeft: '8px', color: 'var(--warning)' }}>調整: {entry.adjustment > 0 ? '+' : ''}{entry.adjustment}</span>}
                                        <span style={{ marginLeft: 'auto', float: 'right', fontSize: '0.8rem', color: entry.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)' }}>
                                            {entry.status === 'completed' ? '入力済' : '未入力'}
                                        </span>
                                    </>
                                ) : <span style={{ color: 'var(--text-secondary)' }}>未入力</span>}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Child Form */}
                {showAddChild && (
                    <form onSubmit={handleCreateChild} className="flex flex-col gap-1" style={{ marginTop: '0.5rem', background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: '4px' }}>
                        <input type="text" placeholder="項目名" value={newChildName} onChange={e => setNewChildName(e.target.value)} required style={{ padding: '4px' }} />
                        <div className="flex gap-1">
                            <input type="number" placeholder="配点" value={newChildWeight} onChange={e => setNewChildWeight(parseFloat(e.target.value))} required style={{ padding: '4px', width: '60px' }} />
                            <span>%</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <input type="checkbox" checked={newChildIsLeaf} onChange={e => setNewChildIsLeaf(e.target.checked)} id={`leaf-${node.id}`} />
                            <label htmlFor={`leaf-${node.id}`}>入力項目にする？</label>
                        </div>
                        {newChildIsLeaf && (
                            <select value={newChildInputType} onChange={e => setNewChildInputType(e.target.value)} style={{ padding: '4px' }}>
                                <option value="score">点数 (得点/満点)</option>
                                <option value="rate">割合 (%)</option>
                                <option value="attendance">出席回数</option>
                            </select>
                        )}
                        <div className="flex gap-1 items-center">
                            <label style={{ fontSize: '0.8rem' }}>期限:</label>
                            <input type="date" value={newChildDueDate} onChange={e => setNewChildDueDate(e.target.value)} style={{ padding: '4px' }} />
                        </div>
                        <button type="submit" style={{ fontSize: '0.8rem', marginTop: '4px' }}>追加</button>
                    </form>
                )}
            </div>

            {/* Recursive Children */}
            {isOpen && node.children && node.children.map((child: EvalNode) => (
                <EvaluationNode
                    key={child.id}
                    node={child}
                    entries={entries}
                    onEntryUpdate={onEntryUpdate}
                    onStructureUpdate={onStructureUpdate}
                    indentLevel={indentLevel + 1}
                />
            ))}
        </div>
    );
};

export default EvaluationNode;
