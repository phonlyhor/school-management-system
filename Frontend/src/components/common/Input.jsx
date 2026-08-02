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
    className = '',
    readOnly = false,
    disabled = false,
    style,
    ...props
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
                value={value ?? ''}
                onChange={onChange || (() => {})}
                placeholder={placeholder}
                required={required}
                readOnly={readOnly}
                disabled={disabled}
                style={style}
                className={`${styles.input} ${error ? styles.error : ''}`}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};

export default Input;
