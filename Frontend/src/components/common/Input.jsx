import styles from './Input.module.css';

const Input = ({ 
    label, 
    type = 'text', 
    name, 
    value, 
    onChange, 
    placeholder, 
    error,
    required = false,
    className = ''
}) => {
    return (
        <div className={`${styles.wrapper} ${className}`}>
            {label && (
                <label className={styles.label} htmlFor={name}>
                    {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                </label>
            )}
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`${styles.input} ${error ? styles.error : ''}`}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};

export default Input;
