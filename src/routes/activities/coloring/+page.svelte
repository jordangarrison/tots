<script lang="ts">
	import { onMount } from 'svelte';
	import CreativeCanvas from '$lib/canvas/CreativeCanvas.svelte';
	import { templates, type ColoringTemplate } from '$lib/coloring/templates';
	import { printCanvas } from '$lib/print';
	import { saveImage } from '$lib/save';
	import { recordPlay } from '$lib/arcade/scores';

	export const prerender = true;

	onMount(() => recordPlay('coloring'));

	const CANVAS_W = 1024;
	const CANVAS_H = 768;

	let canvas: CreativeCanvas;
	let fileInput: HTMLInputElement;

	let activeTemplateId: string | null = templates[0]?.id ?? null;
	let hasCustomBg = false;

	const loadTemplate = async (template: ColoringTemplate) => {
		activeTemplateId = template.id;
		hasCustomBg = false;
		await canvas?.replaceTemplate(template.svg);
	};

	const blankPage = async () => {
		activeTemplateId = null;
		hasCustomBg = false;
		await canvas?.replaceTemplate(null);
	};

	const handleFile = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = async () => {
				await canvas?.replaceTemplate(null);
				await canvas?.renderImage(reader.result as string);
				hasCustomBg = true;
				activeTemplateId = null;
			};
			reader.readAsDataURL(file);
		} else {
			alert('Please pick a picture file (JPG, PNG, GIF, WebP, or SVG).');
		}

		target.value = '';
	};

	const handlePrint = async () => {
		const out = await canvas?.composite();
		if (!out) return;
		printCanvas(out, 'Coloring Page');
	};

	const handleSave = async () => {
		const out = await canvas?.composite();
		if (!out) return;
		await saveImage(out, { baseName: `coloring-${Date.now()}` });
	};

	const initialTemplate = templates.find((t) => t.id === activeTemplateId) ?? templates[0];
</script>

<CreativeCanvas
	bind:this={canvas}
	width={CANVAS_W}
	height={CANVAS_H}
	templateSvg={initialTemplate?.svg ?? null}
	on:print={handlePrint}
	on:save={handleSave}
>
	<a slot="toolbar-start" href="/" class="back-link" aria-label="Back to game picker">◄ EXIT</a>

	<svelte:fragment slot="sidebar">
		<h3 class="sidebar-title">PAGES</h3>
		<div class="template-grid">
			<button
				type="button"
				class="template-btn"
				class:active={activeTemplateId === null && !hasCustomBg}
				on:click={blankPage}
				title="Blank page"
			>
				<span class="thumb-emoji">▢</span>
				<span class="thumb-label">BLANK</span>
			</button>
			{#each templates as t}
				<button
					type="button"
					class="template-btn"
					class:active={activeTemplateId === t.id}
					on:click={() => loadTemplate(t)}
					title={t.name}
				>
					<span class="thumb-emoji" aria-hidden="true">{t.emoji}</span>
					<span class="thumb-label">{t.name.toUpperCase()}</span>
				</button>
			{/each}
		</div>

		<button
			type="button"
			class="upload-btn"
			class:active={hasCustomBg}
			on:click={() => fileInput.click()}
		>
			<span aria-hidden="true">📷</span> UPLOAD PICTURE
		</button>
		<p class="upload-hint">JPG, PNG, GIF, or SVG</p>
		<input
			type="file"
			accept="image/*"
			bind:this={fileInput}
			on:change={handleFile}
			class="hidden-input"
		/>
	</svelte:fragment>
</CreativeCanvas>

<style>
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

	.sidebar-title {
		margin: 0;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.6rem;
		color: var(--rp-foam);
		text-shadow: 0 0 6px var(--rp-foam);
		letter-spacing: 0.2em;
		text-align: center;
	}

	.template-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
	}

	.template-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.45rem 0.25rem;
		background: var(--rp-base);
		border: 2px solid var(--rp-hl-high);
		border-radius: 3px;
		color: var(--rp-text);
		cursor: pointer;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.45rem;
		letter-spacing: 0.1em;
		transition: border-color 0.12s, box-shadow 0.12s, transform 0.1s;
	}

	.thumb-emoji {
		font-size: 1.4rem;
		line-height: 1;
	}

	.thumb-label {
		color: var(--rp-subtle);
	}

	.template-btn:hover,
	.template-btn:focus-visible {
		border-color: var(--rp-iris);
		outline: none;
		transform: translateY(-2px);
		box-shadow: 0 0 8px var(--rp-iris);
	}

	.template-btn.active {
		border-color: var(--rp-gold);
		box-shadow: 0 0 10px var(--rp-gold);
	}

	.template-btn.active .thumb-label {
		color: var(--rp-gold);
		text-shadow: 0 0 4px var(--rp-gold);
	}

	.upload-btn {
		margin-top: 0.4rem;
		padding: 0.5rem 0.4rem;
		background: var(--rp-base);
		border: 2px solid var(--rp-love);
		border-radius: 3px;
		color: var(--rp-love);
		text-shadow: 0 0 5px var(--rp-love);
		cursor: pointer;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.5rem;
		letter-spacing: 0.12em;
		transition: background 0.12s, color 0.12s, box-shadow 0.12s;
	}

	.upload-btn:hover,
	.upload-btn:focus-visible {
		background: var(--rp-love);
		color: var(--rp-base);
		text-shadow: none;
		outline: none;
		box-shadow: 0 0 12px var(--rp-love);
	}

	.upload-btn.active {
		background: var(--rp-love);
		color: var(--rp-base);
		text-shadow: none;
		box-shadow: 0 0 10px var(--rp-love);
	}

	.upload-hint {
		margin: 0;
		text-align: center;
		font-family: 'VT323', monospace;
		font-size: 0.85rem;
		color: var(--rp-muted);
	}

	.hidden-input {
		display: none;
	}
</style>
