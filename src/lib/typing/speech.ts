// Tiny wrapper around the Web Speech API so the typing teacher can read
// letters and words out loud — critical for pre-reading kids. Everything
// silently no-ops when the API is unavailable (older browsers, SSR).
//
// Browser autoplay rules require that the FIRST speech call happen inside a
// user-gesture handler (click / keydown). We therefore:
//   • never speak from onMount / setTimeout / promise continuations,
//   • call unlockSpeech() at the start of every gesture handler before speak(),
//   • keep the speak() function fully synchronous so the call stays inside
//     the gesture.
//
// We deliberately do NOT await `voiceschanged`. Browsers play with the default
// voice if none is selected, which is fine — the audio still happens.

const SETTINGS_KEY = 'tots.typing.audio.v1';

function isSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function audioEnabled(): boolean {
	if (typeof window === 'undefined') return true;
	try {
		const raw = window.localStorage.getItem(SETTINGS_KEY);
		// Default ON — the youngest learners need it most.
		return raw === null ? true : raw === 'on';
	} catch {
		return true;
	}
}

export function setAudioEnabled(on: boolean): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(SETTINGS_KEY, on ? 'on' : 'off');
	} catch {
		// privacy mode / quota — fall through
	}
	if (!on && isSupported()) window.speechSynthesis.cancel();
}

let unlocked = false;

/** Call from a keydown/click handler to unlock speech on Safari/Chrome. */
export function unlockSpeech(): void {
	if (!isSupported() || unlocked) return;
	try {
		// Some browsers leave the engine in a paused state until you nudge it.
		window.speechSynthesis.resume();
		const u = new SpeechSynthesisUtterance(' ');
		u.volume = 0;
		window.speechSynthesis.speak(u);
		unlocked = true;
	} catch {
		// noop
	}
}

function pickVoice(): SpeechSynthesisVoice | null {
	if (!isSupported()) return null;
	const voices = window.speechSynthesis.getVoices();
	if (!voices.length) return null;
	const preferred = [
		/karen/i,
		/samantha/i,
		/victoria/i,
		/allison/i,
		/google us english/i,
		/microsoft (zira|aria|jenny)/i
	];
	for (const re of preferred) {
		const match = voices.find((v) => v.lang.startsWith('en') && re.test(v.name));
		if (match) return match;
	}
	return voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
}

interface SpeakOptions {
	rate?: number;
	pitch?: number;
	/** If true, queue this speech behind any current utterance. Default cancels. */
	queue?: boolean;
}

/** Synchronously speak text. Must be called from a user gesture handler. */
export function speak(text: string, opts: SpeakOptions = {}): void {
	if (!isSupported() || !audioEnabled() || !text) return;
	try {
		const synth = window.speechSynthesis;
		if (!opts.queue) synth.cancel();
		// Chrome sometimes leaves the queue paused after cancel(); resume() is harmless.
		synth.resume();
		const u = new SpeechSynthesisUtterance(text);
		u.rate = opts.rate ?? 0.95;
		u.pitch = opts.pitch ?? 1.15;
		u.volume = 1;
		const voice = pickVoice();
		if (voice) u.voice = voice;
		synth.speak(u);
	} catch {
		// noop
	}
}

/** Reads a single character. Letters get their name; punctuation gets a kid-friendly label. */
export function speakChar(char: string): void {
	let phrase: string;
	switch (char) {
		case ' ':
			phrase = 'space';
			break;
		case ';':
			phrase = 'semicolon';
			break;
		case ':':
			phrase = 'colon';
			break;
		case '/':
			phrase = 'slash';
			break;
		case '?':
			phrase = 'question mark';
			break;
		case '.':
			phrase = 'dot';
			break;
		case ',':
			phrase = 'comma';
			break;
		case '!':
			phrase = 'exclamation';
			break;
		case "'":
			phrase = 'apostrophe';
			break;
		case '"':
			phrase = 'quote';
			break;
		default:
			if (/[0-9]/.test(char)) phrase = char;
			else if (/[a-z]/i.test(char))
				phrase =
					char === char.toUpperCase() && char !== char.toLowerCase()
						? `capital ${char.toUpperCase()}`
						: char.toUpperCase();
			else phrase = char;
	}
	speak(phrase, { rate: 0.9, pitch: 1.2 });
}
