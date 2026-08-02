import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { getParents, createParent, updateParent, deleteParent } from '../../services/parentService';
import { getStudents } from '../../services/studentService';
import { getClasses } from '../../services/classService';
import { exportToCSV } from '../../utils/excelExporter';
import toast from 'react-hot-toast';

const Parents = () => {
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingParent, setViewingParent] = useState(null);

    // Form state combining User and Parent fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        student_ids: [],
        phone: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [parentRes, studentRes, classRes] = await Promise.all([
                getParents(),
                getStudents(),
                getClasses()
            ]);
            setParents(parentRes.data.parents || []);
            setStudents(studentRes.data.students || []);
            setClasses(classRes.data.classes || []);
        } catch (err) {
            console.error("Failed to fetch parents data:", err);
            setError("Failed to load parents. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleToggleStudent = (studentId) => {
        setFormData(prev => {
            const exists = prev.student_ids.includes(studentId);
            if (exists) {
                return { ...prev, student_ids: prev.student_ids.filter(id => id !== studentId) };
            } else {
                return { ...prev, student_ids: [...prev.student_ids, studentId] };
            }
        });
    };

    const handleSelectAllFilteredStudents = () => {
        const filteredIds = availableStudents.map(s => s.id);
        const allAlreadySelected = filteredIds.every(id => formData.student_ids.includes(id));

        if (allAlreadySelected) {
            // Uncheck all filtered
            setFormData(prev => ({
                ...prev,
                student_ids: prev.student_ids.filter(id => !filteredIds.includes(id))
            }));
        } else {
            // Check all filtered
            const combined = Array.from(new Set([...formData.student_ids, ...filteredIds]));
            setFormData(prev => ({
                ...prev,
                student_ids: combined
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.student_ids.length === 0) {
            toast.error("Please select at least one student (child) for this parent.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const updateData = { ...formData };
                if (!updateData.password) {
                    delete updateData.password;
                }
                await updateParent(editingId, updateData);
                toast.success("Parent updated successfully!");
            } else {
                await createParent(formData);
                toast.success("Parent enrolled successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ 
                name: '', email: '', password: '', 
                student_ids: [], phone: '', address: '' 
            });
            fetchData();
        } catch (err) {
            console.error("Failed to save parent:", err);
            toast.error("Error saving parent: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (row) => {
        setEditingId(row.id);
        setSelectedClassId('');
        setStudentSearch('');
        setFormData({
            name: row.user?.name || '',
            email: row.user?.email || '',
            password: '', 
            student_ids: row.student_ids || (row.students ? row.students.map(s => s.id) : []),
            phone: row.phone || '',
            address: row.address || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this parent completely (including user account)? This cannot be undone.")) {
            try {
                await deleteParent(id);
                fetchData();
                toast.success("Parent deleted successfully!");
            } catch (err) {
                console.error("Failed to delete parent:", err);
                toast.error("Error deleting parent: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: 'Parent Name', 
            render: (row) => <strong>{row.user?.name || 'Unknown'}</strong>
        },
        { 
            header: 'Email', 
            render: (row) => row.user?.email || 'N/A' 
        },
        { 
            header: 'Linked Children (កូនៗ)', 
            render: (row) => {
                const kids = row.students || [];
                if (kids.length === 0) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>;
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {kids.map(k => (
                            <span key={k.id} style={{
                                backgroundColor: '#e0e7ff', color: '#4338ca',
                                padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600'
                            }}>
                                {k.user?.name} ({k.student_code})
                            </span>
                        ))}
                    </div>
                );
            } 
        },
        { header: 'Phone', accessor: 'phone' },
        { 
            header: 'Actions', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setViewingParent(row); }}
                        title="View Parent Details 👁️"
                    >
                        👁️
                    </Button>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>Edit</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>Delete</Button>
                </div>
            )
        }
    ];

    const filteredParents = parents.filter(p => 
        (p.user?.name && p.user.name.toLowerCase().includes(search.toLowerCase())) || 
        (p.students && p.students.some(s => s.user?.name?.toLowerCase().includes(search.toLowerCase())))
    );

    const availableStudents = students.filter(s => {
        const matchClass = selectedClassId ? String(s.class_id) === String(selectedClassId) : true;
        const matchSearch = studentSearch ? (
            s.user?.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.student_code?.toLowerCase().includes(studentSearch.toLowerCase())
        ) : true;
        return matchClass && matchSearch;
    });

    const isAllFilteredSelected = availableStudents.length > 0 && availableStudents.every(s => formData.student_ids.includes(s.id));

    const handleExportParentsExcel = () => {
        const exportCols = [
            { header: 'ID', accessor: 'id' },
            { header: 'ឈ្មោះអាណាព្យាបាល (Parent Name)', renderText: (p) => p.user?.name || '-' },
            { header: 'អ៊ីមែល (Email)', renderText: (p) => p.user?.email || '-' },
            { header: 'លេខទូរស័ព្ទ (Phone)', renderText: (p) => p.phone || '-' },
            { header: 'កូនៗក្នុងបន្ទុក (Linked Children)', renderText: (p) => (p.students || []).map(s => `${s.user?.name || 'S'} (${s.school_class?.name || 'N/A'})`).join('; ') },
            { header: 'អាសយដ្ឋាន (Address)', renderText: (p) => p.address || '-' },
        ];

        exportToCSV(`Parents_List_${new Date().toISOString().slice(0, 10)}.csv`, exportCols, filteredParents);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Manage Parents (គ្រប់គ្រងមាតាបិតាសិស្ស)</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="secondary" onClick={handleExportParentsExcel}>
                        📥 Export Excel
                    </Button>
                    <Button onClick={() => { 
                        setEditingId(null); 
                        setSelectedClassId('');
                        setStudentSearch('');
                        setFormData({ 
                            name: '', email: '', password: '', 
                            student_ids: [], phone: '', address: '' 
                        }); 
                        setIsModalOpen(true); 
                    }}>
                        + Add Parent
                    </Button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
                        Enroll parents and link them to their children (supports multiple children selection).
                    </p>
                    <div style={{ width: '300px' }}>
                        <Input 
                            placeholder="Search by parent or child name..." 
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
                
                {loading ? (
                    <p>Loading parents...</p>
                ) : (
                    <Table columns={columns} data={filteredParents} />
                )}
            </Card>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={editingId ? 'Edit Parent Profile (កែប្រែមាតាបិតាសិស្ស)' : 'Enroll New Parent (បន្ថែមអាណាព្យាបាលថ្មី)'}
                maxWidth="720px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Parent'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Section 1: Account & Contact Details */}
                    <div style={{ background: '#f8fafc', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#4f46e5', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                            👤 គណនីចូលប្រព័ន្ធ & ព័ត៌មានទំនាក់ទំនង (Account & Contact Details)
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input 
                                label="Full Name (ឈ្មោះពេញ)" 
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. Sok Dara"
                            />
                            <Input 
                                label="Email Address (អ៊ីមែល)" 
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="parent@school.com"
                            />
                            <Input 
                                label={editingId ? "Password (leave blank to keep current)" : "Password (ពាក្យសម្ងាត់)"} 
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!editingId}
                                minLength={6}
                                placeholder="••••••••"
                            />
                            <Input 
                                label="Phone Number (លេខទូរស័ព្ទ)" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="e.g. 012 345 678"
                            />
                        </div>
                        <div style={{ marginTop: '0.75rem' }}>
                            <Input 
                                label="Address (អាសយដ្ឋាន)" 
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="e.g. Khan Sen Sok, Phnom Penh"
                            />
                        </div>
                    </div>

                    {/* Section 2: Multiple Children Linking Section */}
                    <div style={{ background: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#059669', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                            👨‍👩‍👧‍👦 Link Children (ជ្រើសរើសកូនៗ) - Selected: {formData.student_ids.length}
                        </h4>
                        
                        {/* Currently Selected Badges */}
                        {formData.student_ids.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                {formData.student_ids.map(sId => {
                                    const st = students.find(s => s.id === sId);
                                    return (
                                        <span key={sId} style={{
                                            backgroundColor: '#16a34a', color: 'white',
                                            padding: '0.3rem 0.7rem', borderRadius: '14px', fontSize: '0.85rem',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500'
                                        }}>
                                            {st?.user?.name || `ID: ${sId}`}
                                            <span 
                                                onClick={() => handleToggleStudent(sId)}
                                                style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }}
                                                title="Remove"
                                            >
                                                ✕
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            {/* Class Filter & Student Search Controls */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '500', color: '#475569' }}>Filter Class</label>
                                    <select 
                                        value={selectedClassId} 
                                        onChange={(e) => setSelectedClassId(e.target.value)} 
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    >
                                        <option value="">-- All Classes --</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.grade_level})</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '500', color: '#475569' }}>Search Student</label>
                                    <input 
                                        type="text"
                                        placeholder="Type name or code..."
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    />
                                </div>
                            </div>

                            {/* Select All Filtered Button */}
                            {availableStudents.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Showing {availableStudents.length} students</span>
                                    <Button 
                                        type="button" 
                                        size="small" 
                                        variant="secondary"
                                        onClick={handleSelectAllFilteredStudents}
                                    >
                                        {isAllFilteredSelected ? 'Unselect All Shown' : '☑️ Select All Shown'}
                                    </Button>
                                </div>
                            )}

                            {/* Multi-Select Student Checklist */}
                            <div style={{
                                maxHeight: '180px', overflowY: 'auto', border: '1px solid #cbd5e1',
                                borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
                                background: '#fafafa'
                            }}>
                                {availableStudents.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: '0.5rem', textAlign: 'center' }}>No students found.</p>
                                ) : (
                                    availableStudents.map(s => {
                                        const isChecked = formData.student_ids.includes(s.id);
                                        return (
                                            <label 
                                                key={s.id} 
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                    padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
                                                    backgroundColor: isChecked ? '#e0e7ff' : 'white',
                                                    border: isChecked ? '1px solid #6366f1' : '1px solid #e2e8f0',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={() => handleToggleStudent(s.id)}
                                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontWeight: isChecked ? '600' : '400', color: isChecked ? '#3730a3' : '#1e293b' }}>
                                                    {s.user?.name} ({s.student_code})
                                                </span>
                                                {s.school_class && (
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                                        {s.school_class.name}
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                </form>
            </Modal>

            {/* View Parent Details Modal (👁️) */}
            <Modal 
                isOpen={!!viewingParent} 
                onClose={() => setViewingParent(null)}
                title={`Parent Profile & Linked Children - ${viewingParent?.user?.name || ''} 👁️`}
                maxWidth="650px"
                footer={
                    <Button variant="secondary" onClick={() => setViewingParent(null)}>Close</Button>
                }
            >
                {viewingParent && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        
                        {/* Header Profile Info */}
                        <div style={{ display: 'flex', gap: '1.25rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {viewingParent.user?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.2rem' }}>{viewingParent.user?.name}</h3>
                                <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.88rem' }}>📧 {viewingParent.user?.email || 'N/A'}</p>
                                <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                                    👪 Parent / Guardian (អាណាព្យាបាល)
                                </span>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📞 Contact Information (ព័ត៌មានទំនាក់ទំនង)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Phone Number (លេខទូរស័ព្ទ)</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>📞 {viewingParent.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Address (អាសយដ្ឋាន/ទីកន្លែងស្នាក់នៅ)</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>📍 {viewingParent.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Linked Children Roster */}
                        <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>👧👦 Linked Children (បញ្ជីឈ្មោះកូនៗ)</span>
                                <span style={{ fontSize: '0.8rem', color: '#4f46e5', textTransform: 'none', fontWeight: '700' }}>
                                    👥 {viewingParent.students?.length || 0} Children Linked
                                </span>
                            </h4>

                            {viewingParent.students && viewingParent.students.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {viewingParent.students.map(child => (
                                        <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                                            <div>
                                                <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.92rem' }}>🎓 {child.user?.name || 'Unknown'}</strong>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Code: {child.student_code} | Gender: {child.gender || 'N/A'}</span>
                                            </div>
                                            <div>
                                                {child.school_class ? (
                                                    <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700' }}>
                                                        🏫 {child.school_class.name} ({child.school_class.grade_level})
                                                    </span>
                                                ) : (
                                                    <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.82rem' }}>Unassigned Class</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ margin: 0, fontStyle: 'italic', color: '#94a3b8' }}>No children linked to this parent profile.</p>
                            )}
                        </div>

                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Parents;
