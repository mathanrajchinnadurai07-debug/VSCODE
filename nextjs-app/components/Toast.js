import { useState, useEffect, useCallback } from 'react';

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    // Expose showToast globally for any component to use
    window.showToast = (message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3000);
    };
    return () => { delete window.showToast; };
  }, [removeToast]);

  if (!toasts.length) return null;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <i className={`fas ${icons[t.type] || icons.info}`}></i> {t.message}
        </div>
      ))}
    </div>
  );
}
