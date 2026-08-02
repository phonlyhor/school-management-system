import { useState, useEffect } from 'react';
import { getParentSchedule, getParentChildren } from '../../services/parentPortalService';
import WeeklyCalendar from '../../components/common/WeeklyCalendar';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const Schedule = () => {
    const { lang, t } = useLanguage();
    const [children, setChildren] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [childInfo, setChildInfo] = useState(null);

    useEffect(() => {
        const initChildren = async () => {
            try {
                const res = await getParentChildren();
                const kids = res.data.children || [];
                setChildren(kids);
            } catch (err) {
                console.error("Failed to load children:", err);
            }
        };
        initChildren();
    }, []);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const response = await getParentSchedule(selectedStudentId);
                setSchedule(response.data.schedule || []);
                if (response.data.student) {
                    setChildInfo(response.data.student);
                }
            } catch (err) {
                console.error("Failed to fetch schedule:", err);
                toast.error(t("មានបញ្ហាក្នុងការទាញយកកាលវិភាគ", "Failed to load schedule"));
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [selectedStudentId, lang]);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">
                        {selectedStudentId === 'all' 
                            ? t("កាលវិភាគសិក្សារបស់កូនៗទាំងអស់ 🗓️", "All Children Schedules 🗓️") 
                            : `${t("កាលវិភាគសិក្សារបស់", "Schedule for")} ${childInfo?.name || t('កូនសិស្ស', 'Child')} 🗓️`}
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
                        {selectedStudentId === 'all'
                            ? t("មើលកាលវិភាគសិក្សាប្រចាំសប្តាហ៍រួមគ្នារបស់កូនៗទាំងអស់", "View the combined weekly class timetable for all your children")
                            : `${t("មើលកាលវិភាគសិក្សាប្រចាំសប្តាហ៍របស់កូនសិស្ស", "View weekly class timetable for")} ${childInfo?.name || t('កូនសិស្ស', 'Child')} ${childInfo?.class?.name ? `• ${t('ថ្នាក់', 'Class')} ${childInfo.class.name}` : ''}`
                        }
                    </p>
                </div>

                {/* Child Selector Dropdown */}
                {children.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontWeight: '600', color: '#475569' }}>{t("ជ្រើសរើសកូន:", "Filter Child:")}</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                                fontWeight: '600', color: '#4f46e5', backgroundColor: '#f8fafc'
                            }}
                        >
                            <option value="all">👨‍👩‍👧‍👦 {t("កូនៗទាំងអស់", "All Children")}</option>
                            {children.map(child => (
                                <option key={child.id} value={child.id}>
                                    👤 {child.user?.name} ({child.student_code})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>{t("កំពុងទាញយកកាលវិភាគ...", "Loading schedule...")}</div>
            ) : (
                <div style={{ marginTop: '1.5rem' }}>
                    <WeeklyCalendar schedule={schedule} type="student" />
                </div>
            )}
        </div>
    );
};

export default Schedule;
