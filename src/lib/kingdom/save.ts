import type { CharacterId } from '$lib/characters';
import { SAVE_KEY, emptyInventory } from './types';
import type { SaveState } from './types';

export function newSave(characterId: CharacterId): SaveState {
	return {
		version: 1,
		characterId,
		areaId: 'courtyard',
		playerX: 4,
		playerY: 5,
		facing: 'down',
		inventory: emptyInventory(),
		plots: {},
		visitedAreas: ['courtyard']
	};
}

export function loadSave(): SaveState | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.localStorage.getItem(SAVE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (parsed && parsed.version === 1) return parsed as SaveState;
		return null;
	} catch {
		return null;
	}
}

export function writeSave(state: SaveState): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
	} catch {
		// Quota or privacy mode — fail silently; gameplay still works in-session.
	}
}

export function clearSave(): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.removeItem(SAVE_KEY);
	} catch {
		// noop
	}
}
