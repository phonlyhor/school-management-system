import React, { useState } from 'react';
import styles from './WeeklyCalendar.module.css';
import { useLanguage } from '../../context/LanguageContext';

const DAYS = [
    { key: 'Monday', kh: 'ច័ន្ទ', en: 'Monday' },
    { key: 'Tuesday', kh: 'អង្គារ', en: 'Tuesday' },
    { key: 'Wednesday', kh: 'ពុធ', en: 'Wednesday' },
    { key: 'Thursday', kh: 'ព្រហស្បតិ៍', en: 'Thursday' },
    { key: 'Friday', kh: 'សុក្រ', en: 'Friday' },
    { key: 'Saturday', kh: 'សៅរ៍', en: 'Saturday' }
];

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || '00';
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
};

const getItemSession = (item) => {
    if (item.session) return item.session;
    if (!item.start_time) return 'morning';
    const hour = parseInt(item.start_time.split(':')[0], 10);
    if (hour < 12) return 'morning';
    return 'afternoon';
};

const isPeriodPassed = (dayKey, endTimeStr) => {
    if (!endTimeStr) return false;
    const daysMap = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };
    const now = new Date();
    const currentDay = now.getDay();
    const targetDay = daysMap[dayKey];

    if (targetDay === undefined) return false;
    if (currentDay > targetDay) return true;
    if (currentDay < targetDay) return false;

    // Today: compare time
    const parts = endTimeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (isNaN(h)) return false;
    const endMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return nowMinutes >= endMinutes;
};

const WeeklyCalendar = ({ schedule = [], type = 'student' }) => {
    const { lang, t } = useLanguage();
    const [activeSession, setActiveSession] = useState('all'); // 'all', 'morning', 'afternoon'

    // Clean English in parentheses if in Khmer mode
    const formatSubjectName = (name) => {
        if (!name) return '';
        if (lang === 'kh') {
            return name.replace(/\s*\([A-Za-z\s-]+\)\s*/g, '').trim();
        }
        return name;
    };

    // Filter schedule by active session tab
    const filteredSchedule = schedule.filter(item => {
        if (activeSession === 'all') return true;
        return getItemSession(item) === activeSession;
    });

    // Group schedule by day
    const scheduleByDay = DAYS.reduce((acc, dayObj) => {
        acc[dayObj.key] = filteredSchedule
            .filter(item => item.day === dayObj.key)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
        return acc;
    }, {});

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Session Tabs Filter: Morning, Afternoon */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                backgroundColor: '#f1f5f9',
                padding: '0.4rem',
                borderRadius: '12px',
                width: 'fit-content',
                alignSelf: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setActiveSession('all')}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: activeSession === 'all' ? '#ffffff' : 'transparent',
                        color: activeSession === 'all' ? '#0f172a' : '#64748b',
                        boxShadow: activeSession === 'all' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
                    }}
                >
                    📅 {t("ទាំងអស់", "All")}
                </button>

                <button
                    onClick={() => setActiveSession('morning')}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: activeSession === 'morning' ? '#eff6ff' : 'transparent',
                        color: activeSession === 'morning' ? '#1e40af' : '#64748b',
                        border: activeSession === 'morning' ? '1px solid #bfdbfe' : 'none',
                        boxShadow: activeSession === 'morning' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
                    }}
                >
                    🌅 {t("ពេលព្រឹក", "Morning")}
                </button>

                <button
                    onClick={() => setActiveSession('afternoon')}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: activeSession === 'afternoon' ? '#fff7ed' : 'transparent',
                        color: activeSession === 'afternoon' ? '#c2410c' : '#64748b',
                        border: activeSession === 'afternoon' ? '1px solid #fed7aa' : 'none',
                        boxShadow: activeSession === 'afternoon' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
                    }}
                >
                    🌇 {t("ពេលរសៀល", "Afternoon")}
                </button>
            </div>

            <div className={styles.calendarContainer}>
                {DAYS.map(dayObj => {
                    const dayKey = dayObj.key;
                    const dayLabel = lang === 'kh' ? dayObj.kh : dayObj.en;
                    const items = scheduleByDay[dayKey] || [];

                    return (
                        <div key={dayKey} className={styles.dayColumn}>
                            <div className={styles.dayHeader}>{dayLabel}</div>
                            
                            {items.length === 0 ? (
                                <div className={styles.emptyState}>{t("គ្មានម៉ោងសិក្សា", "No classes")}</div>
                            ) : (
                                items.map(item => {
                                    const sess = getItemSession(item);
                                    const isMorning = sess === 'morning';
                                    const sessionBadgeText = isMorning ? t('🌅 ព្រឹក', '🌅 Morning') : t('🌇 រសៀល', '🌇 Afternoon');
                                    const sessionBadgeBg = isMorning ? '#dbeafe' : '#ffedd5';
                                    const sessionBadgeColor = isMorning ? '#1e40af' : '#9a3412';

                                    return (
                                        <div 
                                            key={item.id} 
                                            className={styles.scheduleCard}
                                            style={{
                                                borderLeft: `4px solid ${isMorning ? '#3b82f6' : '#f97316'}`,
                                                backgroundColor: isMorning ? '#f8fafc' : '#fffaf5'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <div className={styles.timeSlot}>
                                                    ⏱ {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: '700',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '6px',
                                                    backgroundColor: sessionBadgeBg,
                                                    color: sessionBadgeColor
                                                }}>
                                                    {sessionBadgeText}
                                                </span>
                                            </div>

                                            <h4 className={styles.subjectName}>{formatSubjectName(item.subject?.name)}</h4>
                                            
                                            {type === 'teacher' && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailIcon}>👥</span>
                                                    {t("ថ្នាក់", "Class")} {item.class?.name} ({t("កម្រិតថ្នាក់", "Grade")} {item.class?.grade_level})
                                                </div>
                                            )}
                                            
                                            {item.teacher && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailIcon}>👨‍🏫</span>
                                                    {item.teacher?.name}
                                                    {item.secondary_teacher && (
                                                        <span style={{ color: '#4338ca', fontWeight: '600' }}>
                                                            {" & 👩‍🏫 " + item.secondary_teacher.name}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailIcon}>📍</span>
                                                {t("បន្ទប់", "Room")}: {item.room || 'N/A'}
                                            </div>

                                            {isPeriodPassed(dayKey, item.end_time) && (
                                                <div style={{ marginTop: '0.5rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.73rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <span>✅</span> {t("បង្រៀនរួចរាល់", "Completed")}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyCalendar;
