import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear } from '../../services/academicYearService';
import { getSemesters, createSemester, updateSemester, deleteSemester } from '../../services/semesterService';
import { getAssessments, createAssessment, updateAssessment, deleteAssessment } from '../../services/assessmentService';
import toast from 'react-hot-toast';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('academic_years'); // academic_years, semesters, assessments

    // Data states
    const [academicYears, setAcademicYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [assessments, setAssessments] = useState([]);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form states
    const [ayForm, setAyForm] = useState({ name: '', start_date: '', end_date: '' });
    const [semForm, setSemForm] = useState({ academic_year_id: '', name: '', start_date: '', end_date: '' });
    const [assForm, setAssForm] = useState({ semester_id: '', name: '', type: 'monthly', month: '', max_score: '100', date: '' });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ayRes, semRes, assRes] = await Promise.all([
                getAcademicYears(),
                getSemesters(),
                getAssessments()
            ]);
            setAcademicYears(ayRes.data.academic_years || []);
            setSemesters(semRes.data.semesters || []);
            setAssessments(assRes.data.assessments || []);
        } catch (err) {
            console.error("Failed to fetch settings data:", err);
            setError("Failed to load settings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers
    const handleAySubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateAcademicYear(editingId, ayForm);
                toast.success("Academic year updated successfully!");
            } else {
                await createAcademicYear(ayForm);
                toast.success("Academic year created successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setAyForm({ name: '', start_date: '', end_date: '' });
            fetchData();
        } catch (err) {
            toast.error("Error saving academic year: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSemSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateSemester(editingId, semForm);
                toast.success("Semester updated successfully!");
            } else {
                await createSemester(semForm);
                toast.success("Semester created successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setSemForm({ academic_year_id: '', name: '', start_date: '', end_date: '' });
            fetchData();
        } catch (err) {
            toast.error("Error saving semester: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateAssessment(editingId, assForm);
                toast.success("Assessment updated successfully!");
            } else {
                await createAssessment(assForm);
                toast.success("Assessment created successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setAssForm({ semester_id: '', name: '', type: 'monthly', month: '', max_score: '100', date: '' });
            fetchData();
        } catch (err) {
            toast.error("Error saving assessment: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (type, row) => {
        setEditingId(row.id);
        if (type === 'academic_year') {
            setAyForm({ name: row.name, start_date: row.start_date, end_date: row.end_date });
        } else if (type === 'semester') {
            setSemForm({ academic_year_id: row.academic_year_id, name: row.name, start_date: row.start_date, end_date: row.end_date });
        } else if (type === 'assessment') {
            setAssForm({ semester_id: row.semester_id, name: row.name, type: row.type, month: row.month || '', max_score: row.max_score, date: row.date || '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            if (type === 'academic_year') await deleteAcademicYear(id);
            if (type === 'semester') await deleteSemester(id);
            if (type === 'assessment') await deleteAssessment(id);
            fetchData();
            toast.success(`${type} deleted successfully!`);
        } catch (err) {
            toast.error(`Error deleting ${type}: ` + (err.response?.data?.message || err.message));
        }
    };

    // Columns
    const ayColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Academic Year', accessor: 'name' },
        { header: 'Start Date', accessor: 'start_date' },
        { header: 'End Date', accessor: 'end_date' },
        { 
            header: 'Status', 
            render: (row) => (
                <span style={{ 
                    color: row.status ? 'green' : 'red', 
                    padding: '0.2rem 0.5rem', background: row.status ? '#e6fffa' : '#fed7d7', borderRadius: '4px'
                }}>
                    {row.status ? 'Active' : 'Inactive'}
                </span>
            )
        },
        { 
            header: 'Actions', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick('academic_year', row); }}>Edit</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete('academic_year', row.id)}>Delete</Button>
                </div>
            )
        }
    ];

    const semColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Semester', accessor: 'name' },
        { header: 'Academic Year', render: (row) => row.academic_year?.name || 'Unknown' },
        { header: 'Start Date', accessor: 'start_date' },
        { header: 'End Date', accessor: 'end_date' },
        { 
            header: 'Actions', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick('semester', row); }}>Edit</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete('semester', row.id)}>Delete</Button>
                </div>
            )
        }
    ];

    const assColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'name' },
        { header: 'Type', accessor: 'type' },
        { header: 'Semester', render: (row) => row.semester?.name || 'Unknown' },
        { header: 'Max Score', accessor: 'max_score' },
        { header: 'Date/Month', render: (row) => row.date || row.month || 'N/A' },
        { 
            header: 'Actions', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick('assessment', row); }}>Edit</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete('assessment', row.id)}>Delete</Button>
                </div>
            )
        }
    ];

    // Styles for tabs
    const tabStyle = (isActive) => ({
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
        color: isActive ? '#3b82f6' : '#64748b',
        fontWeight: isActive ? '600' : '400',
        background: 'none',
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        fontSize: '1rem'
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Advanced Settings</h1>
                <Button onClick={() => { 
                    setEditingId(null); 
                    setAyForm({ name: '', start_date: '', end_date: '' });
                    setSemForm({ academic_year_id: '', name: '', start_date: '', end_date: '' });
                    setAssForm({ semester_id: '', name: '', type: 'monthly', month: '', max_score: '100', date: '' });
                    setIsModalOpen(true); 
                }}>
                    + Add {activeTab === 'academic_years' ? 'Academic Year' : activeTab === 'semesters' ? 'Semester' : 'Assessment'}
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <Card>
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <button style={tabStyle(activeTab === 'academic_years')} onClick={() => setActiveTab('academic_years')}>Academic Years</button>
                    <button style={tabStyle(activeTab === 'semesters')} onClick={() => setActiveTab('semesters')}>Semesters</button>
                    <button style={tabStyle(activeTab === 'assessments')} onClick={() => setActiveTab('assessments')}>Assessments</button>
                </div>
                
                {loading ? (
                    <p>Loading settings data...</p>
                ) : (
                    <>
                        {activeTab === 'academic_years' && <Table columns={ayColumns} data={academicYears} />}
                        {activeTab === 'semesters' && <Table columns={semColumns} data={semesters} />}
                        {activeTab === 'assessments' && <Table columns={assColumns} data={assessments} />}
                    </>
                )}
            </Card>

            {/* MODALS */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={`${editingId ? 'Edit' : 'Add New'} ${activeTab === 'academic_years' ? 'Academic Year' : activeTab === 'semesters' ? 'Semester' : 'Assessment'}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={activeTab === 'academic_years' ? handleAySubmit : activeTab === 'semesters' ? handleSemSubmit : handleAssSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </>
                }
            >
                {/* Academic Year Form */}
                {activeTab === 'academic_years' && (
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input label="Name (e.g. 2024-2025)" value={ayForm.name} onChange={(e) => setAyForm({...ayForm, name: e.target.value})} required />
                        <Input label="Start Date" type="date" value={ayForm.start_date} onChange={(e) => setAyForm({...ayForm, start_date: e.target.value})} required />
                        <Input label="End Date" type="date" value={ayForm.end_date} onChange={(e) => setAyForm({...ayForm, end_date: e.target.value})} required />
                    </form>
                )}

                {/* Semester Form */}
                {activeTab === 'semesters' && (
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Academic Year</label>
                            <select 
                                value={semForm.academic_year_id} 
                                onChange={(e) => setSemForm({...semForm, academic_year_id: e.target.value})} 
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="">-- Select Academic Year --</option>
                                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                            </select>
                        </div>
                        <Input label="Semester Name (e.g. Semester 1)" value={semForm.name} onChange={(e) => setSemForm({...semForm, name: e.target.value})} required />
                        <Input label="Start Date" type="date" value={semForm.start_date} onChange={(e) => setSemForm({...semForm, start_date: e.target.value})} required />
                        <Input label="End Date" type="date" value={semForm.end_date} onChange={(e) => setSemForm({...semForm, end_date: e.target.value})} required />
                    </form>
                )}

                {/* Assessment Form */}
                {activeTab === 'assessments' && (
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Semester</label>
                            <select 
                                value={assForm.semester_id} 
                                onChange={(e) => setAssForm({...assForm, semester_id: e.target.value})} 
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="">-- Select Semester --</option>
                                {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name} ({sem.academic_year?.name})</option>)}
                            </select>
                        </div>
                        <Input label="Assessment Name (e.g. Midterm Math Exam)" value={assForm.name} onChange={(e) => setAssForm({...assForm, name: e.target.value})} required />
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type</label>
                            <select 
                                value={assForm.type} 
                                onChange={(e) => setAssForm({...assForm, type: e.target.value})} 
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="midterm">Midterm</option>
                                <option value="final">Final</option>
                            </select>
                        </div>

                        {assForm.type === 'monthly' && (
                            <Input label="Month (e.g. October)" value={assForm.month} onChange={(e) => setAssForm({...assForm, month: e.target.value})} />
                        )}
                        
                        {(assForm.type === 'midterm' || assForm.type === 'final') && (
                            <Input label="Date of Exam" type="date" value={assForm.date} onChange={(e) => setAssForm({...assForm, date: e.target.value})} />
                        )}

                        <Input label="Max Score (e.g. 100)" type="number" value={assForm.max_score} onChange={(e) => setAssForm({...assForm, max_score: e.target.value})} required />
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Settings;
