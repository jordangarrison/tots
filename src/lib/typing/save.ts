import { SAVE_KEY } from './types';
import type { LessonResult, TypingSave } from './types';

function emptySave(): TypingSave {
	return { version: 1, completed: {} };
}

export function loadProgress(): TypingSave {
	if (typeof window === 'undefined') return emptySave();
	try {
		const raw = window.localStorage.getItem(SAVE_KEY);
		if (!raw) return emptySave();
		const parsed = JSON.parse(raw);
		if (
			parsed &&
			parsed.version === 1 &&
			parsed.completed &&
			typeof parsed.completed === 'object'
		) {
			return parsed as TypingSave;
		}
	} catch {
		// fall through
	}
	return emptySave();
}

export function recordResult(result: LessonResult): TypingSave {
	const save = loadProgress();
	const prev = save.completed[result.lessonId];
	// Only overwrite if the new result is at least as good — kids should be
	// allowed to retry without losing their best score.
	if (!prev || result.stars >= prev.stars) {
		save.completed[result.lessonId] = result;
	}
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
		} catch {
			// Privacy mode / quota — fail silently. The session still works.
		}
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
