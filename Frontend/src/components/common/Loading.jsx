import styles from './Loading.module.css';

const Loading = ({ text = 'Loading...' }) => {
    return (
        <div className={styles.container}>
            <div className={styles.spinner}></div>
            {text && <div className={styles.text}>{text}</div>}
        </div>
    );
};

export default Loading;
