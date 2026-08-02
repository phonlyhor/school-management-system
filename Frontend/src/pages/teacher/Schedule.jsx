import React, { useState, useEffect } from 'react';
import { getTeacherSchedule } from '../../services/teacherService';
import WeeklyCalendar from '../../components/common/WeeklyCalendar';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const Schedule = () => {
    const { lang, t } = useLanguage();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teacherName, setTeacherName] = useState('');

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const response = await getTeacherSchedule();
                setSchedule(response.data.schedule || []);
                if (response.data.teacher) {
                    setTeacherName(response.data.teacher.name);
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">{t("កាលវិភាគបង្រៀនរបស់ខ្ញុំ 🗓️", "My Teaching Schedule 🗓️")}</h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                        {t("សូមស្វាគមន៍មកវិញ", "Welcome back")}, <strong>{teacherName || t('លោកគ្រូ/អ្នកគ្រូ', 'Teacher')}</strong>. {t("នេះជាកាលវិភាគបង្រៀនប្រចាំសប្តាហ៍របស់អ្នក។", "Here is your weekly timetable.")}
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <WeeklyCalendar schedule={schedule} type="teacher" />
            </div>
        </div>
    );
};

export default Schedule;
