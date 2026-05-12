// Tiny wrapper around the Web Speech API so the typing teacher can read
// letters and words out loud — critical for pre-reading kids. Everything
// silently no-ops when the API is unavailable (older browsers, SSR).
//
// Browsers gate speechSynthesis behind a user gesture. We wait until the
// learner has touched a key (or pressed START) before speaking.

const SETTINGS_KEY = 'tots.typing.audio.v1';

let unlocked = false;
let voicesReady = false;

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

/** Call from a click/keydown handler to unlock speech on iOS/Safari. */
export function unlockSpeech(): void {
	if (!isSupported() || unlocked) return;
	const u = new SpeechSynthesisUtterance(' ');
	u.volume = 0;
	try {
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
	// Prefer a friendly child-leaning English voice if available.
	const preferred = [
		/karen/i,
		/samantha/i,
		/victoria/i,
		/allison/i,
		/susan/i,
		/google us english/i,
		/microsoft (zira|aria|jenny)/i
	];
	for (const re of preferred) {
		const match = voices.find((v) => v.lang.startsWith('en') && re.test(v.name));
		if (match) return match;
	}
	return voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
}

function ensureVoicesReady(): Promise<void> {
	if (!isSupported() || voicesReady) return Promise.resolve();
	const synth = window.speechSynthesis;
	if (synth.getVoices().length) {
		voicesReady = true;
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		const onChange = () => {
			voicesReady = true;
			synth.removeEventListener('voiceschanged', onChange);
			resolve();
		};
		synth.addEventListener('voiceschanged', onChange);
		// Some browsers (Chrome) fire voiceschanged late or not at all on first call;
		// resolve after a short timeout so we don't block forever.
		setTimeout(() => {
			voicesReady = true;
			resolve();
		}, 250);
	});
}

interface SpeakOptions {
	rate?: number;
	pitch?: number;
	/** If true, queue this speech behind any current utterance. Default cancels. */
	queue?: boolean;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
	if (!isSupported() || !audioEnabled()) return;
	const synth = window.speechSynthesis;
	if (!opts.queue) synth.cancel();
	void ensureVoicesReady().then(() => {
		const u = new SpeechSynthesisUtterance(text);
		u.rate = opts.rate ?? 0.95;
		u.pitch = opts.pitch ?? 1.15;
		const voice = pickVoice();
		if (voice) u.voice = voice;
		try {
			synth.speak(u);
		} catch {
			// noop
		}
	});
}

/** Reads a single character. Letters get just their name; punctuation gets a kid-friendly label. */
export function speakChar(char: string): void {
	const c = char.toLowerCase();
	let phrase: string;
	if (c === ' ') phrase = 'space';
	else if (c === ';') phrase = 'semicolon';
	else if (c === '/') phrase = 'slash';
	else if (c === '.') phrase = 'dot';
	else if (c === ',') phrase = 'comma';
	else if (/[a-z]/.test(c)) phrase = c.toUpperCase();
	else phrase = char;
	speak(phrase, { rate: 0.9, pitch: 1.2 });
}
