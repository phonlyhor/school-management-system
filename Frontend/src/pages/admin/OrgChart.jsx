import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import StatCard from '../../components/dashboard/StatCard';
import { useLanguage } from '../../context/LanguageContext';
import { FiUsers, FiAward, FiBookOpen, FiUserCheck } from 'react-icons/fi';
import { getOrgStructure } from '../../services/dashboardService';

const OrgChart = () => {
    const { lang, t } = useLanguage();
    const [data, setData] = useState({
        principals: [],
        vice_principals: [],
        homeroom_teachers: [],
        subject_teachers: [],
        student_leaders: [],
        summary: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStructure = async () => {
            setLoading(true);
            try {
                const res = await getOrgStructure();
                setData(res);
            } catch (err) {
                console.error("Failed to load organizational structure:", err);
                setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យរចនាសម្ព័ន្ធសាលា", "Failed to load organizational structure."));
            } finally {
                setLoading(false);
            }
        };
        fetchStructure();
    }, []);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    if (loading) return <div style={{ padding: '2rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading school organizational chart...")}</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    const principals = data.principals || [];
    const vicePrincipals = data.vice_principals || [];
    const homeroomTeachers = data.homeroom_teachers || [];
    const subjectTeachers = data.subject_teachers || [];
    const studentLeaders = data.student_leaders || [];
    const summary = data.summary || {};

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("រចនាសម្ព័ន្ធគ្រប់គ្រងសាលារៀន 🌿", "School Organizational Structure 🌿")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("រចនាសម្ព័ន្ធតាមលំដាប់ថ្នាក់៖ នាយកសាលា នាយករង គ្រូបន្ទុកថ្នាក់ គ្រូមុខវិជ្ជា និង ប្រធានថ្នាក់។", "Hierarchy tree diagram: Principal at the top, followed by Vice Principals, Teachers, and Student Leaders.")}
                    </p>
                </div>
            </div>

            {/* Stat Summary Cards */}
            <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
                <StatCard 
                    title={t("នាយកសាលា & នាយករង", "Principals & Directors")} 
                    value={(principals.length || 1) + (vicePrincipals.length || 0)} 
                    icon={<FiAward size={24} />} 
                    color="#4338ca" 
                />
                <StatCard 
                    title={t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teachers")} 
                    value={summary.homeroom_count || homeroomTeachers.length} 
                    icon={<FiUserCheck size={24} />} 
                    color="var(--primary-color)" 
                />
                <StatCard 
                    title={t("គ្រូមុខវិជ្ជា", "Subject Teachers")} 
                    value={summary.subject_teachers_count || subjectTeachers.length} 
                    icon={<FiBookOpen size={24} />} 
                    color="var(--secondary-color)" 
                />
                <StatCard 
                    title={t("ប្រធាន & អនុប្រធានថ្នាក់", "Student Class Leaders")} 
                    value={summary.student_leaders_count || studentLeaders.length} 
                    icon={<FiUsers size={24} />} 
                    color="var(--warning-color)" 
                />
            </div>

            {/* ORG CHART HIERARCHY TREE CONTAINER */}
            <Card>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '1rem 0' }}>
                    
                    {/* LEVEL 1: PRINCIPAL (នាយកសាលា) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.35rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem', border: '1px solid #c7d2fe' }}>
                            👑 LEVEL 1: {t("នាយកសាលា", "School Principal")}
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {principals.map(p => (
                                <div key={p.id} style={{
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: 'white',
                                    borderRadius: '16px', padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem',
                                    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)', width: '320px'
                                }}>
                                    {getImageUrl(p.photo) ? (
                                        <img src={getImageUrl(p.photo)} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ffffff' }} />
                                    ) : (
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ffffff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            👑
                                        </div>
                                    )}
                                    <div>
                                        <strong style={{ fontSize: '1.1rem', display: 'block' }}>{p.name}</strong>
                                        <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>{t("នាយកសាលា", "School Principal")}</span>
                                        <span style={{ fontSize: '0.75rem', display: 'block', opacity: 0.8, marginTop: '2px' }}>{p.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '2px', height: '30px', background: '#cbd5e1' }} />

                    {/* LEVEL 2: VICE PRINCIPALS (នាយករង) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.35rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem', border: '1px solid #fde68a' }}>
                            ⭐ LEVEL 2: {t("នាយករងសាលា", "Vice Principals")}
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {vicePrincipals.map(vp => (
                                <div key={vp.id} style={{
                                    background: '#ffffff', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
                                    border: '2px solid #fde68a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', width: '260px'
                                }}>
                                    {getImageUrl(vp.photo) ? (
                                        <img src={getImageUrl(vp.photo)} alt={vp.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d97706' }} />
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                            ⭐
                                        </div>
                                    )}
                                    <div>
                                        <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>{vp.name}</strong>
                                        <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: '600' }}>{t("នាយករង", "Vice Principal")}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '2px', height: '30px', background: '#cbd5e1' }} />

                    {/* LEVEL 3: HOMEROOM TEACHERS (គ្រូបន្ទុកថ្នាក់) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div style={{ background: '#dcfce7', color: '#14532d', padding: '0.35rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem', border: '1px solid #bbf7d0' }}>
                            🏫 LEVEL 3: {t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teachers")} ({homeroomTeachers.length})
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', width: '100%' }}>
                            {homeroomTeachers.map(ht => (
                                <div key={ht.id} style={{
                                    background: '#ffffff', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    border: '1px solid #bbf7d0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                                }}>
                                    {getImageUrl(ht.photo) ? (
                                        <img src={getImageUrl(ht.photo)} alt={ht.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #16a34a' }} />
                                    ) : (
                                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {ht.name?.charAt(0) || 'T'}
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>{ht.name}</strong>
                                        <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700', backgroundColor: '#f0fdf4', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                                            👑 {ht.assigned_classes?.join(', ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '2px', height: '30px', background: '#cbd5e1' }} />

                    {/* LEVEL 4: STUDENT CLASS LEADERS (ប្រធានថ្នាក់) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.35rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem', border: '1px solid #bae6fd' }}>
                            🎓 LEVEL 4: {t("ប្រធាន & អនុប្រធានថ្នាក់", "Student Class Leaders")} ({studentLeaders.length})
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', width: '100%' }}>
                            {studentLeaders.map(sl => (
                                <div key={sl.id} style={{
                                    background: '#ffffff', borderRadius: '12px', padding: '0.75rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                }}>
                                    {getImageUrl(sl.photo) ? (
                                        <img src={getImageUrl(sl.photo)} alt={sl.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {sl.name?.charAt(0) || 'S'}
                                        </div>
                                    )}
                                    <div>
                                        <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>{sl.name}</strong>
                                        <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '700' }}>
                                            {sl.class_position === 'Class Monitor' ? `👑 ${t("ប្រធានថ្នាក់", "Monitor")}` : `⭐ ${t("អនុប្រធាន", "Vice")}`} ({sl.class_name})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </Card>
        </div>
    );
};

export default OrgChart;
