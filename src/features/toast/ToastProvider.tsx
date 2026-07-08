import { IonToast } from '@ionic/react';
import { useCallback, useState, type ReactNode } from 'react';
import { ToastContext } from './ToastContext';

/** Provides `useToast()` and renders a single bottom toast for brief action
 * confirmations (added to queue/playlist, saved, etc.). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <IonToast
        isOpen={open}
        message={message}
        duration={2000}
        position="bottom"
        data-testid="app-toast"
        onDidDismiss={() => setOpen(false)}
      />
    </ToastContext.Provider>
  );
}
