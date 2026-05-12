<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import KeyboardDisplay from './KeyboardDisplay.svelte';
	import HandsDisplay from './HandsDisplay.svelte';
	import { fingerFor, needsShift, shiftFingerFor } from './fingerMap';
	import { recordResult } from './save';
	import { speak, speakChar, audioEnabled, setAudioEnabled, unlockSpeech } from './speech';
	import { assocFor } from './letterAssoc';
	import type { Lesson, LessonResult } from './types';

	export let lesson: Lesson;

	const dispatch = createEventDispatcher<{ done: LessonResult; exit: void }>();

	function buildTargets(l: Lesson): string {
		return l.drills
			.map((d) => (d.kind === 'words' ? d.content : d.content.replace(/\s+/g, '')))
			.join(' ');
	}

	$: targets = buildTargets(lesson);
	let cursor = 0;
	let mistakes = 0;
	let totalKeys = 0;
	let lastPressed: { char: string; correct: boolean; nonce: number } | null = null;
	let mistakeOnCurrent = false;
	let done = false;
	let result: LessonResult | null = null;
	let audioOn = true;
	let cheerNonce = 0;
	let cheer = '';
	let targetNonce = 0;
	let cursorEl: HTMLElement | null = null;

	$: currentChar = targets[cursor] ?? null;
	$: currentFinger = currentChar ? fingerFor(currentChar) : undefined;
	$: shiftFinger = currentChar && needsShift(currentChar) ? shiftFingerFor(currentChar) : undefined;
	$: assoc = currentChar ? assocFor(currentChar) : undefined;

	const cheers = ['Nice!', 'You got it!', 'Wow!', 'Great!', 'Yes!', 'Cool!', 'Wow wow wow!'];
	function celebrate() {
		cheer = cheers[Math.floor(Math.random() * cheers.length)];
		cheerNonce++;
		speak(cheer);
	}

	function handleKey(e: KeyboardEvent) {
		if (done) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			dispatch('exit');
			return;
		}
		// Allow Shift (modifier) to pass through — kid is composing a shifted char.
		// Block real browser shortcuts though.
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		const expected = currentChar;
		if (!expected) return;

		let pressed: string;
		if (e.key === ' ' || e.key === 'Spacebar') pressed = ' ';
		else if (e.key.length === 1) pressed = e.key;
		else return;

		e.preventDefault();
		unlockSpeech();

		// Shifted targets compare case-sensitively. Unshifted targets are
		// forgiving — accept caps lock / accidental shift too.
		const expectShifted = needsShift(expected);
		const pressedNorm = expectShifted ? pressed : pressed.toLowerCase();
		const expectedNorm = expectShifted ? expected : expected.toLowerCase();
		const correct = pressedNorm === expectedNorm;

		totalKeys++;
		lastPressed = {
			char: expectShifted ? pressed : pressedNorm,
			correct,
			nonce: (lastPressed?.nonce ?? 0) + 1
		};

		if (correct) {
			cursor++;
			mistakeOnCurrent = false;
			targetNonce++;
			if (cursor > 0 && cursor % 10 === 0) celebrate();
			if (cursor >= targets.length) {
				finishLesson();
			} else {
				// Speak the NEW target (we're inside a gesture, so this works).
				const nextChar = targets[cursor];
				if (nextChar) speakChar(nextChar);
			}
		} else {
			if (!mistakeOnCurrent) {
				mistakes++;
				mistakeOnCurrent = true;
			}
			// Re-speak the current target to help.
			speakChar(expected);
		}
	}

	function finishLesson() {
		const accuracy = totalKeys === 0 ? 1 : Math.max(0, (totalKeys - mistakes) / totalKeys);
		const stars: 1 | 2 | 3 = accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : 1;
		result = { lessonId: lesson.id, stars, accuracy, totalKeys, mistakes };
		recordResult(result);
		done = true;
		speak(`You got ${stars} star${stars === 1 ? '' : 's'}!`);
		dispatch('done', result);
	}

	function restart() {
		cursor = 0;
		mistakes = 0;
		totalKeys = 0;
		lastPressed = null;
		mistakeOnCurrent = false;
		done = false;
		result = null;
		cheer = '';
		targetNonce++;
	}

	function toggleAudio() {
		audioOn = !audioOn;
		setAudioEnabled(audioOn);
		if (audioOn) {
			unlockSpeech();
			if (currentChar) speakChar(currentChar);
		}
	}

	$: cursor, void scrollCursor();
	async function scrollCursor() {
		await tick();
		cursorEl?.scrollIntoView({ block: 'nearest', inline: 'center' });
	}

	onMount(() => {
		audioOn = audioEnabled();
		window.addEventListener('keydown', handleKey);
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKey);
	});

	// Display helpers
	function displayGlyph(c: string | null): string {
		if (c === null) return '';
		if (c === ' ') return '␣';
		return c;
	}
