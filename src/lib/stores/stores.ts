import { writable } from 'svelte/store';

export const isDarkMode = writable(true);
export const includeInactiveDReps = writable(false);