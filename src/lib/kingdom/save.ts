import type { CharacterId } from '$lib/characters';
import { SAVE_KEY, emptyFriendship, emptyInventory } from './types';
import type { SaveState } from './types';

export function newSave(characterId: CharacterId): SaveState {
	return {
		version: 2,
		characterId,
		areaId: 'courtyard',
		playerX: 4,
		playerY: 5,
		facing: 'down',
		inventory: emptyInventory(),
		plots: {},
		visitedAreas: ['courtyard'],
		placedDecor: [],
		friendship: emptyFriendship(),
		activeQuests: {},
		questsDone: 0
	};
}

/** Upgrade any older save shape to the current version in place. */
function migrate(parsed: Record<string, unknown>): SaveState {
	const save = parsed as unknown as SaveState;
	save.version = 2;
	// Backfill any inventory keys added since this save was written.
	save.inventory = { ...emptyInventory(), ...(parsed.inventory as object) };
	if (!Array.isArray(save.placedDecor)) save.placedDecor = [];
	save.friendship = { ...emptyFriendship(), ...(parsed.friendship as object) };
	if (typeof save.activeQuests !== 'object' || save.activeQuests === null) save.activeQuests = {};
	if (typeof save.questsDone !== 'number') save.questsDone = 0;
	return save;
}

export function loadSave(): SaveState | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.localStorage.getItem(SAVE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (parsed && (parsed.version === 1 || parsed.version === 2)) {
			return migrate(parsed);
		}
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
