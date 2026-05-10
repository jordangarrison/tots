<script lang="ts">
	import { onMount } from 'svelte';
	import { templates, type ColoringTemplate } from '$lib/coloring/templates';

	export const prerender = true;

	let bgCanvas: HTMLCanvasElement;
	let drawCanvas: HTMLCanvasElement;
	let fileInput: HTMLInputElement;

	let bgCtx: CanvasRenderingContext2D;
	let drawCtx: CanvasRenderingContext2D;

	const CANVAS_W = 1024;
	const CANVAS_H = 768;

	type Tool = 'brush' | 'eraser';
	let tool: Tool = 'brush';
	let color = '#eb6f92';
	let brushSize = 22;

	let drawing = false;
	let lastX = 0;
	let lastY = 0;

	let activeTemplateId: string | null = templates[0]?.id ?? null;
	let hasCustomBg = false;

	const palette = [
		'#1f1d2e',
		'#ffffff',
		'#e84a4a',
		'#ff8a3c',
		'#f6c177',
		'#fff066',
		'#5cb85c',
		'#2fbf71',
		'#3478d4',
		'#9ccfd8',
		'#31748f',
		'#c4a7e7',
		'#7e3fbb',
		'#eb6f92',
		'#ebbcba',
		'#8b5a2b'
	];

	const sizes = [6, 12, 22, 38, 60];

	let history: ImageData[] = [];
	const MAX_HISTORY = 30;

	const saveHistory = () => {
		if (!drawCtx) return;
		const snap = drawCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
		history.push(snap);
		if (history.length > MAX_HISTORY) history.shift();
		history = history;
	};

	const undo = () => {
		if (!drawCtx || history.length === 0) return;
		const snap = history.pop()!;
		drawCtx.putImageData(snap, 0, 0);
		history = history;
	};

	const clearDrawing = () => {
		if (!drawCtx) return;
		saveHistory();
		drawCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
	};

	const fitImage = (img: HTMLImageElement) => {
		bgCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
		const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
		const w = img.width * scale;
		const h = img.height * scale;
		const x = (CANVAS_W - w) / 2;
		const y = (CANVAS_H - h) / 2;
		bgCtx.drawImage(img, x, y, w, h);
	};

	const renderSvg = (svg: string) => {
		const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			fitImage(img);
			URL.revokeObjectURL(url);
		};
		img.src = url;
	};

	const renderImage = (src: string) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => fitImage(img);
		img.src = src;
	};

	const loadTemplate = (template: ColoringTemplate) => {
		activeTemplateId = template.id;
		hasCustomBg = false;
		renderSvg(template.svg);
		if (drawCtx) drawCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
		history = [];
	};

	const blankPage = () => {
		activeTemplateId = null;
		hasCustomBg = false;
		bgCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
		drawCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
		history = [];
	};

	const handleFile = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = () => {
				renderImage(reader.result as string);
				hasCustomBg = true;
				activeTemplateId = null;
				if (drawCtx) drawCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
				history = [];
			};
			reader.readAsDataURL(file);
		} else {
			alert('Please pick a picture file (JPG, PNG, GIF, WebP, or SVG).');
		}

		target.value = '';
	};

	const getCoords = (e: PointerEvent) => {
		const rect = drawCanvas.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
		const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
		return { x, y };
	};

	const startDraw = (e: PointerEvent) => {
		if (e.button !== undefined && e.button !== 0) return;
		e.preventDefault();
		drawCanvas.setPointerCapture(e.pointerId);
		saveHistory();
		drawing = true;
		const { x, y } = getCoords(e);
		lastX = x;
		lastY = y;

		drawCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
		drawCtx.fillStyle = color;
		drawCtx.beginPath();
		drawCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
		drawCtx.fill();
	};

	const moveDraw = (e: PointerEvent) => {
		if (!drawing) return;
		e.preventDefault();
		const { x, y } = getCoords(e);

		drawCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
		drawCtx.strokeStyle = color;
		drawCtx.lineWidth = brushSize;
		drawCtx.lineCap = 'round';
		drawCtx.lineJoin = 'round';
		drawCtx.beginPath();
		drawCtx.moveTo(lastX, lastY);
		drawCtx.lineTo(x, y);
		drawCtx.stroke();

		lastX = x;
		lastY = y;
	};

	const endDraw = (e: PointerEvent) => {
		if (!drawing) return;
		drawing = false;
		try {
			drawCanvas.releasePointerCapture(e.pointerId);
		} catch {
			// ignore
		}
	};

	const saveImage = () => {
		const out = document.createElement('canvas');
		out.width = CANVAS_W;
		out.height = CANVAS_H;
		const ctx = out.getContext('2d');
		if (!ctx) return;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
		ctx.drawImage(drawCanvas, 0, 0);
		ctx.globalCompositeOperation = 'multiply';
		ctx.drawImage(bgCanvas, 0, 0);
		ctx.globalCompositeOperation = 'source-over';

		out.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `coloring-${Date.now()}.png`;
			a.click();
			URL.revokeObjectURL(url);
		}, 'image/png');
	};

	onMount(() => {
		bgCtx = bgCanvas.getContext('2d')!;
		drawCtx = drawCanvas.getContext('2d')!;

		const initial = templates.find((t) => t.id === activeTemplateId) ?? templates[0];
		if (initial) {
			renderSvg(initial.svg);
		}
	});
