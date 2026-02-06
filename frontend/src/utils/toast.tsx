/**
 * Toast Utility - Modern replacement for alert() and confirm()
 * 
 * Usage:
 * - showSuccess('Séance créée !') instead of alert('✅ Séance créée !')
 * - showError('Erreur') instead of alert('❌ Erreur')
 * - showConfirm('Supprimer ?', onConfirm) instead of if (confirm('Supprimer ?'))
 */

import toast from 'react-hot-toast';

/**
 * Success notification
 */
export const showSuccess = (message: string, options?: { duration?: number }) => {
  toast.success(message, {
    duration: options?.duration || 3000,
    style: {
      background: '#10b981',
      color: 'white',
      fontWeight: '500',
    },
  });
};

/**
 * Error notification
 */
export const showError = (message: string, error?: Error | string) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  toast.error(
    errorMessage ? `${message}: ${errorMessage}` : message,
    {
      duration: 5000,
      style: {
        background: '#ef4444',
        color: 'white',
        fontWeight: '500',
      },
    }
  );
};

/**
 * Info notification
 */
export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: 'white',
      fontWeight: '500',
    },
  });
};

/**
 * Warning notification
 */
export const showWarning = (message: string) => {
  toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: 'white',
      fontWeight: '500',
    },
  });
};

/**
 * Loading notification (returns toast id to dismiss later)
 */
export const showLoading = (message: string = 'Chargement...') => {
  return toast.loading(message, {
    style: {
      background: '#6366f1',
      color: 'white',
      fontWeight: '500',
    },
  });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Modern confirmation dialog replacement
 * 
 * Usage:
 * showConfirm(
 *   'Voulez-vous vraiment supprimer cette séance ?',
 *   () => handleDelete(),
 *   { confirmText: 'Supprimer', dangerous: true }
 * )
 */
export const showConfirm = (
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    dangerous?: boolean; // Red button for destructive actions
  }
) => {
  const confirmText = options?.confirmText || 'Confirmer';
  const cancelText = options?.cancelText || 'Annuler';
  const dangerous = options?.dangerous || false;

  toast(
    (t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              toast.dismiss(t.id);
            }}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: dangerous ? '#ef4444' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = dangerous ? '#dc2626' : '#4f46e5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = dangerous ? '#ef4444' : '#6366f1';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity, // Manual dismiss only
      style: {
        background: 'white',
        color: '#111827',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '400px',
      },
    }
  );
};

/**
 * Promise-based toast (for async operations)
 * 
 * Usage:
 * showPromise(
 *   saveSession(),
 *   {
 *     loading: 'Sauvegarde en cours...',
 *     success: 'Séance créée avec succès !',
 *     error: 'Erreur lors de la sauvegarde'
 *   }
 * )
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages, {
    success: {
      style: {
        background: '#10b981',
        color: 'white',
      },
    },
    error: {
      style: {
        background: '#ef4444',
        color: 'white',
      },
    },
  });
};

// Export default object with all functions
export default {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showConfirm,
  showLoading
};
