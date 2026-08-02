import React, { useState, useEffect } from 'react';
import { getStudentSchedule } from '../../services/studentPortalService';
import WeeklyCalendar from '../../components/common/WeeklyCalendar';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const Schedule = () => {
    const { lang, t } = useLanguage();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const response = await getStudentSchedule();
                setSchedule(response.data.schedule || []);
                if (response.data.student) {
                    setStudentInfo(response.data.student);
                }
            } catch (err) {
                console.error("Failed to fetch schedule:", err);
                toast.error(t("មានបញ្ហាក្នុងការទាញយកកាលវិភាគ", "Failed to load schedule"));
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [lang]);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>{t("កំពុងទាញយកកាលវិភាគ...", "Loading schedule...")}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t("កាលវិភាគសិក្សារបស់ខ្ញុំ 🗓️", "My Class Schedule 🗓️")}</h1>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                    {t("សូមស្វាគមន៍មកវិញ", "Welcome back")}, <strong>{studentInfo?.name || t('សិស្ស', 'Student')}</strong> 
                    {studentInfo?.class?.name && ` • ${t('ថ្នាក់', 'Class')} ${studentInfo.class.name}`}
                </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <WeeklyCalendar schedule={schedule} type="student" />
            </div>
        </div>
    );
};

export default Schedule;
