import styles from './Button.module.css';

const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    size = 'medium', 
    fullWidth = false, 
    disabled = false,
    loading = false,
    className = '',
    style = {},
    title
}) => {
    
    const combinedClasses = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button 
            type={type} 
            className={combinedClasses} 
            onClick={onClick}
            disabled={disabled || loading}
            style={style}
            title={title}
        >
            {children}
        </button>
    );
};

export default Button;
