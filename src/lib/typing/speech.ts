// Tiny wrapper around the Web Speech API.
//
// Browser autoplay rules require the FIRST speech call to start synchronously
// inside a user-gesture handler (click / keydown). We therefore keep `speak()`
// fully synchronous and trust the call site to invoke it from a real gesture.
// We do NOT cancel previous utterances by default — letting them play out
// avoids racing the unlock and is fine in practice because utterances are
// very short (a single letter).

const SETTINGS_KEY = 'tots.typing.audio.v1';

function isSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Kick voice loading at module-load time. Chrome populates getVoices()
// asynchronously and fires `voiceschanged` once they're ready — calling it
// here primes that load so the first speak() has a populated list.
if (isSupported()) {
	try {
		window.speechSynthesis.getVoices();
		// Re-run the voice list reporter when voices arrive late. Many engines
		// (Linux speech-dispatcher, Android system TTS) populate voices well
		// after the first getVoices() call.
		window.speechSynthesis.addEventListener('voiceschanged', () => {
			loggedVoices = false;
			warnedNoVoices = false;
			const count = window.speechSynthesis.getVoices().length;
			console.info(`[tots typing] voiceschanged: ${count} voices now available`);
		});
	} catch {
		// noop
	}
}

let warnedSupport = false;
let warnedDisabled = false;
let warnedNoVoices = false;
let loggedVoices = false;

export function audioEnabled(): boolean {
	if (typeof window === 'undefined') return true;
	try {
		const raw = window.localStorage.getItem(SETTINGS_KEY);
		// Default ON. Pre-readers need it.
		return raw !== 'off';
	} catch {
		return true;
	}
}

export function setAudioEnabled(on: boolean): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(SETTINGS_KEY, on ? 'on' : 'off');
	} catch {
		// quota / privacy mode — fall through
	}
	if (!on && isSupported()) {
		try {
			window.speechSynthesis.cancel();
		} catch {
			// noop
		}
	}
}

function pickVoice(): SpeechSynthesisVoice | null {
	if (!isSupported()) return null;
	const voices = window.speechSynthesis.getVoices();
	if (!voices.length) return null;

	if (!loggedVoices) {
		loggedVoices = true;
		console.info(
			`[tots typing] ${voices.length} voices available; en:`,
			voices
				.filter((v) => v.lang.startsWith('en'))
				.map((v) => `${v.name} (${v.lang}, local=${v.localService})`)
		);
	}

	const english = voices.filter((v) => v.lang.startsWith('en'));
	const usEnglish = english.filter((v) => v.lang === 'en-US' || v.lang === 'en_US');
	const friendlyNames = [
		/samantha/i,
		/karen/i,
		/victoria/i,
		/allison/i,
		/zira/i,
		/aria/i,
		/jenny/i
	];

	// Prefer LOCAL en-US > local en-* > any en-US > any en-* — friendlier names first.
	const tiers = [
		usEnglish.filter((v) => v.localService),
		english.filter((v) => v.localService),
		usEnglish,
		english
	];
	for (const tier of tiers) {
		if (!tier.length) continue;
		for (const re of friendlyNames) {
			const m = tier.find((v) => re.test(v.name));
			if (m) return m;
		}
		return tier[0];
	}
	return voices[0] ?? null;
}

interface SpeakOptions {
	rate?: number;
	pitch?: number;
	/** If true, queue this utterance. By default we also queue (don't cancel). */
	interrupt?: boolean;
}

/** Speak text. MUST be called from a user-gesture handler the first time. */
export function speak(text: string, opts: SpeakOptions = {}): void {
	if (!isSupported()) {
		if (!warnedSupport) {
			warnedSupport = true;
			console.warn('[tots typing] speechSynthesis not available in this browser');
		}
		return;
	}
	if (!audioEnabled()) {
		if (!warnedDisabled) {
			warnedDisabled = true;
			console.warn(
				'[tots typing] audio disabled in localStorage. Clear `tots.typing.audio.v1` or click the SAY button to re-enable.'
			);
		}
		return;
	}
	if (!text) return;
	try {
		const synth = window.speechSynthesis;
		// Chrome occasionally pauses the queue (esp. after long idle); resume is harmless.
		synth.resume();
		if (opts.interrupt) synth.cancel();

		const voices = synth.getVoices();
		if (!voices.length && !warnedNoVoices) {
			warnedNoVoices = true;
			console.warn(
				'[tots typing] no synthesis voices available yet — speech may be silent until the OS finishes loading them.'
			);
		}

		const u = new SpeechSynthesisUtterance(text);
		// Default to US English so engines without an active voice still know
		// what language to look up.
		u.lang = 'en-US';
		u.rate = opts.rate ?? 0.95;
		u.pitch = opts.pitch ?? 1.15;
		u.volume = 1;
		const voice = pickVoice();
		if (voice) u.voice = voice;
		u.onerror = (ev: SpeechSynthesisErrorEvent) => {
			// synthesis-failed is a Chrome quirk. Retry once without the picked
			// voice — the OS default sometimes succeeds when a specific voice
			// can't synthesize.
			if (ev.error === 'synthesis-failed' && voice) {
				const retry = new SpeechSynthesisUtterance(text);
				retry.lang = 'en-US';
				retry.rate = opts.rate ?? 0.95;
				retry.pitch = opts.pitch ?? 1.15;
				retry.volume = 1;
				retry.onerror = (e: SpeechSynthesisErrorEvent) =>
					console.warn('[tots typing] retry also failed', e.error);
				try {
					synth.speak(retry);
				} catch {
					// noop
				}
			} else {
				console.warn('[tots typing] speech error', ev.error, ev);
			}
		};
		synth.speak(u);
	} catch (e) {
		console.error('[tots typing] speak() threw', e);
	}
}

/** Stop any queued or in-flight speech (e.g. when leaving a lesson). */
export function cancelSpeech(): void {
	if (!isSupported()) return;
	try {
		window.speechSynthesis.cancel();
	} catch {
		// noop
	}
}

/** No-op marker kept so callers don't break; speech unlocks itself via speak(). */
export function unlockSpeech(): void {
	if (!isSupported()) return;
	try {
		window.speechSynthesis.resume();
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
	// Interrupt previous letter so rapid typing doesn't queue up stale speech.
	speak(phrase, { rate: 0.9, pitch: 1.2, interrupt: true });
}
