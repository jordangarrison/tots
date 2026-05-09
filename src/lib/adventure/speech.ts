import { writable } from 'svelte/store';

// Tracks whether speech is currently playing. Components subscribe with $playing.
export const playing = writable(false);

let cancelToken = 0;

export function isSpeechSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function cancel(): void {
	cancelToken++;
	playing.set(false);
	if (!isSpeechSupported()) return;
	window.speechSynthesis.cancel();
}

// Reads `beats` aloud, one after another, with a small breath between.
// Returns when finished or when cancelled. Safe to call again — cancels any
// previous run first.
export async function speakBeats(beats: string[]): Promise<void> {
	if (!isSpeechSupported() || beats.length === 0) return;
	cancel();
	const myToken = ++cancelToken;
	playing.set(true);
	for (const beat of beats) {
		if (myToken !== cancelToken) return;
		await speakOne(beat);
		if (myToken !== cancelToken) return;
		await wait(280);
	}
	if (myToken === cancelToken) playing.set(false);
}

function speakOne(text: string): Promise<void> {
	return new Promise((resolve) => {
		const u = new SpeechSynthesisUtterance(text);
		u.rate = 0.85;
		u.pitch = 1.05;
		u.volume = 1;
		u.onend = () => resolve();
		u.onerror = () => resolve();
		window.speechSynthesis.speak(u);
	});
}

function wait(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}
