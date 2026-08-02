import Card from '../common/Card';
import styles from './ChartCard.module.css';

const ChartCard = ({ title, children, type = "bar" }) => {
    // In a real app, you would pass data to Recharts or Chart.js here.
    // For now, we will render a CSS-based placeholder for the UI design.

    return (
        <Card title={title} className={styles.chartCard}>
            <div className={styles.chartContainer}>
                {children ? children : (
                    <div className={styles.placeholderChart}>
                        <div className={styles.barGroup}>
                            <div className={styles.bar} style={{ height: '60%' }}></div>
                            <span className={styles.label}>Mon</span>
                        </div>
                        <div className={styles.barGroup}>
                            <div className={styles.bar} style={{ height: '80%' }}></div>
                            <span className={styles.label}>Tue</span>
                        </div>
                        <div className={styles.barGroup}>
                            <div className={styles.bar} style={{ height: '40%' }}></div>
                            <span className={styles.label}>Wed</span>
                        </div>
                        <div className={styles.barGroup}>
                            <div className={styles.bar} style={{ height: '90%' }}></div>
                            <span className={styles.label}>Thu</span>
                        </div>
                        <div className={styles.barGroup}>
                            <div className={styles.bar} style={{ height: '75%' }}></div>
                            <span className={styles.label}>Fri</span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ChartCard;
