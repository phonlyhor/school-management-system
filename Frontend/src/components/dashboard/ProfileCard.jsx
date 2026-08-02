import Card from '../common/Card';
import { FiUser } from 'react-icons/fi';
import styles from './ProfileCard.module.css';

const ProfileCard = ({ name, role, id, metaDetails = [] }) => {
    return (
        <Card className={styles.profileCard}>
            <div className={styles.avatarSection}>
                <div className={styles.avatar}>
                    <FiUser size={48} />
                </div>
                <h3 className={styles.name}>{name}</h3>
                <span className={styles.role}>{role}</span>
            </div>
            
            <div className={styles.metaSection}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>ID</span>
                    <span className={styles.metaValue}>{id}</span>
                </div>
                {metaDetails.map((detail, index) => (
                    <div key={index} className={styles.metaItem}>
                        <span className={styles.metaLabel}>{detail.label}</span>
                        <span className={styles.metaValue}>{detail.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ProfileCard;
