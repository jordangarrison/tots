<script lang="ts">
	import { characters, characterOrder } from '$lib/adventure/characters';
	import type { CharacterId } from '$lib/adventure/types';

	export let onPick: (id: CharacterId) => void;
	export let onBack: () => void;
</script>

<div class="picker">
	<h2 class="prompt">
		<span class="prompt-bracket">►</span>
		WHO'S COMING ON THE ADVENTURE?
		<span class="prompt-cursor">_</span>
	</h2>

	<ul class="grid">
		{#each characterOrder as id (id)}
			{@const c = characters[id]}
			<li>
				<button class="card" type="button" on:click={() => onPick(id)} style="--accent: {c.accent};">
					<span class="card-top">
						<span class="led" />
						<span class="role">{c.title.toUpperCase()}</span>
						<span class="led" />
					</span>
					<span class="emoji" aria-hidden="true">{c.emoji}</span>
					<span class="name">{c.name}</span>
					{#if c.description}
						<span class="description">{c.description}</span>
					{/if}
					<span class="press">▶ CHOOSE ME</span>
				</button>
			</li>
		{/each}
	</ul>

	<button class="back" type="button" on:click={onBack}>← BACK</button>
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

	.prompt {
		font-family: 'Press Start 2P', cursive;
		font-size: 1rem;
		color: var(--rp-text);
		text-shadow:
			0 0 10px var(--rp-iris),
			0 0 20px rgba(196, 167, 231, 0.6);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		letter-spacing: 0.12em;
		text-align: center;
		flex-wrap: wrap;
		justify-content: center;
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
		to { visibility: hidden; }
	}

	.grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 260px));
		gap: 1.25rem;
		padding: 0;
		margin: 0;
		justify-content: center;
		width: 100%;
		max-width: 1024px;
	}

	li {
		display: flex;
	}

	.card {
		background: var(--rp-surface);
		border: 3px solid var(--accent);
		border-radius: 4px;
		padding: 1rem 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		color: var(--rp-text);
		font-family: inherit;
		cursor: pointer;
		width: 100%;
		min-height: 280px;
		justify-content: space-between;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 14px var(--accent),
			inset 0 0 24px rgba(255, 255, 255, 0.03);
		transition: transform 0.15s steps(3), box-shadow 0.15s ease;
	}

	.card:hover,
	.card:focus-visible {
		transform: translate(-2px, -4px);
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 24px var(--accent),
			0 0 48px var(--accent),
			inset 0 0 24px rgba(255, 255, 255, 0.06);
		outline: none;
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.5rem;
		color: var(--rp-muted);
		letter-spacing: 0.2em;
	}

	.role {
		color: var(--rp-gold);
		text-shadow: 0 0 4px var(--rp-gold);
	}

	.led {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 6px var(--accent);
		animation: pulse 1.6s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.35; }
	}

	.emoji {
		font-size: 4.5rem;
		line-height: 1;
		text-shadow:
			0 0 12px var(--accent),
			0 0 24px var(--accent);
	}

	.name {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.3rem;
		color: var(--rp-text);
		letter-spacing: 0.15em;
		text-shadow: 2px 2px 0 var(--rp-hl-low);
	}

	.description {
		font-family: 'VT323', monospace;
		font-size: 1.1rem;
		color: var(--rp-subtle);
		line-height: 1.2;
	}

	.press {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		color: var(--rp-gold);
		text-shadow: 0 0 4px var(--rp-gold);
		letter-spacing: 0.25em;
		animation: blink 1.2s steps(2, start) infinite;
	}

	.back {
		background: transparent;
		border: 2px solid var(--rp-muted);
		color: var(--rp-subtle);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.6rem;
		letter-spacing: 0.2em;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}

	.back:hover,
	.back:focus-visible {
		color: var(--rp-text);
		border-color: var(--rp-text);
		outline: none;
	}
</style>
