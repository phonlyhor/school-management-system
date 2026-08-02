import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            &copy; {new Date().getFullYear()} School Management System. All rights reserved.
        </footer>
    );
};

export default Footer;
