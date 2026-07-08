import { createContext } from 'react';

/** Shows a brief confirmation message (e.g. "Added to queue"). */
export type ShowToast = (message: string) => void;

export const ToastContext = createContext<ShowToast>(() => {});