</script>

<div class="lesson">
	<header class="bar">
		<button class="back" on:click={() => dispatch('exit')} aria-label="Back to lesson picker"
			>◄</button
		>
		<div class="title-block">
			<span class="emoji">{lesson.emoji}</span>
			<span class="title">{lesson.title.toUpperCase()}</span>
		</div>
		<div class="bar-right">
			<div class="bar-track" aria-label="progress">
				<div
					class="bar-fill"
					style="width: {targets.length ? (cursor / targets.length) * 100 : 0}%"
				/>
			</div>
			<button
				class="audio"
				class:off={!audioOn}
				on:click={toggleAudio}
				aria-label={audioOn ? 'Turn sound off' : 'Turn sound on'}
			>
				{audioOn ? '🔊' : '🔇'}
			</button>
		</div>
	</header>

	{#if !done}
		<div class="stage">
			{#key targetNonce}
				{#if currentChar && currentFinger}
					<div class="bigkey" style="--c: {currentFinger.color};">
						{#if shiftFinger}
							<span class="shift-badge" style="--sc: {shiftFinger.color};">⇧</span>
							<span class="plus">+</span>
						{/if}
						<span class="big-letter">{displayGlyph(currentChar)}</span>
						{#if assoc && !needsShift(currentChar)}
							<span class="assoc" aria-hidden="true">
								<span class="assoc-emoji">{assoc.emoji}</span>
							</span>
						{/if}
					</div>
				{/if}
			{/key}

			<div class="text-row">
				{#each targets as ch, i (i)}
					{@const state = i < cursor ? 'done' : i === cursor ? 'now' : 'todo'}
					{#if state === 'now'}
						<span class="ch now" bind:this={cursorEl}>{ch === ' ' ? '␣' : ch}</span>
					{:else}
						<span class="ch {state}">{ch === ' ' ? '␣' : ch}</span>
					{/if}
				{/each}
			</div>

			{#key cheerNonce}
				{#if cheer}
					<div class="cheer" aria-live="polite">✨ {cheer} ✨</div>
				{/if}
			{/key}
		</div>

		<div class="visuals">
			<KeyboardDisplay targetChar={currentChar} {lastPressed} />
			<HandsDisplay
				activeFingerId={currentFinger?.id ?? null}
				secondaryFingerId={shiftFinger?.id ?? null}
			/>
		</div>
	{:else if result}
		<div class="finish">
			<div class="stars" aria-label="{result.stars} stars">
				{#each Array(3) as _, i (i)}
					<span class="star" class:lit={i < result.stars}>★</span>
				{/each}
			</div>
			<h3 class="finish-title">YAY!</h3>
			<div class="finish-actions">
				<button class="action" on:click={restart} aria-label="Try again">↻</button>
				<button
					class="action primary"
					on:click={() => dispatch('exit')}
					aria-label="Pick another lesson">►</button
				>
			</div>
		</div>
	{/if}
</div>

<style>
	.lesson {
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
		gap: 0.6rem;
		padding: 0.35rem 0.55rem;
		background: var(--rp-surface);
		border: 2px solid var(--rp-hl-med);
		border-radius: 4px;
	}

	.back {
		background: transparent;
		border: 2px solid var(--rp-love);
		color: var(--rp-love);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.75rem;
		padding: 0.35rem 0.55rem;
		border-radius: 3px;
		cursor: pointer;
		text-shadow: 0 0 4px var(--rp-love);
	}
	.back:hover {
		box-shadow: 0 0 8px var(--rp-love);
	}

	.title-block {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
	}
	.title-block .emoji {
		font-size: 1.3rem;
		filter: drop-shadow(0 0 6px var(--rp-iris));
	}
	.title-block .title {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.85rem;
		letter-spacing: 0.2em;
		color: var(--rp-text);
		text-shadow: 0 0 6px var(--rp-iris);
	}

	.bar-right {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	.bar-track {
		width: 100px;
		height: 8px;
		background: var(--rp-hl-low);
		border: 1px solid var(--rp-hl-med);
		border-radius: 3px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--rp-foam);
		box-shadow: 0 0 6px var(--rp-foam);
		transition: width 0.2s ease;
	}

	.audio {
		background: transparent;
		border: 2px solid var(--rp-foam);
		color: var(--rp-foam);
		font-size: 1.05rem;
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		cursor: pointer;
		text-shadow: 0 0 4px var(--rp-foam);
	}
	.audio.off {
		border-color: var(--rp-muted);
		color: var(--rp-muted);
		text-shadow: none;
	}
	.audio:hover {
		box-shadow: 0 0 8px currentColor;
	}

	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.55rem;
		padding: 0.6rem;
		background: var(--rp-overlay);
		border: 2px solid var(--rp-hl-med);
		border-radius: 4px;
	}

	.bigkey {
		--c: var(--rp-iris);
		display: flex;
		align-items: center;
		gap: 0.6rem;
		animation: pop-in 0.4s ease-out;
	}

	@keyframes pop-in {
		0% {
			transform: scale(0.5) rotate(-6deg);
			opacity: 0;
		}
		60% {
			transform: scale(1.1) rotate(2deg);
			opacity: 1;
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}

	.shift-badge {
		--sc: var(--rp-rose);
		font-family: 'Press Start 2P', cursive;
		font-size: 2.4rem;
		color: var(--sc);
		text-shadow: 0 0 10px var(--sc);
		line-height: 1;
		animation: shift-pulse 1s ease-in-out infinite;
	}

	@keyframes shift-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.08);
		}
	}

	.plus {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.6rem;
		color: var(--rp-subtle);
	}

	.big-letter {
		font-family: 'Press Start 2P', cursive;
		font-size: 4.4rem;
		color: var(--c);
		text-shadow: 0 0 14px var(--c), 0 0 28px var(--c), 4px 4px 0 var(--rp-hl-low);
		line-height: 1;
	}

	.assoc-emoji {
		font-size: 3rem;
		filter: drop-shadow(0 0 8px var(--c));
	}

	.text-row {
		font-family: 'VT323', monospace;
		font-size: 1.6rem;
		letter-spacing: 0.18em;
		line-height: 1.1;
		background: var(--rp-base);
		border: 2px solid var(--rp-hl-low);
		border-radius: 4px;
		padding: 0.5rem 0.7rem;
		max-width: 100%;
		overflow-x: auto;
		white-space: nowrap;
		scrollbar-width: none;
	}
	.text-row::-webkit-scrollbar {
		display: none;
	}

	.ch.done {
		color: var(--rp-subtle);
		opacity: 0.55;
	}
	.ch.todo {
		color: var(--rp-muted);
	}
	.ch.now {
		color: var(--rp-gold);
		background: rgba(246, 193, 119, 0.15);
		text-shadow: 0 0 6px var(--rp-gold);
		padding: 0 0.05em;
		border-bottom: 3px solid var(--rp-gold);
		animation: caret-flash 0.9s steps(2, end) infinite;
	}

	@keyframes caret-flash {
		50% {
			border-bottom-color: transparent;
		}
	}

	.cheer {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.85rem;
		color: var(--rp-foam);
		text-shadow: 0 0 8px var(--rp-foam);
		animation: cheer-pop 0.9s ease-out;
	}

	@keyframes cheer-pop {
		0% {
			transform: scale(0.6);
			opacity: 0;
		}
		40% {
			transform: scale(1.18);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
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

	.finish {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
		padding: 1.2rem;
		flex: 1;
		background: var(--rp-overlay);
		border: 3px solid var(--rp-gold);
		border-radius: 6px;
		box-shadow: 0 0 20px var(--rp-gold), inset 0 0 18px rgba(246, 193, 119, 0.15);
	}

	.stars {
		display: flex;
		gap: 0.6rem;
	}

	.star {
		font-size: 4rem;
		color: var(--rp-hl-med);
		filter: grayscale(1);
		transition: all 0.3s ease;
	}

	.star.lit {
		color: var(--rp-gold);
		filter: none;
		text-shadow: 0 0 14px var(--rp-gold), 0 0 28px var(--rp-gold);
		animation: star-pop 0.6s ease-out;
	}

	@keyframes star-pop {
		0% {
			transform: scale(0.2) rotate(-40deg);
		}
		55% {
			transform: scale(1.35) rotate(15deg);
		}
		100% {
			transform: scale(1) rotate(0);
		}
	}

	.finish-title {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.8rem;
		color: var(--rp-text);
		letter-spacing: 0.25em;
		text-shadow: 0 0 12px var(--rp-iris);
		margin: 0;
	}

	.finish-actions {
		display: flex;
		gap: 1.2rem;
	}

	.action {
		background: transparent;
		border: 3px solid var(--rp-iris);
		color: var(--rp-iris);
		font-family: 'Press Start 2P', cursive;
		font-size: 1.6rem;
		padding: 0.6rem 1.1rem;
		border-radius: 4px;
		cursor: pointer;
		text-shadow: 0 0 6px var(--rp-iris);
		min-width: 4rem;
	}

	.action.primary {
		border-color: var(--rp-gold);
		color: var(--rp-gold);
		text-shadow: 0 0 6px var(--rp-gold);
	}

	.action:hover {
		box-shadow: 0 0 12px currentColor;
	}
</style>