</script>

<div class="game-container">
	<div class="toolbar">
		<a href="/" class="back-link" aria-label="Back to game picker">◄ EXIT</a>

		<div class="tool-group">
			<button
				type="button"
				class="tool-btn"
				class:active={tool === 'brush'}
				on:click={() => (tool = 'brush')}
				title="Brush"
			>
				<span aria-hidden="true">🖌</span>
				<span class="tool-label">BRUSH</span>
			</button>
			<button
				type="button"
				class="tool-btn"
				class:active={tool === 'eraser'}
				on:click={() => (tool = 'eraser')}
				title="Eraser"
			>
				<span aria-hidden="true">🧽</span>
				<span class="tool-label">ERASE</span>
			</button>
		</div>

		<div class="tool-group sizes">
			{#each sizes as s}
				<button
					type="button"
					class="size-btn"
					class:active={brushSize === s}
					on:click={() => (brushSize = s)}
					title="Brush size {s}"
					aria-label="Brush size {s}"
				>
					<span class="dot" style="--dot: {Math.max(4, Math.min(s, 28))}px;" />
				</button>
			{/each}
		</div>

		<div class="tool-group palette">
			{#each palette as c}
				<button
					type="button"
					class="swatch"
					class:active={color === c && tool === 'brush'}
					style="--swatch: {c};"
					on:click={() => {
						color = c;
						tool = 'brush';
					}}
					title={c}
					aria-label="Color {c}"
				/>
			{/each}
			<label class="swatch picker" title="Custom color">
				<input
					type="color"
					bind:value={color}
					on:change={() => (tool = 'brush')}
					aria-label="Pick a custom color"
				/>
			</label>
		</div>

		<div class="tool-group">
			<button type="button" class="tool-btn ghost" on:click={undo} title="Undo last stroke">
				<span aria-hidden="true">↶</span>
				<span class="tool-label">UNDO</span>
			</button>
			<button type="button" class="tool-btn ghost" on:click={clearDrawing} title="Clear coloring">
				<span aria-hidden="true">✕</span>
				<span class="tool-label">CLEAR</span>
			</button>
			<button type="button" class="tool-btn ghost" on:click={saveImage} title="Save as PNG">
				<span aria-hidden="true">💾</span>
				<span class="tool-label">SAVE</span>
			</button>
		</div>
	</div>

	<div class="page-row">
		<aside class="sidebar">
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
		</aside>

		<div class="stage" class:eraser={tool === 'eraser'}>
			<canvas
				class="canvas-draw"
				bind:this={drawCanvas}
				width={CANVAS_W}
				height={CANVAS_H}
				on:pointerdown={startDraw}
				on:pointermove={moveDraw}
				on:pointerup={endDraw}
				on:pointercancel={endDraw}
				on:pointerleave={endDraw}
			/>
			<canvas class="canvas-bg" bind:this={bgCanvas} width={CANVAS_W} height={CANVAS_H} />
		</div>
	</div>
</div>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		gap: 0.5rem;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.85rem;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.75rem;
		background: var(--rp-surface);
		border: 2px solid var(--rp-iris);
		border-radius: 4px;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 12px var(--rp-iris);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.15em;
	}

	.tool-group {
		display: flex;
		gap: 0.35rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.tool-group.sizes {
		gap: 0.25rem;
	}

	.tool-group.palette {
		gap: 0.3rem;
		max-width: 100%;
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

	.tool-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.55rem;
		background: var(--rp-base);
		color: var(--rp-text);
		border: 2px solid var(--rp-foam);
		border-radius: 3px;
		cursor: pointer;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.15em;
		transition: background 0.12s, color 0.12s, box-shadow 0.12s;
	}

	.tool-btn span:first-child {
		font-size: 0.95rem;
	}

	.tool-btn.ghost {
		border-color: var(--rp-subtle);
		color: var(--rp-subtle);
	}

	.tool-btn:hover,
	.tool-btn:focus-visible {
		background: var(--rp-foam);
		color: var(--rp-base);
		outline: none;
		box-shadow: 0 0 10px var(--rp-foam);
	}

	.tool-btn.ghost:hover,
	.tool-btn.ghost:focus-visible {
		background: var(--rp-subtle);
		color: var(--rp-base);
		box-shadow: 0 0 10px var(--rp-subtle);
	}

	.tool-btn.active {
		background: var(--rp-foam);
		color: var(--rp-base);
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 12px var(--rp-foam);
	}

	.size-btn {
		width: 36px;
		height: 36px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--rp-base);
		border: 2px solid var(--rp-hl-high);
		border-radius: 3px;
		cursor: pointer;
		padding: 0;
		transition: border-color 0.12s, box-shadow 0.12s;
	}

	.size-btn .dot {
		display: block;
		width: var(--dot);
		height: var(--dot);
		background: var(--rp-text);
		border-radius: 50%;
	}

	.size-btn:hover,
	.size-btn:focus-visible {
		border-color: var(--rp-iris);
		outline: none;
		box-shadow: 0 0 8px var(--rp-iris);
	}

	.size-btn.active {
		border-color: var(--rp-gold);
		box-shadow: 0 0 10px var(--rp-gold);
	}

	.swatch {
		width: 28px;
		height: 28px;
		background: var(--swatch);
		border: 2px solid var(--rp-hl-high);
		border-radius: 4px;
		cursor: pointer;
		padding: 0;
		transition: transform 0.1s, box-shadow 0.12s, border-color 0.12s;
	}

	.swatch:hover,
	.swatch:focus-visible {
		transform: scale(1.12);
		outline: none;
		border-color: var(--rp-text);
		box-shadow: 0 0 8px var(--swatch, var(--rp-text));
	}

	.swatch.active {
		border-color: var(--rp-gold);
		box-shadow: 0 0 10px var(--rp-gold);
		transform: scale(1.15);
	}

	.swatch.picker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(45deg, #eb6f92, #f6c177, #9ccfd8, #c4a7e7);
		position: relative;
	}

	.swatch.picker input {
		opacity: 0;
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		cursor: pointer;
		border: none;
	}

	.page-row {
		flex: 1;
		min-height: 0;
		display: flex;
		gap: 0.5rem;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.6rem;
		background: var(--rp-surface);
		border: 2px solid var(--rp-pine);
		border-radius: 4px;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 10px var(--rp-pine);
		min-width: 165px;
		max-width: 200px;
		overflow-y: auto;
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

	.stage {
		flex: 1;
		min-width: 0;
		min-height: 0;
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		background: var(--rp-base);
		border-radius: 4px;
		overflow: hidden;
	}

	.canvas-draw,
	.canvas-bg {
		position: absolute;
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		aspect-ratio: 4 / 3;
		display: block;
		border: 3px solid var(--rp-pine);
		border-radius: 4px;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 18px var(--rp-pine);
		background: #ffffff;
		image-rendering: auto;
	}

	.canvas-bg {
		mix-blend-mode: multiply;
		pointer-events: none;
		background: transparent;
		box-shadow: none;
		border-color: transparent;
	}

	.canvas-draw {
		touch-action: none;
		cursor: crosshair;
	}

	.stage.eraser .canvas-draw {
		cursor: cell;
	}

	@media (max-width: 720px) {
		.page-row {
			flex-direction: column;
		}

		.sidebar {
			max-width: none;
			min-width: 0;
			flex-direction: row;
			align-items: center;
			overflow-x: auto;
			overflow-y: hidden;
		}

		.template-grid {
			grid-auto-flow: column;
			grid-template-columns: none;
			grid-template-rows: 1fr;
		}

		.upload-btn {
			margin-top: 0;
			white-space: nowrap;
		}

		.upload-hint {
			display: none;
		}
	}

	.tool-label {
		display: inline;
	}

	@media (max-width: 520px) {
		.tool-label {
			display: none;
		}
	}
</style>
