<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { characters } from '$lib/characters';
	import type { CharacterId } from '$lib/characters';
	import { sfxBlip } from '$lib/arcade/sounds';
	import { MAX_HEARTS } from '../types';
	import { drawSprite } from '../sprites';

	export let speakerId: CharacterId;
	export let hearts: number; // 0..5
	export let pages: string[];
	export let onDone: () => void;

	const TYPE_MS = 24;
	const PORTRAIT_PX = 36;

	let pageIndex = 0;
	let shown = 0; // characters of the current page revealed so far
	let typer: ReturnType<typeof setInterval> | null = null;

	let portraitEl: HTMLCanvasElement;
	let raf = 0;

	$: speaker = characters[speakerId];
	$: page = pages[pageIndex] ?? '';
	$: typing = shown < page.length;
	$: lastPage = pageIndex >= pages.length - 1;
	$: heartSlots = Array.from({ length: MAX_HEARTS }, (_, i) => i < Math.min(hearts, MAX_HEARTS));

	// A new conversation can start while the panel is already open — reset the
	// typewriter whenever the pages prop identity changes.
	let seenPages = pages;
	$: if (pages !== seenPages) {
		seenPages = pages;
		startConversation();
	}

	function stopTyping() {
		if (typer !== null) {
			clearInterval(typer);
			typer = null;
		}
	}

	function startPage() {
		stopTyping();
		if (typeof window === 'undefined') {
			shown = (pages[pageIndex] ?? '').length;
			return;
		}
		shown = 0;
		sfxBlip();
		typer = setInterval(() => {
			const len = (pages[pageIndex] ?? '').length;
			shown = Math.min(shown + 1, len);
			if (shown >= len) stopTyping();
		}, TYPE_MS);
	}

	function startConversation() {
		pageIndex = 0;
		startPage();
	}

	/**
	 * Parent forwards SPACE/Enter here. If typing: reveal the full page.
	 * Else: next page, or onDone() after the last.
	 */
	export function advance(): void {
		const len = (pages[pageIndex] ?? '').length;
		if (shown < len) {
			stopTyping();
			shown = len;
			return;
		}
		if (pageIndex < pages.length - 1) {
			pageIndex += 1;
			startPage();
		} else {
			onDone();
		}
	}

	onMount(() => {
		startConversation();
		const pctx = portraitEl.getContext('2d');
		if (pctx) pctx.imageSmoothingEnabled = false;
		const loop = () => {
			raf = requestAnimationFrame(loop);
			if (!pctx) return;
			pctx.clearRect(0, 0, PORTRAIT_PX, PORTRAIT_PX);
			drawSprite(pctx, speakerId, 0, 0, PORTRAIT_PX, 'down', {
				moving: false,
				walkT: 0,
				now: performance.now(),
				isPlayer: false
			});
		};
		raf = requestAnimationFrame(loop);
	});

	onDestroy(() => {
		stopTyping();
		if (typeof window !== 'undefined' && raf) cancelAnimationFrame(raf);
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions a11y-no-static-element-interactions -->
<div
	class="panel"
	style="--accent: {speaker.accent};"
	role="dialog"
	aria-label="Talking with {speaker.title} {speaker.name}"
	on:click={advance}
>
	<div class="portrait">
		<canvas bind:this={portraitEl} width={PORTRAIT_PX} height={PORTRAIT_PX} />
	</div>

	<div class="speech">
		<div class="header">
			<span class="who">{speaker.title} {speaker.name}</span>
			<span class="hearts" aria-label="Friendship: {hearts} of {MAX_HEARTS} hearts">
				{#each heartSlots as filled, i (i)}
					<span class="heart" class:filled>{filled ? '♥' : '♡'}</span>
				{/each}
			</span>
		</div>

		<p class="text">{page.slice(0, shown)}</p>

		<div class="more">
			{#if !typing}
				{#if lastPage}
					<span class="end">♥</span>
				{:else}
					<span class="next">▼</span>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.panel {
		position: absolute;
		left: 50%;
		bottom: 0.9rem;
		transform: translateX(-50%);
		width: min(640px, 94%);
		z-index: 6;
		display: flex;
		align-items: flex-start;
		gap: 0.8rem;
		padding: 0.7rem 0.85rem;
		background: var(--rp-surface);
		border: 3px solid var(--accent);
		border-radius: 6px;
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 18px var(--accent);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		animation: panel-rise 0.18s ease-out;
	}

	@keyframes panel-rise {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.portrait {
		flex: none;
		line-height: 0;
		background: var(--rp-base);
		border: 2px solid var(--accent);
		border-radius: 4px;
		box-shadow: 0 0 12px var(--accent);
	}

	.portrait canvas {
		display: block;
		width: 108px; /* 36px sprite upscaled 3x */
		height: 108px;
		image-rendering: pixelated;
	}

	.speech {
		flex: 1;
		min-width: 0;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.who {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.6rem;
		letter-spacing: 0.12em;
		color: var(--accent);
		text-shadow: 0 0 5px var(--accent);
		white-space: nowrap;
	}

	.hearts {
		font-size: 0.95rem;
		line-height: 1;
		letter-spacing: 0.1em;
		white-space: nowrap;
	}

	.heart {
		color: var(--rp-muted);
		opacity: 0.55;
	}

	.heart.filled {
		color: var(--rp-love);
		opacity: 1;
		text-shadow: 0 0 6px var(--rp-love);
	}

	.text {
		margin: 0.45rem 0 0;
		font-family: 'VT323', monospace;
		font-size: 1.25rem;
		line-height: 1.25;
		color: var(--rp-text);
		min-height: 2.6em; /* reserve ~2 lines so the panel never jumps */
		overflow-wrap: break-word;
	}

	.more {
		display: flex;
		justify-content: flex-end;
		height: 1.05rem;
	}

	.next {
		color: var(--accent);
		font-size: 0.8rem;
		line-height: 1;
		animation: more-bob 0.6s ease-in-out infinite alternate;
	}

	@keyframes more-bob {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(4px);
		}
	}

	.end {
		color: var(--rp-love);
		font-size: 0.85rem;
		line-height: 1;
		text-shadow: 0 0 6px var(--rp-love);
	}

	@media (max-width: 480px) {
		.portrait canvas {
			width: 72px; /* 2x on tiny screens so text keeps room */
			height: 72px;
		}
	}
</style>
