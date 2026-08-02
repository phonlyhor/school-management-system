import styles from './Card.module.css';

const Card = ({ title, children, footer, className = '', headerAction }) => {
    return (
        <div className={`${styles.card} ${className}`}>
            {(title || headerAction) && (
                <div className={styles.header}>
                    {title && <h3 className={styles.title}>{title}</h3>}
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            
            <div className={styles.body}>
                {children}
            </div>

            {footer && (
                <div className={styles.footer}>
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
