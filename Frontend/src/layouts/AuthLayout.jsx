import styles from './AuthLayout.module.css';

const AuthLayout = ({ children }) => {
    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
