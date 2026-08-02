import { useState, useEffect } from 'react';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/userService';
import { exportToCSV } from '../../utils/excelExporter';
import toast from 'react-hot-toast';

const roleLabels = {
    1: 'Admin',
    2: 'Teacher',
    3: 'Student',
    4: 'Parent'
};

const roleBadges = {
    1: { label: '🛡️ Admin (អ្នកគ្រប់គ្រង)', bg: '#e0e7ff', color: '#3730a3' },
    2: { label: '💻 Teacher (គ្រូបង្រៀន)', bg: '#dcfce7', color: '#166534' },
    3: { label: '🎓 Student (សិស្ស)', bg: '#fef9c3', color: '#854d0e' },
    4: { label: '👨‍👩‍👧‍👦 Parent (អាណាព្យាបាល)', bg: '#ffedd5', color: '#9a3412' }
};

const UserManager = ({ title, description, roleFilter = null }) => {
    const [users, setUsers] = useState([]);
    const [selectedRoleTab, setSelectedRoleTab] = useState(roleFilter !== null ? String(roleFilter) : '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role_id: roleFilter || '',
        photo: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getUsers();
            let allUsers = response.data.users || [];
            
            if (roleFilter !== null) {
                allUsers = allUsers.filter(u => parseInt(u.role_id) === roleFilter);
            }
            setUsers(allUsers);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('email', formData.email);
        payload.append('role_id', formData.role_id || roleFilter || 2);

        if (formData.password) {
            payload.append('password', formData.password);
        }

        if (photoFile) {
            payload.append('photo', photoFile);
        }

        try {
            if (editingId) {
                await updateUser(editingId, payload);
                toast.success("User updated successfully!");
            } else {
                await createUser(payload);
                toast.success("User created successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setPhotoFile(null);
            setPhotoPreview(null);
            setFormData({ name: '', email: '', password: '', role_id: roleFilter || '', photo: '' });
            fetchUsers();
        } catch (err) {
            console.error("Failed to save user:", err);
            toast.error("Error saving user: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (row) => {
        setEditingId(row.id);
        setPhotoFile(null);
        setPhotoPreview(getImageUrl(row.photo || row.student_profile?.photo));
        setFormData({
            name: row.name,
            email: row.email,
            password: '',
            role_id: row.role_id,
            photo: row.photo || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            try {
                await deleteUser(id);
                fetchUsers();
                toast.success("User deleted successfully!");
            } catch (err) {
                console.error("Failed to delete user:", err);
                toast.error("Error deleting user: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: 'Name (ឈ្មោះ)', 
            render: (row) => {
                const img = getImageUrl(row.photo || row.student_profile?.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {img ? (
                            <img src={img} alt={row.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                        ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                                {row.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{row.name}</strong>
                    </div>
                );
            } 
        },
        { header: 'Email Address', accessor: 'email' },
        { 
            header: 'Role (តួនាទី)', 
            render: (row) => {
                const b = roleBadges[row.role_id] || { label: roleLabels[row.role_id] || 'Unknown', bg: '#f1f5f9', color: '#334155' };
                return (
                    <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        backgroundColor: b.bg,
                        color: b.color
                    }}>
                        {b.label}
                    </span>
                );
            }
        },
        ...(roleFilter === 2 || selectedRoleTab === '2' ? [{
            header: 'Homeroom Assignment (គ្រូបន្ទុកថ្នាក់)',
            render: (row) => {
                const classes = row.teacher_class_assignments?.map(a => a.school_class?.name).filter(Boolean);
                if (classes && classes.length > 0) {
                    return (
                        <span style={{ fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                            👑 គ្រូបន្ទុកថ្នាក់: {classes.join(', ')}
                        </span>
                    );
                }
                return <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>- (គ្រូបង្រៀនមុខវិជ្ជា)</span>;
            }
        }] : []),
        { 
            header: 'Actions', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setViewingUser(row); }}
                        title="View Details"
                    >
                        👁️
                    </Button>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>Edit</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>Delete</Button>
                </div>
            )
        }
    ];

    const filteredUsers = users.filter(u => {
        const matchesSearch = !search || 
            (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
            (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

        const matchesRole = !selectedRoleTab || String(u.role_id) === String(selectedRoleTab);

        return matchesSearch && matchesRole;
    });

    // Role Counts for Tab Badges
    const adminCount = users.filter(u => parseInt(u.role_id) === 1).length;
    const teacherCount = users.filter(u => parseInt(u.role_id) === 2).length;
    const studentCount = users.filter(u => parseInt(u.role_id) === 3).length;
    const parentCount = users.filter(u => parseInt(u.role_id) === 4).length;

    const handleExportExcel = () => {
        const exportCols = [
            { header: 'ID / កូដ', renderText: (u) => u.student_profile?.student_code || u.id },
            { header: 'ឈ្មោះពេញ (Full Name)', accessor: 'name' },
            { header: 'អ៊ីមែល (Email)', accessor: 'email' },
            { header: 'តួនាទី (Role)', renderText: (u) => roleLabels[u.role_id] || 'User' },
            { header: 'ថ្នាក់រៀន (Class)', renderText: (u) => u.student_profile?.school_class?.name || 'N/A' },
            { header: 'ភេទ (Gender)', renderText: (u) => u.student_profile?.gender || 'N/A' },
            { header: 'កាលបរិច្ឆេទ (Created At)', renderText: (u) => u.created_at ? new Date(u.created_at).toLocaleDateString() : '' },
        ];
        const label = roleFilter ? roleLabels[roleFilter] : 'Users';
        exportToCSV(`${label}_List_${new Date().toISOString().slice(0, 10)}.csv`, exportCols, filteredUsers);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{title}</h1>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Button variant="secondary" onClick={handleExportExcel}>
                        📥 Export Excel
                    </Button>
                    <Button onClick={() => { 
                        setEditingId(null); 
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        setFormData({ name: '', email: '', password: '', role_id: roleFilter || '', photo: '' }); 
                        setIsModalOpen(true); 
                    }}>
                        + Add {roleFilter ? roleLabels[roleFilter] : 'User'}
                    </Button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Role Filter Tabs for "All Users" page */}
            {roleFilter === null && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSelectedRoleTab('')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.88rem',
                            backgroundColor: selectedRoleTab === '' ? '#4f46e5' : '#f1f5f9',
                            color: selectedRoleTab === '' ? '#ffffff' : '#475569',
                            transition: 'all 0.2s'
                        }}
                    >
                        👥 All Users ({users.length})
                    </button>
                    <button
                        onClick={() => setSelectedRoleTab('1')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.88rem',
                            backgroundColor: selectedRoleTab === '1' ? '#3730a3' : '#f1f5f9',
                            color: selectedRoleTab === '1' ? '#ffffff' : '#475569',
                            transition: 'all 0.2s'
                        }}
                    >
                        🛡️ Admins ({adminCount})
                    </button>
                    <button
                        onClick={() => setSelectedRoleTab('2')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.88rem',
                            backgroundColor: selectedRoleTab === '2' ? '#166534' : '#f1f5f9',
                            color: selectedRoleTab === '2' ? '#ffffff' : '#475569',
                            transition: 'all 0.2s'
                        }}
                    >
                        💻 Teachers ({teacherCount})
                    </button>
                    <button
                        onClick={() => setSelectedRoleTab('3')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.88rem',
                            backgroundColor: selectedRoleTab === '3' ? '#854d0e' : '#f1f5f9',
                            color: selectedRoleTab === '3' ? '#ffffff' : '#475569',
                            transition: 'all 0.2s'
                        }}
                    >
                        🎓 Students ({studentCount})
                    </button>
                    <button
                        onClick={() => setSelectedRoleTab('4')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.88rem',
                            backgroundColor: selectedRoleTab === '4' ? '#9a3412' : '#f1f5f9',
                            color: selectedRoleTab === '4' ? '#ffffff' : '#475569',
                            transition: 'all 0.2s'
                        }}
                    >
                        👨‍👩‍👧‍👦 Parents ({parentCount})
                    </button>
                </div>
            )}

            <Card>
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {description && <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, width: '100%' }}>{description}</p>}
                    
                    <div style={{ width: '280px' }}>
                        <Input 
                            placeholder="Search by name or email..." 
                            value={search}
                            onChange={handleSearch}
                            style={{ margin: 0 }}
                        />
                    </div>

                    {roleFilter === null && (
                        <div style={{ minWidth: '200px' }}>
                            <select 
                                value={selectedRoleTab} 
                                onChange={(e) => setSelectedRoleTab(e.target.value)}
                                style={{ 
                                    width: '100%', height: '42px', padding: '0.6rem 0.9rem', 
                                    border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a',
                                    backgroundColor: '#ffffff', fontWeight: '500'
                                }}
                            >
                                <option value="">👥 All Roles (តួនាទីទាំងអស់)</option>
                                <option value="1">🛡️ Admin (អ្នកគ្រប់គ្រង)</option>
                                <option value="2">💻 Teacher (គ្រូបង្រៀន)</option>
                                <option value="3">🎓 Student (សិស្ស)</option>
                                <option value="4">👨‍👩‍👧‍👦 Parent (អាណាព្យាបាល)</option>
                            </select>
                        </div>
                    )}

                    {selectedRoleTab && roleFilter === null && (
                        <Button size="small" variant="secondary" onClick={() => setSelectedRoleTab('')}>
                            Clear Filter ✖️
                        </Button>
                    )}

                    <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                        Showing {filteredUsers.length} of {users.length} Users
                    </div>
                </div>
                
                {loading ? (
                    <p>Loading users...</p>
                ) : (
                    <Table columns={columns} data={filteredUsers} />
                )}
            </Card>

            {/* Modal Add/Edit User */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={`${editingId ? 'Edit' : 'Add New'} ${roleFilter ? roleLabels[roleFilter] : 'User'}`}
                maxWidth="600px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save User'}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Photo Upload Header Card */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div>
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : '📷'}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
                                Profile Photo (រូបថតផ្ទាល់ខ្លួន)
                            </label>
                            <label style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem',
                                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '0.82rem', fontWeight: '600', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                            }}>
                                📷 Choose Photo File
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {photoFile && (
                                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: '500' }}>
                                    ✓ {photoFile.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <Input 
                        label="Full Name (ឈ្មោះពេញ)" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Sok Phalla"
                    />
                    <Input 
                        label="Email Address" 
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="user@school.com"
                    />
                    
                    {!roleFilter && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                System Role (តួនាទី) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select 
                                name="role_id" 
                                value={formData.role_id} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- Select Role --</option>
                                <option value="1">🛡️ Admin (អ្នកគ្រប់គ្រង)</option>
                                <option value="2">💻 Teacher (គ្រូបង្រៀន)</option>
                                <option value="3">🎓 Student (សិស្ស)</option>
                                <option value="4">👨‍👩‍👧‍👦 Parent (អាណាព្យាបាល)</option>
                            </select>
                        </div>
                    )}

                    <Input 
                        label={editingId ? "Password (leave blank to keep current)" : "Password"} 
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingId}
                        minLength={6}
                        placeholder="••••••••"
                    />
                </form>
            </Modal>

            {/* View Details Modal for ALL Users (👁️) */}
            <Modal 
                isOpen={!!viewingUser} 
                onClose={() => setViewingUser(null)}
                title="User Profile Details (ព័ត៌មានលម្អិតអ្នកប្រើប្រាស់) 👁️"
                maxWidth="600px"
                footer={
                    <Button variant="secondary" onClick={() => setViewingUser(null)}>Close</Button>
                }
            >
                {viewingUser && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {/* Header Avatar & Role Badge */}
                        <div style={{ display: 'flex', gap: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                            {getImageUrl(viewingUser.photo || viewingUser.student_profile?.photo) ? (
                                <img src={getImageUrl(viewingUser.photo || viewingUser.student_profile?.photo)} alt={viewingUser.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 'bold' }}>
                                    {viewingUser.name ? viewingUser.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#0f172a' }}>{viewingUser.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {(() => {
                                        const b = roleBadges[viewingUser.role_id] || { label: roleLabels[viewingUser.role_id] || 'User', bg: '#f1f5f9', color: '#334155' };
                                        return (
                                            <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: b.bg, color: b.color }}>
                                                {b.label}
                                            </span>
                                        );
                                    })()}
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>ID: <strong>#{viewingUser.id}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Account Info */}
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                                🔑 Account Credentials
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ margin: '0 0 2px 0', color: '#64748b', fontSize: '0.85rem' }}>Email Address</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0369a1' }}>{viewingUser.email}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 2px 0', color: '#64748b', fontSize: '0.85rem' }}>System Role</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0f172a' }}>{roleLabels[viewingUser.role_id] || 'User'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Specific Role Info */}
                        {/* TEACHER (Role 2) */}
                        {parseInt(viewingUser.role_id) === 2 && (
                            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    💻 Teacher Assignments (ការចាត់តាំងគ្រូ)
                                </h4>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#166534', fontSize: '0.85rem', fontWeight: '600' }}>Homeroom Class (គ្រូបន្ទុកថ្នាក់):</p>
                                    {viewingUser.teacher_class_assignments && viewingUser.teacher_class_assignments.length > 0 ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {viewingUser.teacher_class_assignments.map(a => (
                                                <span key={a.id} style={{ fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                                                    👑 {a.school_class?.name} ({a.school_class?.grade_level})
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, fontStyle: 'italic', color: '#64748b', fontSize: '0.88rem' }}>Subject teacher (មិនមែនជាគ្រូបន្ទុកថ្នាក់ឡើយ)</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STUDENT (Role 3) */}
                        {parseInt(viewingUser.role_id) === 3 && viewingUser.student_profile && (
                            <div style={{ background: '#fefce8', padding: '1rem', borderRadius: '8px', border: '1px solid #fef08a' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🎓 Student Profile Info (ប្រវត្តិរូបសិស្ស)
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                                    <div>
                                        <span style={{ color: '#854d0e', fontSize: '0.8rem' }}>Student Code (ID):</span>
                                        <strong style={{ display: 'block', color: '#4338ca' }}>{viewingUser.student_profile.student_code}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#854d0e', fontSize: '0.8rem' }}>Class Position:</span>
                                        <strong style={{ display: 'block', color: '#0f172a' }}>{viewingUser.student_profile.class_position || 'Member'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#854d0e', fontSize: '0.8rem' }}>Gender (ភេទ):</span>
                                        <strong style={{ display: 'block', color: '#0f172a' }}>{viewingUser.student_profile.gender || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#854d0e', fontSize: '0.8rem' }}>Place of Birth:</span>
                                        <strong style={{ display: 'block', color: '#0f172a' }}>{viewingUser.student_profile.place_of_birth || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#854d0e', fontSize: '0.8rem' }}>Father Name:</span>
                                        <strong style={{ display: 'block', color: '#0f172a' }}>{viewingUser.student_profile.father_name || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#854d0e', fontSize: '0.8rem' }}>Mother Name:</span>
                                        <strong style={{ display: 'block', color: '#0f172a' }}>{viewingUser.student_profile.mother_name || 'N/A'}</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PARENT (Role 4) */}
                        {parseInt(viewingUser.role_id) === 4 && (
                            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    👨‍👩‍👧‍👦 Parent & Children Info (អាណាព្យាបាល)
                                </h4>
                                {viewingUser.parent_profile?.students && viewingUser.parent_profile.students.length > 0 ? (
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', color: '#9a3412', fontSize: '0.85rem', fontWeight: '600' }}>Linked Children (បុត្រធីតា):</p>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#9a3412', fontWeight: '600' }}>
                                            {viewingUser.parent_profile.students.map(st => (
                                                <li key={st.id}>{st.user?.name} ({st.student_code})</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontStyle: 'italic', color: '#64748b', fontSize: '0.88rem' }}>Registered parent user account.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManager;
