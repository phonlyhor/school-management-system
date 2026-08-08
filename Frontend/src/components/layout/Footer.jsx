import { useLanguage } from '../../context/LanguageContext';
import styles from './Footer.module.css';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className={styles.footer}>
            <p>© {new Date().getFullYear()} KH Learning. {t('រក្សាសិទ្ធិគ្រប់យ៉ាង។', 'All rights reserved.')}</p>
            <p style={{ marginTop: '0.25rem' }}>
                {t('អភិវឌ្ឍន៍ដោយ ❤️', 'Developed with ❤️ by')}{' '}
                <a
                    href="https://phonlyhorcoding.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 600, color: 'var(--primary-color, #2563eb)', textDecoration: 'none' }}
                >
                    {t('ផុន លីហ័រ', 'Phon Lyhor')}
                </a>
            </p>
        </footer>
    );
};

export default Footer;

