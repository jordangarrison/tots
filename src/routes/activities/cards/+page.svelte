<script lang="ts">
	import { onMount } from 'svelte';
	import { cardTemplates } from '$lib/cards/templates';
	import { occasionOrder, occasionLabels, type Occasion } from '$lib/cards/types';
	import { recordPlay } from '$lib/arcade/scores';

	export const prerender = true;

	onMount(() => recordPlay('cards'));

	const groups = occasionOrder
		.map((occasion) => ({
			occasion,
			label: occasionLabels[occasion],
			items: cardTemplates.filter((t) => t.occasion === occasion)
		}))
		.filter((g) => g.items.length > 0);

	const occasionAccents: Record<Occasion, string> = {
		birthday: 'var(--rp-gold)',
		'mothers-day': 'var(--rp-rose)',
		'fathers-day': 'var(--rp-foam)',
		valentine: 'var(--rp-love)',
		'thank-you': 'var(--rp-iris)',
		christmas: 'var(--rp-pine)',
		blank: 'var(--rp-subtle)'
	};
</script>

<div class="picker">
	<div class="head">
		<a class="back-link" href="/" aria-label="Back to game picker">◄ EXIT</a>
		<h2 class="prompt">
			<span class="prompt-bracket">►</span>
			PICK A CARD
			<span class="prompt-cursor">_</span>
		</h2>
		<span class="spacer" aria-hidden="true" />
	</div>

	{#each groups as group (group.occasion)}
		<section class="category" style="--accent: {occasionAccents[group.occasion]};">
			<h3 class="category-title">
				<span class="rule" />
				<span class="label">{group.label}</span>
				<span class="rule" />
			</h3>
			<ul class="card-grid">
				{#each group.items as t (t.id)}
					<li>
						<a class="card" href={`/activities/cards/${t.id}`}>
							<span class="emoji" aria-hidden="true">{t.emoji}</span>
							<span class="title">{t.name.toUpperCase()}</span>
							<span class="press">▶ MAKE IT</span>
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
		gap: 1.5rem;
		padding: 1rem;
		overflow: auto;
	}

	.head {
		width: 100%;
		max-width: 1024px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.spacer {
		min-width: 60px;
	}

	.back-link {
		color: var(--rp-gold);
		text-decoration: none;
		text-shadow: 0 0 6px var(--rp-gold);
		padding: 0.3rem 0.55rem;
		border: 2px solid var(--rp-gold);
		border-radius: 3px;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.15em;
		transition: background 0.15s, color 0.15s;
	}

	.back-link:hover,
	.back-link:focus-visible {
		background: var(--rp-gold);
		color: var(--rp-base);
		text-shadow: none;
		outline: none;
	}

	.prompt {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.2rem;
		color: var(--rp-text);
		text-shadow: 0 0 10px var(--rp-iris), 0 0 20px rgba(196, 167, 231, 0.6);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		letter-spacing: 0.15em;
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

	.category {
		width: 100%;
		max-width: 1024px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.category-title {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.8rem;
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
		max-width: 160px;
		height: 2px;
		background: var(--accent);
		box-shadow: 0 0 6px var(--accent);
		opacity: 0.7;
	}

	.category-title .label {
		padding: 0 0.5rem;
	}

	.card-grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 220px));
		gap: 1.2rem;
		padding: 0;
		margin: 0;
		justify-content: center;
		width: 100%;
	}

	.card {
		background: var(--rp-surface);
		border: 3px solid var(--accent);
		border-radius: 4px;
		padding: 1rem 0.75rem 1.1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		text-decoration: none;
		color: var(--rp-text);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 12px var(--accent),
			inset 0 0 24px rgba(255, 255, 255, 0.03);
		transition: transform 0.15s steps(3), box-shadow 0.15s ease;
		min-height: 200px;
		justify-content: space-between;
	}

	.card:hover,
	.card:focus-visible {
		transform: translate(-2px, -4px);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 24px var(--accent), 0 0 48px var(--accent),
			inset 0 0 24px rgba(255, 255, 255, 0.06);
		outline: none;
	}

	.emoji {
		font-size: 3.5rem;
		line-height: 1;
		color: var(--accent);
		text-shadow: 0 0 12px var(--accent), 0 0 24px var(--accent);
	}

	.title {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.85rem;
		color: var(--rp-text);
		letter-spacing: 0.1em;
		text-shadow: 2px 2px 0 var(--rp-hl-low);
	}

	.press {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.5rem;
		color: var(--rp-gold);
		text-shadow: 0 0 4px var(--rp-gold);
		letter-spacing: 0.25em;
		animation: blink 1.2s steps(2, start) infinite;
	}
</style>
