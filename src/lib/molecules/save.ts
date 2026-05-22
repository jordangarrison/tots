import { SAVE_KEY } from './types';
import type { MoleculesSave } from './types';

function emptySave(): MoleculesSave {
	return { version: 1, discovered: {}, questsCompleted: {} };
}

export function loadProgress(): MoleculesSave {
	if (typeof window === 'undefined') return emptySave();
	try {
		const raw = window.localStorage.getItem(SAVE_KEY);
		if (!raw) return emptySave();
		const parsed = JSON.parse(raw);
		if (
			parsed &&
			parsed.version === 1 &&
			parsed.discovered &&
			typeof parsed.discovered === 'object' &&
			parsed.questsCompleted &&
			typeof parsed.questsCompleted === 'object'
		) {
			return parsed as MoleculesSave;
		}
	} catch {
		// fall through
	}
	return emptySave();
}

function persist(save: MoleculesSave): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
	} catch {
		// Privacy mode / quota — fail silently.
	}
}

export function recordDiscovery(key: string): MoleculesSave {
	const save = loadProgress();
	if (!save.discovered[key]) {
		save.discovered[key] = { firstSeen: Date.now() };
		persist(save);
	}
	return save;
}

export function recordQuest(questId: string): MoleculesSave {
	const save = loadProgress();
	if (!save.questsCompleted[questId]) {
		save.questsCompleted[questId] = Date.now();
		persist(save);
	}
	return save;
}

export function clearProgress(): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.removeItem(SAVE_KEY);
	} catch {
		// noop
	}
}
