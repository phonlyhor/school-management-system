import Card from '../common/Card';
import { FiUser } from 'react-icons/fi';
import styles from './ProfileCard.module.css';

const ProfileCard = ({ name, role, id, photo, metaDetails = [] }) => {
    const getImageUrl = (img) => {
        if (!img) return null;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${img.replace(/^\//, '')}`;
    };

    const imageUrl = getImageUrl(photo);

    return (
        <Card className={styles.profileCard}>
            <div className={styles.avatarSection}>
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={name} 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1', marginBottom: '0.5rem' }}
                    />
                ) : (
                    <div className={styles.avatar}>
                        <FiUser size={48} />
                    </div>
                )}
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
