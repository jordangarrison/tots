<script lang="ts">
	export const prerender = true;

	type Category = 'activities' | 'games' | 'learning';

	interface PickerItem {
		id: string;
		title: string;
		description: string;
		emoji: string;
		href: string;
		accent: string;
		category: Category;
	}

	const categoryLabels: Record<Category, string> = {
		activities: 'CREATIVE',
		games: 'GAMES',
		learning: 'LEARNING'
	};

	const categoryAccents: Record<Category, string> = {
		activities: 'var(--rp-iris)',
		games: 'var(--rp-love)',
		learning: 'var(--rp-foam)'
	};

	const categoryOrder: Category[] = ['activities', 'games', 'learning'];

	const items: PickerItem[] = [
		{
			id: 'draw',
			title: 'DRAW',
			description: 'Press keys, click around, make pixel chaos.',
			emoji: '✦',
			href: '/activities/draw',
			accent: 'var(--rp-iris)',
			category: 'activities'
		},
		{
			id: 'coloring',
			title: 'COLOR',
			description: 'Pick a page or upload your own. Stay in the lines (or don’t).',
			emoji: '🎨',
			href: '/activities/coloring',
			accent: 'var(--rp-foam)',
			category: 'activities'
		},
		{
			id: 'cards',
			title: 'CARDS',
			description: 'Make a birthday, holiday, or thank-you card for someone you love.',
			emoji: '💌',
			href: '/activities/cards',
			accent: 'var(--rp-rose)',
			category: 'activities'
		},
		{
			id: 'adventure',
			title: 'ADVENTURE',
			description: 'Choose your hero. Walk a kind path.',
			emoji: '🏰',
			href: '/games/adventure',
			accent: 'var(--rp-love)',
			category: 'games'
		},
		{
			id: 'kingdom',
			title: 'KINGDOM',
			description: "Jane, Isla, and Ollie's cozy little kingdom. Plant roses. Say hi.",
			emoji: '🌷',
			href: '/games/kingdom',
			accent: 'var(--rp-foam)',
			category: 'games'
		}
	];

	$: groupedItems = categoryOrder
		.map((category) => ({
			category,
			label: categoryLabels[category],
			accent: categoryAccents[category],
			items: items.filter((item) => item.category === category)
		}))
		.filter((group) => group.items.length > 0);
</script>

<div class="picker">
	<h2 class="prompt">
		<span class="prompt-bracket">►</span>
		SELECT GAME
		<span class="prompt-cursor">_</span>
	</h2>
	{#each groupedItems as group (group.category)}
		<section class="category" style="--accent: {group.accent};">
			<h3 class="category-title">
				<span class="rule" />
				<span class="label">{group.label}</span>
				<span class="rule" />
			</h3>
			<ul class="card-grid">
				{#each group.items as item (item.id)}
					<li>
						<a class="card" href={item.href} style="--accent: {item.accent};">
							<span class="card-top">
								<span class="led" />
								<span class="coin">1 CREDIT</span>
								<span class="led" />
							</span>
							<span class="emoji" aria-hidden="true">{item.emoji}</span>
							<span class="title">{item.title}</span>
							<span class="description">{item.description}</span>
							<span class="press">▶ PRESS START</span>
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
		gap: 2rem;
		padding: 1.5rem 1rem;
		overflow: auto;
	}

	.prompt {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.4rem;
		color: var(--rp-text);
		text-shadow:
			0 0 10px var(--rp-iris),
			0 0 20px rgba(196, 167, 231, 0.6);
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
		to { visibility: hidden; }
	}

	.category {
		width: 100%;
		max-width: 1024px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}

	.category-title {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.9rem;
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
		grid-template-columns: repeat(auto-fit, minmax(240px, 280px));
		gap: 1.5rem;
		padding: 0;
		margin: 0;
		justify-content: center;
		width: 100%;
	}

	.card {
		background: var(--rp-surface);
		border: 3px solid var(--accent);
		border-radius: 4px;
		padding: 1rem 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		text-align: center;
		text-decoration: none;
		color: var(--rp-text);
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 14px var(--accent),
			inset 0 0 24px rgba(255, 255, 255, 0.03);
		transition: transform 0.15s steps(3), box-shadow 0.15s ease;
		min-height: 260px;
		justify-content: space-between;
		position: relative;
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

	.coin {
		color: var(--rp-gold);
		text-shadow: 0 0 4px var(--rp-gold);
	}

	.emoji {
		font-size: 4rem;
		line-height: 1;
		color: var(--accent);
		text-shadow:
			0 0 12px var(--accent),
			0 0 24px var(--accent);
	}

	.title {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.4rem;
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
</style>
