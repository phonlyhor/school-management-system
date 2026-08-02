import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { useLanguage } from '../../context/LanguageContext';
import { getParentChildren } from '../../services/parentPortalService';

const Children = () => {
    const { lang, t } = useLanguage();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChildren = async () => {
            setLoading(true);
            try {
                const res = await getParentChildren();
                setChildren(res.data.children || []);
            } catch (err) {
                console.error("Failed to load children profile:", err);
                setError(t("មានបញ្ហាក្នុងការទាញយកប្រវត្តិរូបកូនៗ", "Failed to load children profiles."));
            } finally {
                setLoading(false);
            }
        };
        fetchChildren();
    }, [lang]);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const formatGrade = (gl) => {
        if (!gl) return '';
        return gl.toLowerCase().startsWith('grade') ? gl : `${t('កម្រិតថ្នាក់', 'Grade')} ${gl}`;
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return isNaN(age) || age < 0 ? 'N/A' : `${age} ${t('ឆ្នាំ', 'Years')}`;
    };

    const positionBadge = (pos) => {
        if (!pos || pos === 'Member') return null;
        let bg = '#e2e8f0', color = '#334155', label = pos;
        if (pos === 'Class Monitor') { bg = '#fef3c7'; color = '#92400e'; label = `👑 ${t("ប្រធានថ្នាក់", "Monitor")}`; }
        else if (pos === 'Vice Monitor') { bg = '#e0e7ff'; color = '#4338ca'; label = `⭐ ${t("អនុប្រធានថ្នាក់", "Vice Monitor")}`; }
        else if (pos === 'Treasurer') { bg = '#dcfce7'; color = '#166534'; label = `💰 ${t("បេឡា", "Treasurer")}`; }
        else if (pos === 'Secretary') { bg = '#f3e8ff'; color = '#6b21a8'; label = `📝 ${t("លេខា", "Secretary")}`; }

        return (
            <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem',
                fontWeight: '700', backgroundColor: bg, color: color, marginLeft: '0.4rem'
            }}>
                {label}
            </span>
        );
    };

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t("ព័ត៌មានប្រវត្តិរូបកូនៗ 👨‍👩‍👧‍👦", "My Children Profiles 👨‍👩‍👧‍👦")}</h1>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                    {t("ព័ត៌មានលម្អិតអំពីកូនៗដែលកំពុងសិក្សាក្នុងសាលារៀន។", "Detailed academic profiles and class information for your children.")}
                </p>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <p>{t("កំពុងទាញយកទិន្នន័យ...", "Loading children profiles...")}</p>
            ) : children.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>{t("មិនទាន់បានភ្ជាប់គណនីកូនសិស្ស", "No Children Linked")}</h3>
                        <p style={{ margin: 0 }}>{t("បច្ចុប្បន្នមិនទាន់មានគណនីសិស្សភ្ជាប់ជាមួយគណនីអាណាព្យាបាលរបស់អ្នកឡើយ។ សូមទាក់ទងរដ្ឋបាលសាលា។", "There are currently no students linked to your parent account. Please contact the school admin.")}</p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {children.map(child => {
                        const homeroomTeachers = child.school_class?.teacher_assignments
                            ?.map(a => a.teacher?.name)
                            .filter(Boolean)
                            .join(', ');

                        const imgUrl = getImageUrl(child.photo);

                        return (
                            <Card key={child.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                                    {imgUrl ? (
                                        <img src={imgUrl} alt={child.user?.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }} />
                                    ) : (
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                            {child.user?.name?.charAt(0) || 'C'}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>
                                                {child.user?.name || 'Student'}
                                            </h3>
                                            {positionBadge(child.class_position)}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: '#4f46e5', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                                            {t("អត្តលេខ:", "ID:")} {child.student_code}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                                        <span style={{ color: '#64748b' }}>{t("ថ្នាក់រៀន", "Enrolled Class")}:</span>
                                        <strong style={{ color: '#0f172a' }}>
                                            🏫 {child.school_class?.name ? `${child.school_class.name} (${formatGrade(child.school_class.grade_level)})` : t('មិនទាន់ចាត់', 'Unassigned')}
                                        </strong>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                                        <span style={{ color: '#64748b' }}>{t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teacher")}:</span>
                                        <strong style={{ color: '#16a34a' }}>
                                            👑 {homeroomTeachers || t('មិនទាន់មាន', 'Not Assigned')}
                                        </strong>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                                        <span style={{ color: '#64748b' }}>{t("ភេទ", "Gender")}:</span>
                                        <strong style={{ color: '#0f172a' }}>
                                            {(child.gender || '').toLowerCase() === 'female' ? t('👩 ស្រី', 'Female') : t('👨 ប្រុស', 'Male')}
                                        </strong>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.4rem' }}>
                                        <span style={{ color: '#64748b' }}>{t("អាយុ / ថ្ងៃកំណើត", "Age / Date of Birth")}:</span>
                                        <strong style={{ color: '#0f172a' }}>
                                            🎂 {calculateAge(child.date_of_birth)}
                                        </strong>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>{t("អាសយដ្ឋានអ៊ីមែល", "Email")}:</span>
                                        <span style={{ color: '#334155', fontWeight: '500' }}>
                                            {child.user?.email || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Children;
