<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { format } from '$lib/adventure/types';
	import type { Character, Scene, Story } from '$lib/adventure/types';
	import { cancel, isSpeechSupported, playing, speakBeats } from '$lib/adventure/speech';

	export let story: Story;
	export let character: Character;
	export let onExit: () => void;
	export let onHome: () => void;

	let currentId = story.startId;
	let returnFromRestId: string | null = null;
	let speechSupported = false;

	$: scene = story.scenes[currentId] as Scene;
	$: isRest = scene.kind === 'rest';
	$: isEnding = scene.kind === 'ending';
	$: beats = composeBeats(scene, character);

	function composeBeats(s: Scene, c: Character): string[] {
		const out = s.narration.map((t) => format(t, c));
		if (s.feelingNote) out.push(format(s.feelingNote, c));
		const flavor = s.flavor?.[c.id];
		if (flavor) out.push(format(flavor, c));
		return out;
	}

	function go(nextId: string) {
		cancel();
		if (nextId === story.restId) {
			returnFromRestId = currentId;
		}
		currentId = nextId;
	}

	function leaveRest() {
		cancel();
		currentId = returnFromRestId ?? story.startId;
		returnFromRestId = null;
	}

	function exitHome() {
		cancel();
		onHome();
	}

	function play() {
		if ($playing) {
			cancel();
		} else {
			void speakBeats(beats);
		}
	}

	onMount(() => {
		speechSupported = isSpeechSupported();
	});

	onDestroy(() => cancel());
</script>

<article class="scene" style="--accent: {character.accent};">
	<button class="exit" type="button" on:click={exitHome} aria-label="Exit to arcade home">
		<span aria-hidden="true">✕</span> EXIT
	</button>

	<header class="art" aria-hidden="true">
		{#if scene.art.background}
			<div class="bg">{scene.art.background}</div>
		{/if}
		<div class="emoji">{scene.art.emoji}</div>
	</header>

	<div class="narration">
		{#each scene.narration as line, i (`n${i}`)}
			<p>{format(line, character)}</p>
		{/each}
		{#if scene.feelingNote}
			<p class="feeling">{format(scene.feelingNote, character)}</p>
		{/if}
		{#if scene.flavor?.[character.id]}
			<p class="flavor">{format(scene.flavor[character.id] ?? '', character)}</p>
		{/if}
	</div>

	<div class="controls">
		{#if speechSupported}
			<button class="play" type="button" on:click={play}>
				{$playing ? '⏹ STOP READING' : '▶ READ TO ME'}
			</button>
		{/if}
	</div>

	<ul class="choices">
		{#if isRest}
			<li>
				<button class="choice" type="button" on:click={leaveRest}>
					← I'm ready to keep going
				</button>
			</li>
			<li>
				<button class="choice quiet" type="button" on:click={onExit}>
					🏠 All done for tonight
				</button>
			</li>
		{:else}
			{#each scene.choices as choice (choice.label)}
				<li>
					<button class="choice" type="button" on:click={() => go(choice.nextId)}>
						{choice.label}
					</button>
				</li>
			{/each}
			{#if isEnding}
				<li>
					<button class="choice quiet" type="button" on:click={onExit}>
						🏠 All done
					</button>
				</li>
			{:else}
				<li>
					<button class="choice quiet" type="button" on:click={() => go(story.restId)}>
						🫂 take a quiet moment
					</button>
				</li>
			{/if}
		{/if}
	</ul>
</article>

<style>
	.scene {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto auto;
		gap: 1rem;
		padding: 1rem;
		max-width: 720px;
		width: 100%;
		margin: 0 auto;
		overflow: hidden;
	}

	.exit {
		justify-self: end;
		background: transparent;
		border: 2px solid var(--rp-muted);
		color: var(--rp-subtle);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.6rem;
		letter-spacing: 0.2em;
		padding: 0.4rem 0.8rem;
		cursor: pointer;
	}

	.exit:hover,
	.exit:focus-visible {
		color: var(--rp-text);
		border-color: var(--rp-text);
		outline: none;
	}

	.art {
		position: relative;
		background: var(--rp-surface);
		border: 3px solid var(--accent);
		border-radius: 4px;
		padding: 1.25rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 14px var(--accent);
		overflow: hidden;
	}

	.bg {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3.5rem;
		opacity: 0.18;
		filter: blur(0.5px);
		letter-spacing: 0.5rem;
		user-select: none;
	}

	.emoji {
		position: relative;
		font-size: 4.5rem;
		line-height: 1;
		text-shadow:
			0 0 14px var(--accent),
			0 0 28px var(--accent);
	}

	.narration {
		font-family: 'VT323', monospace;
		font-size: 1.35rem;
		line-height: 1.4;
		color: var(--rp-text);
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0 0.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.narration p {
		margin: 0;
	}

	.narration .feeling {
		color: var(--rp-rose);
		font-style: italic;
	}

	.narration .flavor {
		color: var(--accent);
	}

	.controls {
		display: flex;
		justify-content: center;
	}

	.play {
		background: var(--rp-surface);
		border: 2px solid var(--rp-gold);
		border-radius: 4px;
		color: var(--rp-gold);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		padding: 0.6rem 1.2rem;
		cursor: pointer;
		text-shadow: 0 0 4px var(--rp-gold);
		box-shadow: 0 0 10px rgba(246, 193, 119, 0.4);
	}

	.play:hover,
	.play:focus-visible {
		background: var(--rp-overlay);
		box-shadow: 0 0 18px var(--rp-gold);
		outline: none;
	}

	.choices {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.choice {
		width: 100%;
		background: var(--rp-surface);
		border: 2px solid var(--accent);
		border-radius: 4px;
		color: var(--rp-text);
		font-family: 'VT323', monospace;
		font-size: 1.2rem;
		padding: 0.7rem 1rem;
		cursor: pointer;
		text-align: left;
		line-height: 1.3;
		transition: transform 0.1s steps(2), box-shadow 0.15s ease;
	}

	.choice:hover,
	.choice:focus-visible {
		transform: translate(-1px, -2px);
		box-shadow: 0 0 12px var(--accent);
		outline: none;
	}

	.choice.quiet {
		border-color: var(--rp-muted);
		color: var(--rp-subtle);
		font-size: 1.05rem;
	}

	.choice.quiet:hover,
	.choice.quiet:focus-visible {
		color: var(--rp-text);
		border-color: var(--rp-subtle);
		box-shadow: 0 0 8px var(--rp-subtle);
	}

	@media (max-width: 540px) {
		.scene {
			gap: 0.5rem;
			padding: 0.5rem;
		}
		.exit {
			font-size: 0.55rem;
			padding: 0.3rem 0.6rem;
		}
		.art {
			min-height: 80px;
			padding: 0.6rem;
		}
		.emoji {
			font-size: 3rem;
		}
		.bg {
			font-size: 2.25rem;
			letter-spacing: 0.25rem;
		}
		.narration {
			font-size: 1.15rem;
			line-height: 1.35;
			gap: 0.45rem;
		}
		.play {
			padding: 0.45rem 0.9rem;
			font-size: 0.6rem;
		}
		.choices {
			gap: 0.4rem;
		}
		.choice {
			padding: 0.55rem 0.75rem;
			font-size: 1.05rem;
		}
		.choice.quiet {
			font-size: 0.9rem;
			padding: 0.45rem 0.75rem;
		}
	}
</style>
