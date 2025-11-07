interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export function Loader({ size = 'medium', text }: LoaderProps) {
  return (
    <div className="loader-container">
      <div className={`loader loader-${size}`}>
        <div className="spinner"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
