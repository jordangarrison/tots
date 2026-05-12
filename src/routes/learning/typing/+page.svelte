<script lang="ts">
	import { onMount } from 'svelte';
	import { LESSONS } from '$lib/typing/lessons';
	import { loadProgress } from '$lib/typing/save';
	import type { TypingSave, Lesson } from '$lib/typing/types';

	export const prerender = true;

	const tierLabels: Record<Lesson['tier'], string> = {
		home: 'HOME ROW',
		top: 'TOP ROW',
		bottom: 'BOTTOM ROW',
		space: 'SPACE',
		words: 'WORDS'
	};

	const tierAccents: Record<Lesson['tier'], string> = {
		home: 'var(--rp-foam)',
		top: 'var(--rp-iris)',
		bottom: 'var(--rp-rose)',
		space: 'var(--rp-gold)',
		words: 'var(--rp-love)'
	};

	const tierOrder: Lesson['tier'][] = ['home', 'top', 'bottom', 'space', 'words'];

	$: groups = tierOrder
		.map((tier) => ({
			tier,
			label: tierLabels[tier],
			accent: tierAccents[tier],
			items: LESSONS.filter((l) => l.tier === tier)
		}))
		.filter((g) => g.items.length > 0);

	let save: TypingSave = { version: 1, completed: {} };
	onMount(() => {
		save = loadProgress();
	});

	function starsFor(id: string): number {
		return save.completed[id]?.stars ?? 0;
	}
</script>

<svelte:head>
	<title>Typing — TOTS Arcade</title>
</svelte:head>

<div class="picker">
	<div class="head">
		<a class="back-link" href="/" aria-label="Back to arcade">◄</a>
		<h2 class="prompt">
			<span class="prompt-bracket">►</span>
			TYPING
			<span class="prompt-cursor">_</span>
		</h2>
		<span class="spacer" aria-hidden="true" />
	</div>

	<a class="play-card" href="/learning/typing/play">
		<span class="play-emoji">🎹</span>
		<span class="play-title">TAP ANY KEY</span>
		<span class="play-sub">Press a key, hear the letter!</span>
	</a>

	{#each groups as group (group.tier)}
		<section class="category" style="--accent: {group.accent};">
			<h3 class="category-title">
				<span class="rule" />
				<span class="label">{group.label}</span>
				<span class="rule" />
			</h3>
			<ul class="card-grid">
				{#each group.items as l (l.id)}
					<li>
						<a class="card" href={`/learning/typing/${l.id}`}>
							<span class="emoji" aria-hidden="true">{l.emoji}</span>
							<span class="title">{l.title.toUpperCase()}</span>
							<span class="stars" aria-label="{starsFor(l.id)} stars earned">
								{#each [0, 1, 2] as i (i)}
									<span class="star" class:lit={i < starsFor(l.id)}>★</span>
								{/each}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.picker {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.1rem;
		padding: 1rem;
		overflow: auto;
	}

	.head {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		width: 100%;
		max-width: 1024px;
	}

	.back-link {
		justify-self: start;
		text-decoration: none;
		color: var(--rp-love);
		border: 2px solid var(--rp-love);
		padding: 0.4rem 0.6rem;
		border-radius: 3px;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.8rem;
		text-shadow: 0 0 4px var(--rp-love);
	}
	.back-link:hover {
		box-shadow: 0 0 8px var(--rp-love);
	}

	.spacer {
		width: 2.5rem;
	}

	.prompt {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.2rem;
		color: var(--rp-text);
		text-shadow: 0 0 10px var(--rp-iris), 0 0 20px rgba(196, 167, 231, 0.6);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		letter-spacing: 0.15em;
		justify-self: center;
	}

	.prompt-bracket {
		color: var(--rp-gold);
		text-shadow: 0 0 8px var(--rp-gold);
	}
	.prompt-cursor {
		color: var(--rp-foam);
		animation: blink 1s steps(2, start) infinite;
	}

	@keyframes blink {
		to {
			visibility: hidden;
		}
	}

	.play-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		text-decoration: none;
		padding: 1rem 1.5rem;
		background: var(--rp-surface);
		border: 3px solid var(--rp-gold);
		border-radius: 6px;
		color: var(--rp-text);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 18px var(--rp-gold),
			inset 0 0 24px rgba(246, 193, 119, 0.1);
		transition: transform 0.15s steps(3), box-shadow 0.15s ease;
		max-width: 480px;
		width: 100%;
	}

	.play-card:hover,
	.play-card:focus-visible {
		transform: translate(-2px, -4px);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 28px var(--rp-gold), 0 0 50px var(--rp-gold);
		outline: none;
	}

	.play-emoji {
		font-size: 3.4rem;
		filter: drop-shadow(0 0 10px var(--rp-gold));
	}

	.play-title {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.1rem;
		color: var(--rp-gold);
		text-shadow: 0 0 8px var(--rp-gold);
		letter-spacing: 0.2em;
	}

	.play-sub {
		font-family: 'Schoolbell', cursive;
		font-size: 1.2rem;
		color: var(--rp-subtle);
	}

	.category {
		width: 100%;
		max-width: 1024px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.category-title {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.75rem;
		color: var(--accent);
		text-shadow: 0 0 6px var(--accent);
		margin: 0;
		letter-spacing: 0.25em;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		justify-content: center;
	}

	.category-title .rule {
		flex: 1;
		max-width: 140px;
		height: 2px;
		background: var(--accent);
		box-shadow: 0 0 6px var(--accent);
		opacity: 0.7;
	}

	.card-grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 170px));
		gap: 0.85rem;
		padding: 0;
		margin: 0;
		justify-content: center;
		width: 100%;
	}

	.card {
		background: var(--rp-surface);
		border: 3px solid var(--accent);
		border-radius: 4px;
		padding: 0.75rem 0.6rem 0.8rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.45rem;
		text-align: center;
		text-decoration: none;
		color: var(--rp-text);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 10px var(--accent);
		transition: transform 0.15s steps(3), box-shadow 0.15s ease;
		min-height: 150px;
		justify-content: space-between;
	}

	.card:hover,
	.card:focus-visible {
		transform: translate(-2px, -4px);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 18px var(--accent), 0 0 36px var(--accent);
		outline: none;
	}

	.emoji {
		font-size: 2.4rem;
		line-height: 1;
		color: var(--accent);
		text-shadow: 0 0 10px var(--accent);
	}

	.title {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		color: var(--rp-text);
		text-shadow: 2px 2px 0 var(--rp-hl-low);
	}

	.stars {
		display: flex;
		gap: 0.2rem;
		font-size: 1rem;
	}

	.star {
		color: var(--rp-hl-med);
	}
	.star.lit {
		color: var(--rp-gold);
		text-shadow: 0 0 6px var(--rp-gold);
	}
</style>
