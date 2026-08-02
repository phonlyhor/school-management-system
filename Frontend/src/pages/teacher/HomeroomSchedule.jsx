import React, { useState, useEffect } from 'react';
import { getTeacherHomeroomSchedule } from '../../services/teacherService';
import WeeklyCalendar from '../../components/common/WeeklyCalendar';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const HomeroomSchedule = () => {
    const { lang, t } = useLanguage();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teacherName, setTeacherName] = useState('');
    const [isHomeroom, setIsHomeroom] = useState(true);

    useEffect(() => {
        const fetchHomeroomSchedule = async () => {
            try {
                const response = await getTeacherHomeroomSchedule();
                setSchedule(response.data.schedule || []);
                setIsHomeroom(response.data.is_homeroom !== false && (response.data.schedule || []).length > 0);
                if (response.data.teacher) {
                    setTeacherName(response.data.teacher.name);
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

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>{t("កំពុងទាញយកកាលវិភាគថ្នាក់បន្ទុក...", "Loading homeroom schedule...")}</div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">{t("👑 កាលវិភាគថ្នាក់បន្ទុក (Homeroom Timetable)", "Homeroom Timetable 👑")}</h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                        {t("កាលវិភាគពេញលេញនៃថ្នាក់ដែលលោកគ្រូ/អ្នកគ្រូទទួលបន្ទុក រួមទាំងឈ្មោះគ្រូបង្រៀនតាមមុខវិជ្ជានីមួយៗ។", "Full weekly timetable for your assigned homeroom class with all subject teachers.")}
                    </p>
                </div>
            </div>

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
