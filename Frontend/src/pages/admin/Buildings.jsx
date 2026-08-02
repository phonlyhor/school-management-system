import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/dashboard/StatCard';
import { useLanguage } from '../../context/LanguageContext';
import { FiHome, FiBriefcase, FiGrid } from 'react-icons/fi';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding } from '../../services/buildingService';
import toast from 'react-hot-toast';

const Buildings = () => {
    const { lang, t } = useLanguage();
    const [buildings, setBuildings] = useState([]);
    const [summary, setSummary] = useState({
        total_buildings: 0,
        total_admin_offices: 0,
        total_rooms: 0
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'Building',
        total_rooms: 1,
        floors: 1,
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBuildings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBuildings();
            setBuildings(res.data.buildings || []);
            setSummary(res.data.summary || { total_buildings: 0, total_admin_offices: 0, total_rooms: 0 });
        } catch (err) {
            console.error("Failed to fetch buildings:", err);
            setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យអគារ និង បន្ទប់", "Failed to load buildings data."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuildings();
    }, []);

    const generateBuildingCode = (name = '', type = 'Building') => {
        let prefix = type === 'Admin Office' ? 'ADM' : type === 'Library' ? 'LIB' : type === 'Laboratory' ? 'LAB' : 'BLD';
        if (name && name.trim().length >= 2) {
            const cleanName = name.trim().replace(/[^a-zA-Z0-9]/g, '');
            if (cleanName.length >= 2) {
                prefix = cleanName.substring(0, 4).toUpperCase();
            }
        }
        const num = buildings.length + 1;
        return `${prefix}-${String(num).padStart(2, '0')}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'name' || name === 'type') {
            const newName = name === 'name' ? value : formData.name;
            const newType = name === 'type' ? value : formData.type;
            const autoCode = generateBuildingCode(newName, newType);
            setFormData(prev => ({ ...prev, [name]: value, code: autoCode }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateBuilding(editingId, formData);
                toast.success(t("បានកែប្រែទិន្នន័យអគារ/បន្ទប់ដោយជោគជ័យ!", "Building updated successfully!"));
            } else {
                await createBuilding(formData);
                toast.success(t("បានបន្ថែមអគារ/បន្ទប់ថ្មីដោយជោគជ័យ!", "Building created successfully!"));
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', code: '', type: 'Building', total_rooms: 1, floors: 1, description: '' });
            fetchBuildings();
        } catch (err) {
            console.error("Failed to save building:", err);
            toast.error(t("មានបញ្ហាក្នុងការរក្សាទុក៖ ", "Error saving building: ") + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (bld) => {
        setEditingId(bld.id);
        setFormData({
            name: bld.name,
            code: bld.code || '',
            type: bld.type || 'Building',
            total_rooms: bld.total_rooms || 1,
            floors: bld.floors || 1,
            description: bld.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបអគារ/បន្ទប់ទីចាត់ការនេះមែនទេ?", "Are you sure you want to delete this building/office?"))) {
            try {
                await deleteBuilding(id);
                fetchBuildings();
                toast.success(t("បានលុបអគារ/បន្ទប់ដោយជោគជ័យ!", "Building deleted successfully!"));
            } catch (err) {
                console.error("Failed to delete building:", err);
                toast.error(t("មានបញ្ហាក្នុងការលុប៖ ", "Error deleting building: ") + (err.response?.data?.message || err.message));
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: t('កូដអគារ', 'Building Code'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#4338ca', backgroundColor: '#e0e7ff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {row.code}
                </span>
            ) 
        },
        { 
            header: t('ឈ្មោះអគារ / ទីចាត់ការ', 'Building / Office Name'), 
            render: (row) => <strong>🏢 {row.name}</strong> 
        },
        { 
            header: t('ប្រភេទអគារ', 'Building Type'), 
            render: (row) => {
                const tType = row.type || 'Building';
                if (tType === 'Admin Office') return <span style={{ fontWeight: '700', color: '#b45309', backgroundColor: '#fef3c7', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem' }}>💼 {t("ទីចាត់ការ (Admin Office)", "Admin Office")}</span>;
                if (tType === 'Library') return <span style={{ fontWeight: '700', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem' }}>📖 {t("បណ្ណាល័យ (Library)", "Library")}</span>;
                if (tType === 'Laboratory') return <span style={{ fontWeight: '700', color: '#6d28d9', backgroundColor: '#f3e8ff', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem' }}>🧪 {t("បន្ទប់ពិសោធន៍ (Lab)", "Laboratory")}</span>;
                return <span style={{ fontWeight: '600', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem' }}>🏫 {t("អគារសិក្សា (Building)", "School Building")}</span>;
            } 
        },
        { 
            header: t('ចំនួនបន្ទប់', 'Total Rooms'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#0369a1' }}>
                    🚪 {row.total_rooms || 1} {t("បន្ទប់", "Rooms")}
                </span>
            ) 
        },
        { 
            header: t('ចំនួនជាន់', 'Floors'), 
            render: (row) => <span>🏗️ {row.floors || 1} {t("ជាន់", "Floors")}</span> 
        },
        { 
            header: t('ការពិពណ៌នា', 'Description'), 
            render: (row) => <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{row.description || '-'}</span> 
        },
        { 
            header: t('សកម្មភាព', 'Actions'), 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>{t("កែប្រែ", "Edit")}</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>{t("លុប", "Delete")}</Button>
                </div>
            ) 
        }
    ];

    const filteredBuildings = buildings.filter(b => {
        const matchesSearch = !search || 
            (b.name && b.name.toLowerCase().includes(search.toLowerCase())) ||
            (b.code && b.code.toLowerCase().includes(search.toLowerCase())) ||
            (b.type && b.type.toLowerCase().includes(search.toLowerCase()));

        const matchesType = !typeFilter || (b.type || 'Building') === typeFilter;

        return matchesSearch && matchesType;
    });

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("អគារសិក្សា & បន្ទប់ទីចាត់ការ 🏢", "School Buildings & Offices 🏢")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("គ្រប់គ្រងអគារសិក្សា បន្ទប់ទីចាត់ការ បណ្ណាល័យ បន្ទប់ពិសោធន៍ និង ចំនួនបន្ទប់រៀន។", "Manage school buildings, administrative offices, libraries, labs, and room counts.")}
                    </p>
                </div>
                <Button onClick={() => { 
                    setEditingId(null); 
                    setFormData({ name: '', code: generateBuildingCode('', 'Building'), type: 'Building', total_rooms: 1, floors: 1, description: '' }); 
                    setIsModalOpen(true); 
                }}>
                    + {t("បន្ថែមអគារ/ទីចាត់ការ", "Add Building / Office")}
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Stat Overview Cards */}
            <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
                <StatCard 
                    title={t("អគារសិក្សាសរុប", "Total School Buildings")} 
                    value={summary.total_buildings || 0} 
                    icon={<FiHome size={24} />} 
                    color="var(--primary-color)" 
                />
                <StatCard 
                    title={t("បន្ទប់ទីចាត់ការសរុប", "Total Admin Offices")} 
                    value={summary.total_admin_offices || 0} 
                    icon={<FiBriefcase size={24} />} 
                    color="var(--warning-color)" 
                />
                <StatCard 
                    title={t("បន្ទប់រៀនសរុប", "Total School Rooms")} 
                    value={summary.total_rooms || 0} 
                    icon={<FiGrid size={24} />} 
                    color="var(--secondary-color)" 
                />
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '280px' }}>
                            <Input 
                                placeholder={t("ស្វែងរកឈ្មោះអគារ, កូដ...", "Search building name, code...")} 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ margin: 0 }}
                            />
                        </div>

                        {/* Filter Type */}
                        <div style={{ minWidth: '200px' }}>
                            <select 
                                value={typeFilter} 
                                onChange={(e) => setTypeFilter(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}
                            >
                                <option value="">🏢 {t("ប្រភេទអគារទាំងអស់", "All Building Types")}</option>
                                <option value="Building">🏫 {t("អគារសិក្សា (Building)", "School Building")}</option>
                                <option value="Admin Office">💼 {t("ទីចាត់ការ (Admin Office)", "Admin Office")}</option>
                                <option value="Library">📖 {t("បណ្ណាល័យ (Library)", "Library")}</option>
                                <option value="Laboratory">🧪 {t("បន្ទប់ពិសោធន៍ (Lab)", "Laboratory")}</option>
                            </select>
                        </div>

                        {(search || typeFilter) && (
                            <Button size="small" variant="secondary" onClick={() => { setSearch(''); setTypeFilter(''); }}>
                                {t("លុប ✖️", "Clear ✖️")}
                            </Button>
                        )}

                        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                            {t(`បង្ហាញអគារចំនួន ${filteredBuildings.length}`, `Showing ${filteredBuildings.length} Buildings`)}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p>{t("កំពុងទាញយកទិន្នន័យ...", "Loading buildings data...")}</p>
                ) : (
                    <Table columns={columns} data={filteredBuildings} />
                )}
            </Card>

            {/* Modal Add / Edit Building */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { if (!isSubmitting) setIsModalOpen(false); }}
                title={editingId ? t("កែប្រែព័ត៌មានអគារ", "Edit Building Details") : t("បន្ថែមអគារ/ទីចាត់ការថ្មី", "Add New Building / Office")}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងរក្សាទុក...", "Saving...") : t("រក្សាទុក", "Save Building")}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ប្រភេទអគារ / ទីតាំង", "Building Type")}
                            </label>
                            <select 
                                name="type" 
                                value={formData.type} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="Building">🏫 {t("អគារសិក្សា (Building)", "School Building")}</option>
                                <option value="Admin Office">💼 {t("បន្ទប់ទីចាត់ការ (Admin Office)", "Admin Office")}</option>
                                <option value="Library">📖 {t("បណ្ណាល័យ (Library)", "Library")}</option>
                                <option value="Laboratory">🧪 {t("បន្ទប់ពិសោធន៍ (Laboratory)", "Laboratory")}</option>
                            </select>
                        </div>

                        <Input 
                            label={t("កូដអគារ (បង្កើតស្វ័យប្រវត្តិ)", "Building Code (Auto Generated)")} 
                            name="code" 
                            value={formData.code} 
                            onChange={handleInputChange} 
                            required 
                            placeholder="BLD-01" 
                        />
                    </div>

                    <Input 
                        label={t("ឈ្មោះអគារ / បន្ទប់ទីចាត់ការ", "Building / Office Name")} 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="e.g. Building A, Admin Main Office, Science Lab 1" 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input 
                            label={t("ចំនួនបន្ទប់រៀនសរុប", "Total Rooms")} 
                            name="total_rooms" 
                            type="number" 
                            value={formData.total_rooms} 
                            onChange={handleInputChange} 
                            min={1} 
                            required 
                        />
                        <Input 
                            label={t("ចំនួនជាន់", "Total Floors")} 
                            name="floors" 
                            type="number" 
                            value={formData.floors} 
                            onChange={handleInputChange} 
                            min={1} 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ការពិពណ៌នាបន្ថែម", "Description")}
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder={t("ការពិពណ៌នាអំពីអគារ ឬ ទីតាំង...", "Building description...")}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Buildings;
