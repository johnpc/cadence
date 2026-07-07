import { createContext } from 'react';
import type { ThemeContextValue } from './types';

/** Theme context; consumed via the useTheme hook. Null until a provider mounts. */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
