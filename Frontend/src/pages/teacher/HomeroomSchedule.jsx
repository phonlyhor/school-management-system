import React, { useState, useEffect } from 'react';
import { getTeacherHomeroomSchedule } from '../../services/teacherService';
import WeeklyCalendar from '../../components/common/WeeklyCalendar';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const HomeroomSchedule = () => {
    const { lang, t } = useLanguage();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teacherName, setTeacherName] = useState('');
    const [isHomeroom, setIsHomeroom] = useState(true);
    const [homeroomClass, setHomeroomClass] = useState(null);
    const [toggling, setToggling] = useState(false);
    const [allowGlobalRegistration, setAllowGlobalRegistration] = useState(true);

    useEffect(() => {
        const fetchHomeroomSchedule = async () => {
            try {
                const response = await getTeacherHomeroomSchedule();
                const sched = response.data.schedule || [];
                setSchedule(sched);
                setIsHomeroom(response.data.is_homeroom !== false && sched.length > 0);
                if (response.data.teacher) {
                    setTeacherName(response.data.teacher.name);
                }
                if (response.data.allow_student_registration !== undefined) {
                    setAllowGlobalRegistration(response.data.allow_student_registration);
                }
                const cls = sched[0]?.schoolClass || sched[0]?.class || response.data.class;
                if (cls) {
                    setHomeroomClass(cls);
                }
            } catch (err) {
                console.error("Failed to fetch homeroom schedule:", err);
                toast.error(t("មានបញ្ហាក្នុងការទាញយកកាលវិភាគថ្នាក់បន្ទុក", "Failed to load homeroom schedule"));
            } finally {
                setLoading(false);
            }
        };

        fetchHomeroomSchedule();
    }, [lang]);

    const handleCopyLink = () => {
        if (!homeroomClass) return;
        const url = `${window.location.origin}/register/student?class_id=${homeroomClass.id}`;
        navigator.clipboard.writeText(url);
        toast.success(`បានចម្លង Link ចុះឈ្មោះសម្រាប់ថ្នាក់ ${homeroomClass.name} រួចរាល់!`);
    };

    const handleToggleRegistration = async () => {
        if (!homeroomClass) return;
        setToggling(true);
        try {
            const res = await api.post(`/teacher/classes/${homeroomClass.id}/toggle-registration`);
            toast.success(res.data.message);
            setHomeroomClass(prev => ({ ...prev, is_registration_open: !(prev.is_registration_open !== false) }));
        } catch (err) {
            toast.error(err.response?.data?.message || "មានបញ្ហាក្នុងការកំណត់ការចុះឈ្មោះ");
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>{t("កំពុងទាញយកកាលវិភាគថ្នាក់បន្ទុក...", "Loading homeroom schedule...")}</div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">{t("👑 កាលវិភាគថ្នាក់បន្ទុក (Homeroom Timetable)", "Homeroom Timetable 👑")}</h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                        {t("កាលវិភាគពេញលេញនៃថ្នាក់ដែលលោកគ្រូ/អ្នកគ្រូទទួលបន្ទុក រួមទាំងឈ្មោះគ្រូបង្រៀនតាមមុខវិជ្ជានីមួយៗ។", "Full weekly timetable for your assigned homeroom class with all subject teachers.")}
                    </p>
                </div>
            </div>

            {allowGlobalRegistration && homeroomClass && homeroomClass.is_registration_open !== false && (
                <div style={{ background: homeroomClass.is_registration_open !== false ? '#f0fdf4' : '#fef2f2', padding: '0.85rem 1.1rem', borderRadius: '12px', border: homeroomClass.is_registration_open !== false ? '1px solid #bbf7d0' : '1px solid #fca5a5', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                            📝 ការចុះឈ្មោះថ្នាក់ {homeroomClass.name} ៖
                        </span>
                        <span style={{
                            padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700',
                            backgroundColor: homeroomClass.is_registration_open !== false ? '#dcfce7' : '#fee2e2',
                            color: homeroomClass.is_registration_open !== false ? '#15803d' : '#991b1b',
                            border: homeroomClass.is_registration_open !== false ? '1px solid #86efac' : '1px solid #fca5a5'
                        }}>
                            {homeroomClass.is_registration_open !== false ? '🟢 កំពុងបើក' : '🔴 បានបិទ'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleCopyLink}
                            title="ចម្លង Link ចុះឈ្មោះផ្ញើទៅសិស្ស"
                            style={{ background: '#ffffff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                            🔗 Link ចុះឈ្មោះ
                        </button>
                        <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/register/student?class_id=${homeroomClass.id}`)}&text=${encodeURIComponent(`🔗 Link ចុះឈ្មោះចូលរៀនសម្រាប់ថ្នាក់ ${homeroomClass.name}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="ផ្ញើ Link ចុះឈ្មោះទៅកាន់ Telegram"
                            style={{ background: '#0088cc', color: '#ffffff', border: '1px solid #0088cc', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                        >
                            ✈️ ផ្ញើ Telegram
                        </a>
                    </div>
                </div>
            )}

            {!isHomeroom ? (
                <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                        {t("លោកគ្រូ/អ្នកគ្រូ មិនទាន់មានការចាត់តាំងជាគ្រូបន្ទុកថ្នាក់ឡើយ", "You have not been assigned as a homeroom teacher for any class.")}
                    </p>
                </div>
            ) : (
                <div style={{ marginTop: '1.5rem' }}>
                    <WeeklyCalendar schedule={schedule} type="teacher" />
                </div>
            )}
        </div>
    );
};

export default HomeroomSchedule;
