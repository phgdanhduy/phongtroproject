// Explicit opt-in; never silently substitute mock data when a real API fails.
const configured = import.meta.env.VITE_PHASE2_MODE || (import.meta.env.MODE === 'phase2' ? 'mock' : import.meta.env.MODE === 'phase2-real' ? 'real' : 'baseline');
export const mode = configured === 'mock' && import.meta.env.DEV ? 'mock' : configured === 'real' ? 'real' : 'baseline';
export const isMock = mode === 'mock';
