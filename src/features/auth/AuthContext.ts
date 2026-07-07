import { createContext } from 'react';
import type { AuthContextValue } from './types';

/** Auth context; consumed via the useAuth hook. Null until a provider mounts. */
export const AuthContext = createContext<AuthContextValue | null>(null);
