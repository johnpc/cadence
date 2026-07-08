import { useContext } from 'react';
import { ToastContext, type ShowToast } from './ToastContext';

/** Access the app-wide toast trigger. */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}
