<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import KeyboardDisplay from './KeyboardDisplay.svelte';
	import HandsDisplay from './HandsDisplay.svelte';
	import { keyFor } from './fingerMap';
	import { assocFor } from './letterAssoc';
	import { audioEnabled, setAudioEnabled, speak, speakChar, unlockSpeech } from './speech';
	import type { Finger } from './types';

	const dispatch = createEventDispatcher<{ exit: void }>();

	let currentChar: string | null = null;
	let currentFinger: Finger | null = null;
	let lastPressed: { char: string; correct: boolean; nonce: number } | null = null;
	let audioOn = true;
	let bigKeyNonce = 0;

	$: assoc = currentChar ? assocFor(currentChar) : undefined;

	function toggleAudio() {
		audioOn = !audioOn;
		setAudioEnabled(audioOn);
		if (audioOn) {
			unlockSpeech();
			speak('Sound on!');
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			dispatch('exit');
			return;
		}
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		let pressed: string;
		if (e.key === ' ' || e.key === 'Spacebar') pressed = ' ';
		else if (e.key.length === 1) pressed = e.key.toLowerCase();
		else return;

		const def = keyFor(pressed);
		if (!def) return;

		e.preventDefault();
		unlockSpeech();
		currentChar = pressed;
		currentFinger = def.finger;
		lastPressed = { char: pressed, correct: true, nonce: (lastPressed?.nonce ?? 0) + 1 };
		bigKeyNonce++;

		// Speak the letter, then (for letters) speak the associated word.
		speakChar(pressed);
		const a = assocFor(pressed);
		if (a) {
			window.setTimeout(() => speak(a.word, { rate: 0.9, pitch: 1.15 }), 350);
		}
	}

	onMount(() => {
		audioOn = audioEnabled();
		window.addEventListener('keydown', handleKey);
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKey);
	});
</script>

<div class="play">
	<header class="bar">
		<button class="back" on:click={() => dispatch('exit')} aria-label="Back to picker"
			>◄ EXIT</button
		>
		<h2 class="title"><span class="emoji">🎹</span> TAP ANY KEY</h2>
		<button
			class="audio"
			class:off={!audioOn}
			on:click={toggleAudio}
			aria-label={audioOn ? 'Turn sound off' : 'Turn sound on'}
		>
			<span class="audio-icon">{audioOn ? '🔊' : '🔇'}</span>
			<span class="audio-label">{audioOn ? 'ON' : 'OFF'}</span>
		</button>
	</header>

	<div class="stage">
		{#if currentChar && currentFinger}
			{#key bigKeyNonce}
				<div class="bigkey" style="--c: {currentFinger.color};">
					<span class="big-letter">{currentChar === ' ' ? '␣' : currentChar.toUpperCase()}</span>
					{#if assoc}
						<div class="assoc">
							<span class="assoc-emoji">{assoc.emoji}</span>
							<span class="assoc-word">{assoc.word}</span>
						</div>
					{/if}
				</div>
			{/key}
		{:else}
			<div class="welcome">
				<div class="hello-emoji">👋</div>
				<p class="hello">Press any key!</p>
			</div>
		{/if}
	</div>

	<div class="visuals">
		<KeyboardDisplay targetChar={null} {lastPressed} focusTarget={false} />
		<HandsDisplay activeFingerId={currentFinger?.id ?? null} />
	</div>
</div>

<style>
	.play {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-height: 0;
		padding: 0.25rem 0.5rem 0.5rem;
	}

	.bar {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.4rem 0.6rem;
		background: var(--rp-surface);
		border: 2px solid var(--rp-hl-med);
		border-radius: 4px;
	}

	.back,
	.audio {
		background: transparent;
		border: 2px solid currentColor;
		color: var(--rp-love);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.15em;
		padding: 0.35rem 0.55rem;
		border-radius: 3px;
		cursor: pointer;
		text-shadow: 0 0 4px currentColor;
	}

	.audio {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		background: var(--rp-foam);
		border-color: var(--rp-foam);
		color: var(--rp-base);
		font-size: 0.55rem;
		padding: 0.35rem 0.5rem;
		text-shadow: none;
		box-shadow: 0 0 8px var(--rp-foam);
	}
	.audio-icon {
		font-size: 0.9rem;
	}
	.audio.off {
		background: transparent;
		color: var(--rp-muted);
		border-color: var(--rp-muted);
		box-shadow: none;
	}
	.back:hover,
	.audio:hover {
		box-shadow: 0 0 8px currentColor;
	}

	.title {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.95rem;
		letter-spacing: 0.2em;
		color: var(--rp-text);
		text-shadow: 0 0 6px var(--rp-iris);
		margin: 0;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.title .emoji {
		filter: drop-shadow(0 0 6px var(--rp-iris));
	}

	.stage {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 9rem;
		padding: 0.5rem;
		background: var(--rp-overlay);
		border: 2px solid var(--rp-hl-med);
		border-radius: 4px;
	}

	.bigkey {
		--c: var(--rp-iris);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		animation: pop-in 0.45s ease-out;
	}

	@keyframes pop-in {
		0% {
			transform: scale(0.4) rotate(-6deg);
			opacity: 0;
		}
		60% {
			transform: scale(1.15) rotate(3deg);
			opacity: 1;
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}

	.big-letter {
		font-family: 'Press Start 2P', cursive;
		font-size: 5rem;
		color: var(--c);
		text-shadow: 0 0 16px var(--c), 0 0 32px var(--c), 4px 4px 0 var(--rp-hl-low);
		line-height: 1;
	}

	.assoc {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.assoc-emoji {
		font-size: 3rem;
		filter: drop-shadow(0 0 8px var(--c));
	}

	.assoc-word {
		font-family: 'Schoolbell', cursive;
		font-size: 2rem;
		color: var(--rp-text);
		text-shadow: 0 0 6px var(--c);
		text-transform: lowercase;
	}

	.welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.hello-emoji {
		font-size: 4rem;
		animation: wave 2.4s ease-in-out infinite;
		transform-origin: 70% 70%;
	}

	@keyframes wave {
		0%,
		60%,
		100% {
			transform: rotate(0deg);
		}
		10%,
		30%,
		50% {
			transform: rotate(20deg);
		}
		20%,
		40% {
			transform: rotate(-15deg);
		}
	}

	.hello {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.95rem;
		color: var(--rp-gold);
		text-shadow: 0 0 8px var(--rp-gold);
		letter-spacing: 0.15em;
		margin: 0;
	}

	.visuals {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		flex: 1;
		min-height: 0;
		overflow: auto;
	}
</style>
