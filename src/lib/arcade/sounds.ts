// Tiny WebAudio chiptune sound effects for the arcade. No audio assets —
// everything is synthesized with oscillators, so it works offline and
// loads instantly. All functions are safe to call during SSR (they no-op).

import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const MUTE_KEY = 'tots:arcade:muted';

function loadMuted(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(MUTE_KEY) === '1';
	} catch {
		return false;
	}
}

export const muted = writable(loadMuted());

let isMuted = loadMuted();
muted.subscribe((value) => {
	isMuted = value;
	if (!browser) return;
	try {
		localStorage.setItem(MUTE_KEY, value ? '1' : '0');
	} catch {
		// Storage unavailable (private mode) — sound toggle just won't persist.
	}
});

export function toggleMuted() {
	muted.update((m) => !m);
}

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
	if (!browser) return null;
	const Ctor =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!Ctor) return null;
	if (!ctx) ctx = new Ctor();
	// Browsers suspend audio until a user gesture; our sfx calls all happen
	// inside click/keydown handlers, so resuming here is allowed.
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

interface Note {
	/** Frequency in Hz. */
	freq: number;
	/** Start offset in seconds from now. */
	at: number;
	/** Duration in seconds. */
	dur: number;
	type?: OscillatorType;
	/** Peak gain, defaults to a gentle 0.06. */
	gain?: number;
	/** Optional frequency to glide to over the note. */
	slideTo?: number;
}

function play(notes: Note[]) {
	if (isMuted) return;
	const ac = audioContext();
	if (!ac) return;
	const now = ac.currentTime;
	for (const n of notes) {
		const osc = ac.createOscillator();
		const amp = ac.createGain();
		osc.type = n.type ?? 'square';
		osc.frequency.setValueAtTime(n.freq, now + n.at);
		if (n.slideTo !== undefined) {
			osc.frequency.exponentialRampToValueAtTime(Math.max(1, n.slideTo), now + n.at + n.dur);
		}
		const peak = n.gain ?? 0.06;
		amp.gain.setValueAtTime(0, now + n.at);
		amp.gain.linearRampToValueAtTime(peak, now + n.at + 0.005);
		amp.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.dur);
		osc.connect(amp);
		amp.connect(ac.destination);
		osc.start(now + n.at);
		osc.stop(now + n.at + n.dur + 0.02);
	}
}

/** Cursor moved on a menu. */
export function sfxMove() {
	play([{ freq: 620, at: 0, dur: 0.05, gain: 0.04 }]);
}

/** Classic two-tone "coin in" chime. */
export function sfxCoin() {
	play([
		{ freq: 988, at: 0, dur: 0.08 },
		{ freq: 1319, at: 0.08, dur: 0.28 }
	]);
}

/** Ascending "game start" arpeggio. */
export function sfxStart() {
	play([
		{ freq: 523, at: 0, dur: 0.09 },
		{ freq: 659, at: 0.09, dur: 0.09 },
		{ freq: 784, at: 0.18, dur: 0.09 },
		{ freq: 1047, at: 0.27, dur: 0.22 }
	]);
}

/** Soft descending blip for going back / exiting. */
export function sfxBack() {
	play([
		{ freq: 660, at: 0, dur: 0.06, gain: 0.05 },
		{ freq: 440, at: 0.06, dur: 0.1, gain: 0.05 }
	]);
}

/** Short positive blip (a pump stroke, a correct key, a small win). */
export function sfxBlip() {
	play([{ freq: 880, at: 0, dur: 0.06, gain: 0.05 }]);
}

/** Pop! Something burst or got collected. */
export function sfxPop() {
	play([{ freq: 300, at: 0, dur: 0.18, slideTo: 1200, type: 'square', gain: 0.07 }]);
}

/** Low rumble for a rock landing / something heavy. */
export function sfxThud() {
	play([{ freq: 140, at: 0, dur: 0.25, slideTo: 50, type: 'triangle', gain: 0.12 }]);
}

/** Sad downward slide for losing a life. */
export function sfxHit() {
	play([{ freq: 440, at: 0, dur: 0.35, slideTo: 110, type: 'sawtooth', gain: 0.06 }]);
}

/** Level-clear fanfare. */
export function sfxFanfare() {
	play([
		{ freq: 523, at: 0, dur: 0.1 },
		{ freq: 659, at: 0.1, dur: 0.1 },
		{ freq: 784, at: 0.2, dur: 0.1 },
		{ freq: 659, at: 0.3, dur: 0.1 },
		{ freq: 784, at: 0.4, dur: 0.1 },
		{ freq: 1047, at: 0.5, dur: 0.35 }
	]);
}

/** Game-over dirge. */
export function sfxGameOver() {
	play([
		{ freq: 392, at: 0, dur: 0.18, type: 'triangle', gain: 0.08 },
		{ freq: 330, at: 0.2, dur: 0.18, type: 'triangle', gain: 0.08 },
		{ freq: 262, at: 0.4, dur: 0.18, type: 'triangle', gain: 0.08 },
		{ freq: 196, at: 0.6, dur: 0.45, type: 'triangle', gain: 0.08 }
	]);
}

/** New high score! Big celebratory run. */
export function sfxHighScore() {
	play([
		{ freq: 659, at: 0, dur: 0.08 },
		{ freq: 784, at: 0.08, dur: 0.08 },
		{ freq: 988, at: 0.16, dur: 0.08 },
		{ freq: 1319, at: 0.24, dur: 0.08 },
		{ freq: 988, at: 0.32, dur: 0.08 },
		{ freq: 1319, at: 0.4, dur: 0.3 }
	]);
}
