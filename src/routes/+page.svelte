<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { records, formatScore, type GameId } from '$lib/arcade/scores';
	import { sfxCoin, sfxMove, sfxStart } from '$lib/arcade/sounds';

	export const prerender = true;

	type Category = 'activities' | 'games' | 'learning';

	interface PickerItem {
		id: GameId;
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
		},
		{
			id: 'digdug',
			title: 'DIG DUG',
			description: 'Tunnel underground. Pump up pookas. Drop rocks on dragons.',
			emoji: '⛏️',
			href: '/games/digdug',
			accent: 'var(--rp-gold)',
			category: 'games'
		},
		{
			id: 'typing',
			title: 'TYPING',
			description: 'Tap a key. Hear the letter. Friendly fingers.',
			emoji: '⌨️',
			href: '/learning/typing',
			accent: 'var(--rp-foam)',
			category: 'learning'
		},
		{
			id: 'molecules',
			title: 'MOLECULES',
			description: 'Drag atoms together. See what they build. Earn quests.',
			emoji: '🧪',
			href: '/learning/molecules',
			accent: 'var(--rp-iris)',
			category: 'learning'
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

	// --- Joystick-style keyboard navigation -------------------------------
	// Cards live in category rows; left/right slides along the flat list and
	// up/down hops between categories, keeping the column where possible.
	let selectedIndex = -1;
	const cardEls: Array<HTMLAnchorElement | null> = [];

	$: flatGroups = groupedItems.map((g) => g.items);

	function flatIndexOf(groupIdx: number, itemIdx: number): number {
		let n = 0;
		for (let g = 0; g < groupIdx; g++) n += flatGroups[g].length;
		return n + itemIdx;
	}

	function positionOf(index: number): { group: number; item: number } {
		let rest = index;
		for (let g = 0; g < flatGroups.length; g++) {
			if (rest < flatGroups[g].length) return { group: g, item: rest };
			rest -= flatGroups[g].length;
		}
		return { group: 0, item: 0 };
	}

	function moveSelection(delta: { x: number; y: number }) {
		if (selectedIndex === -1) {
			selectedIndex = 0;
		} else if (delta.x !== 0) {
			selectedIndex = (selectedIndex + delta.x + items.length) % items.length;
		} else {
			const { group, item } = positionOf(selectedIndex);
			const nextGroup = (group + delta.y + flatGroups.length) % flatGroups.length;
			const nextItem = Math.min(item, flatGroups[nextGroup].length - 1);
			selectedIndex = flatIndexOf(nextGroup, nextItem);
		}
		sfxMove();
		const el = cardEls[selectedIndex];
		el?.focus({ preventScroll: true });
		el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	function onKeydown(e: KeyboardEvent) {
		if (inserting) return;
		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				moveSelection({ x: -1, y: 0 });
				break;
			case 'ArrowRight':
				e.preventDefault();
				moveSelection({ x: 1, y: 0 });
				break;
			case 'ArrowUp':
				e.preventDefault();
				moveSelection({ x: 0, y: -1 });
				break;
			case 'ArrowDown':
				e.preventDefault();
				moveSelection({ x: 0, y: 1 });
				break;
			case 'Enter':
			case ' ':
				if (selectedIndex >= 0) {
					e.preventDefault();
					launch(items[selectedIndex]);
				}
				break;
		}
	}

	// --- Coin-insert launch sequence --------------------------------------
	let inserting: PickerItem | null = null;
	let launchTimer: ReturnType<typeof setTimeout> | null = null;

	function launch(item: PickerItem) {
		if (inserting) return;
		inserting = item;
		sfxCoin();
		launchTimer = setTimeout(() => {
			sfxStart();
			launchTimer = setTimeout(() => void goto(item.href), 500);
		}, 350);
	}

	function onCardClick(e: MouseEvent, item: PickerItem) {
		// Let modified clicks (new tab, etc.) behave like normal links.
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
		e.preventDefault();
		launch(item);
	}

	onDestroy(() => {
		if (launchTimer) clearTimeout(launchTimer);
	});
</script>

<svelte:window on:keydown={onKeydown} />

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
					{@const flatIdx = items.indexOf(item)}
					{@const rec = $records[item.id]}
					<li>
						<a
							class="card"
							class:selected={selectedIndex === flatIdx}
							href={item.href}
							style="--accent: {item.accent};"
							bind:this={cardEls[flatIdx]}
							on:click={(e) => onCardClick(e, item)}
							on:focus={() => (selectedIndex = flatIdx)}
							on:mouseenter={() => (selectedIndex = flatIdx)}
						>
							<span class="card-top">
								<span class="led" />
								{#if rec?.highScore}
									<span class="coin hiscore">HI {formatScore(rec.highScore)}</span>
								{:else if rec && rec.plays > 0}
									<span class="coin plays">★ PLAYED ×{rec.plays}</span>
								{:else}
									<span class="coin">1 CREDIT</span>
								{/if}
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
	<p class="hint">USE ARROW KEYS + ENTER, OR TAP A CABINET</p>
</div>

{#if inserting}
	<div class="coin-overlay" style="--accent: {inserting.accent};">
		<div class="coin-box">
			<span class="coin-emoji">{inserting.emoji}</span>
			<span class="coin-title">{inserting.title}</span>
			<span class="coin-credit">🪙 CREDIT 1</span>
			<span class="coin-ready">GET READY!</span>
		</div>
	</div>
{/if}

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
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 14px var(--accent),
			inset 0 0 24px rgba(255, 255, 255, 0.03);
		transition: transform 0.15s steps(3), box-shadow 0.15s ease;
		min-height: 260px;
		justify-content: space-between;
		position: relative;
	}

	.card:hover,
	.card:focus-visible,
	.card.selected {
		transform: translate(-2px, -4px);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 24px var(--accent), 0 0 48px var(--accent),
			inset 0 0 24px rgba(255, 255, 255, 0.06);
		outline: none;
	}

	.card.selected::after {
		content: '►';
		position: absolute;
		left: -1.4rem;
		top: 50%;
		transform: translateY(-50%);
		font-family: 'Press Start 2P', cursive;
		font-size: 1rem;
		color: var(--rp-gold);
		text-shadow: 0 0 8px var(--rp-gold);
		animation: nudge 0.6s steps(2, start) infinite;
	}

	@keyframes nudge {
		50% {
			transform: translate(4px, -50%);
		}
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
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	.coin {
		color: var(--rp-gold);
		text-shadow: 0 0 4px var(--rp-gold);
	}

	.coin.plays {
		color: var(--rp-foam);
		text-shadow: 0 0 4px var(--rp-foam);
	}

	.emoji {
		font-size: 4rem;
		line-height: 1;
		color: var(--accent);
		text-shadow: 0 0 12px var(--accent), 0 0 24px var(--accent);
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

	.hint {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.5rem;
		color: var(--rp-muted);
		letter-spacing: 0.2em;
		margin: 0;
		text-align: center;
	}

	.coin-overlay {
		position: fixed;
		inset: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(25, 23, 36, 0.88);
		animation: overlay-in 0.15s ease-out;
	}

	@keyframes overlay-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.coin-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		padding: 2rem 2.6rem;
		background: var(--rp-surface);
		border: 4px solid var(--accent);
		box-shadow: 0 0 0 3px var(--rp-base), 0 0 30px var(--accent), 0 0 60px var(--accent);
		animation: box-pop 0.25s steps(4);
	}

	@keyframes box-pop {
		from {
			transform: scale(0.6);
		}
		to {
			transform: scale(1);
		}
	}

	.coin-emoji {
		font-size: 4.5rem;
		line-height: 1;
		filter: drop-shadow(0 0 14px var(--accent));
	}

	.coin-title {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.3rem;
		color: var(--rp-text);
		letter-spacing: 0.2em;
		text-shadow: 0 0 10px var(--accent);
	}

	.coin-credit {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		color: var(--rp-gold);
		letter-spacing: 0.2em;
		text-shadow: 0 0 6px var(--rp-gold);
	}

	.coin-ready {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.85rem;
		color: var(--rp-foam);
		letter-spacing: 0.25em;
		text-shadow: 0 0 8px var(--rp-foam);
		animation: blink 0.4s steps(2, start) infinite;
	}

	.hiscore {
		animation: shimmer 2s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
