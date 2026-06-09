// Persistent arcade records: high scores and play counts per game, backed
// by localStorage and exposed as a Svelte store so the hub can show live
// "HI-SCORE" marquees. SSR-safe: on the server the store is just empty.

import { browser } from '$app/environment';
import { writable, type Readable } from 'svelte/store';

const STORAGE_KEY = 'tots:arcade:records:v1';

export type GameId =
	| 'draw'
	| 'coloring'
	| 'cards'
	| 'adventure'
	| 'kingdom'
	| 'digdug'
	| 'typing'
	| 'molecules';

export interface GameRecord {
	/** Best score ever, for games that keep score. */
	highScore?: number;
	/** How many times the game has been opened. */
	plays: number;
	/** Epoch ms of the last visit. */
	lastPlayedAt: number;
}

export type Records = Partial<Record<GameId, GameRecord>>;

function load(): Records {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return typeof parsed === 'object' && parsed !== null ? (parsed as Records) : {};
	} catch {
		return {};
	}
}

const store = writable<Records>(load());

export const records: Readable<Records> = { subscribe: store.subscribe };

function persist(value: Records) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {
		// Storage full or unavailable — records just won't survive reload.
	}
}

function update(game: GameId, fn: (rec: GameRecord) => GameRecord) {
	store.update((all) => {
		const prev = all[game] ?? { plays: 0, lastPlayedAt: 0 };
		const next = { ...all, [game]: fn(prev) };
		persist(next);
		return next;
	});
}

/** Call when a game is opened; bumps the play counter. */
export function recordPlay(game: GameId) {
	update(game, (rec) => ({ ...rec, plays: rec.plays + 1, lastPlayedAt: Date.now() }));
}

/**
 * Report a finished (or in-progress) score. Keeps the maximum.
 * Returns true when this set a new high score.
 */
export function reportScore(game: GameId, score: number): boolean {
	if (!Number.isFinite(score) || score <= 0) return false;
	let isNewBest = false;
	update(game, (rec) => {
		const prevBest = rec.highScore ?? 0;
		isNewBest = score > prevBest;
		return {
			...rec,
			highScore: Math.max(prevBest, score),
			lastPlayedAt: Date.now()
		};
	});
	return isNewBest;
}

/** Zero-padded arcade-style score, e.g. 4250 -> "004250". */
export function formatScore(score: number): string {
	return Math.floor(score).toString().padStart(6, '0');
}
