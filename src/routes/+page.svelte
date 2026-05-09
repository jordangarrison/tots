<script lang="ts">
	export const prerender = true;

	type Category = 'activities' | 'games' | 'learning';

	interface PickerItem {
		id: string;
		title: string;
		description: string;
		emoji: string;
		href: string;
		gradient: string;
		category: Category;
	}

	const categoryLabels: Record<Category, string> = {
		activities: 'Creative',
		games: 'Games',
		learning: 'Learning'
	};

	const categoryOrder: Category[] = ['activities', 'games', 'learning'];

	const items: PickerItem[] = [
		{
			id: 'draw',
			title: 'Draw',
			description: 'Tap keys and click to make colorful shapes!',
			emoji: '🎨',
			href: '/activities/draw',
			gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #54a0ff 100%)',
			category: 'activities'
		}
	];

	$: groupedItems = categoryOrder
		.map((category) => ({
			category,
			label: categoryLabels[category],
			items: items.filter((item) => item.category === category)
		}))
		.filter((group) => group.items.length > 0);
</script>

<div class="picker">
	<h2 class="prompt">Pick something to play!</h2>
	{#each groupedItems as group (group.category)}
		<section class="category">
			<h3 class="category-title">{group.label}</h3>
			<ul class="card-grid">
				{#each group.items as item (item.id)}
					<li>
						<a class="card" href={item.href} style="--card-bg: {item.gradient};">
							<span class="emoji" aria-hidden="true">{item.emoji}</span>
							<span class="title">{item.title}</span>
							<span class="description">{item.description}</span>
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

	.prompt {
		font-family: 'Fredoka One', cursive;
		font-size: 2rem;
		color: #4a4a8a;
		text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.6);
		margin: 0;
	}

	.category {
		width: 100%;
		max-width: 960px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.category-title {
		font-family: 'Fredoka One', cursive;
		font-size: 1.4rem;
		color: #555;
		text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.6);
		margin: 0;
	}

	.card-grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 280px));
		gap: 1.5rem;
		padding: 0;
		margin: 0;
		justify-content: center;
		width: 100%;
	}

	.card {
		background: var(--card-bg);
		border-radius: 24px;
		padding: 1.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
		text-decoration: none;
		color: white;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		min-height: 220px;
		justify-content: center;
	}

	.card:hover,
	.card:focus-visible {
		transform: translateY(-6px) rotate(-1deg);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
		outline: none;
	}

	.emoji {
		font-size: 4rem;
		line-height: 1;
		filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
	}

	.title {
		font-family: 'Fredoka One', cursive;
		font-size: 1.75rem;
		text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
	}

	.description {
		font-family: 'Londrina Sketch', cursive, sans-serif;
		font-size: 1.1rem;
		opacity: 0.95;
	}
</style>
