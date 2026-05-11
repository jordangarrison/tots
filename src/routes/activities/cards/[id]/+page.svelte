<script lang="ts">
	import CreativeCanvas from '$lib/canvas/CreativeCanvas.svelte';
	import { printCardFold } from '$lib/print';
	import type { PageData } from './$types';

	export let data: PageData;
	$: template = data.template;

	type PageTab = 'front' | 'inside';
	let active: PageTab = 'front';

	let frontCanvas: CreativeCanvas;
	let insideCanvas: CreativeCanvas;

	let signature = '';

	let frontSlotValues: Record<string, string> = {};
	let insideSlotValues: Record<string, string> = {};

	const handleFrontSlot = (e: CustomEvent<{ id: string; value: string }>) => {
		frontSlotValues = { ...frontSlotValues, [e.detail.id]: e.detail.value };
	};

	const handleInsideSlot = (e: CustomEvent<{ id: string; value: string }>) => {
		insideSlotValues = { ...insideSlotValues, [e.detail.id]: e.detail.value };
	};

	const handlePrint = async () => {
		const front = await frontCanvas?.composite();
		const inside = await insideCanvas?.composite();
		if (!front || !inside) return;
		printCardFold(front, inside, signature, `${template.name} Card`);
	};
</script>

<div class="editor">
	<div class="head">
		<a class="back-link" href="/activities/cards" aria-label="Back to card picker">◄ CARDS</a>

		<div class="tabs" role="tablist">
			<button
				type="button"
				class="tab"
				class:active={active === 'front'}
				on:click={() => (active = 'front')}
				role="tab"
				aria-selected={active === 'front'}
			>
				FRONT
			</button>
			<button
				type="button"
				class="tab"
				class:active={active === 'inside'}
				on:click={() => (active = 'inside')}
				role="tab"
				aria-selected={active === 'inside'}
			>
				INSIDE
			</button>
		</div>

		<label class="signature">
			<span class="sig-label">YOUR NAME</span>
			<input
				type="text"
				bind:value={signature}
				placeholder="Lily"
				maxlength="24"
				aria-label="Your name (printed on the back cover)"
			/>
		</label>
	</div>

	<div class="page" class:hidden={active !== 'front'}>
		<CreativeCanvas
			bind:this={frontCanvas}
			width={template.front.width}
			height={template.front.height}
			templateSvg={template.front.svg}
			slots={template.front.slots}
			slotValues={frontSlotValues}
			showSave={false}
			printLabel="PRINT CARD"
			on:slotchange={handleFrontSlot}
			on:print={handlePrint}
		/>
	</div>

	<div class="page" class:hidden={active !== 'inside'}>
		<CreativeCanvas
			bind:this={insideCanvas}
			width={template.inside.width}
			height={template.inside.height}
			templateSvg={template.inside.svg}
			slots={template.inside.slots}
			slotValues={insideSlotValues}
			foldGuideX={template.inside.width / 2}
			showSave={false}
			printLabel="PRINT CARD"
			on:slotchange={handleInsideSlot}
			on:print={handlePrint}
		/>
	</div>
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		gap: 0.5rem;
	}

	.head {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding: 0.35rem 0.6rem;
		background: var(--rp-surface);
		border: 2px solid var(--rp-gold);
		border-radius: 4px;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 10px var(--rp-gold);
		flex-wrap: wrap;
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

	.tabs {
		display: flex;
		gap: 0.4rem;
		margin-left: 0.5rem;
	}

	.tab {
		background: var(--rp-base);
		border: 2px solid var(--rp-iris);
		color: var(--rp-iris);
		padding: 0.4rem 0.9rem;
		border-radius: 3px;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		cursor: pointer;
		transition: background 0.12s, color 0.12s, box-shadow 0.12s;
	}

	.tab:hover,
	.tab:focus-visible {
		outline: none;
		background: var(--rp-iris);
		color: var(--rp-base);
		box-shadow: 0 0 10px var(--rp-iris);
	}

	.tab.active {
		background: var(--rp-iris);
		color: var(--rp-base);
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 12px var(--rp-iris);
	}

	.signature {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-left: auto;
	}

	.sig-label {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.45rem;
		color: var(--rp-foam);
		letter-spacing: 0.15em;
		text-shadow: 0 0 5px var(--rp-foam);
	}

	.signature input {
		background: var(--rp-base);
		border: 2px solid var(--rp-foam);
		border-radius: 3px;
		color: var(--rp-text);
		padding: 0.3rem 0.5rem;
		font-family: 'VT323', monospace;
		font-size: 1.1rem;
		min-width: 160px;
	}

	.signature input:focus {
		outline: none;
		box-shadow: 0 0 8px var(--rp-foam);
	}

	.page {
		flex: 1;
		min-height: 0;
		display: flex;
	}

	.page.hidden {
		display: none;
	}

	@media (max-width: 640px) {
		.head {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.tabs {
			margin-left: 0;
			justify-content: center;
		}

		.signature {
			margin-left: 0;
		}
	}
</style>
