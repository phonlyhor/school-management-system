import styles from './StatCard.module.css';

const StatCard = ({ title, value, icon, color = 'var(--primary-color)' }) => {
    return (
        <div className={styles.statCard}>
            {icon && (
                <div 
                    className={styles.icon} 
                    style={{ 
                        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                        color: color 
                    }}
                >
                    {icon}
                </div>
            )}
            <div className={styles.content}>
                <span className={styles.title}>{title}</span>
                <span className={styles.value}>{value}</span>
            </div>
        </div>
    );
};

export default StatCard;
