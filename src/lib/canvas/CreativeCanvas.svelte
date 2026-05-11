<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Slot, TextSlot, ImageSlot } from '$lib/cards/types';

	export let width = 1024;
	export let height = 768;
	export let templateSvg: string | null = null;
	export let slots: Slot[] = [];
	export let slotValues: Record<string, string> = {};
	export let foldGuideX: number | null = null;
	export let showSave = true;
	export let showPrint = true;
	export let printLabel = 'PRINT';

	const dispatch = createEventDispatcher<{
		slotchange: { id: string; value: string };
		print: void;
		save: void;
	}>();

	let bgCanvas: HTMLCanvasElement;
	let drawCanvas: HTMLCanvasElement;
	let bgCtx: CanvasRenderingContext2D;
	let drawCtx: CanvasRenderingContext2D;
	let mounted = false;

	type Tool = 'brush' | 'eraser';
	let tool: Tool = 'brush';
	let color = '#eb6f92';
	let brushSize = 22;

	let drawing = false;
	let lastX = 0;
	let lastY = 0;
	let activePointerId: number | null = null;
	let stylusMode = false;

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

	const imageCache = new Map<string, HTMLImageElement>();

	const saveHistory = () => {
		if (!drawCtx) return;
		const snap = drawCtx.getImageData(0, 0, width, height);
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

	export const clearDrawLayer = () => {
		if (!drawCtx) return;
		saveHistory();
		drawCtx.clearRect(0, 0, width, height);
	};

	const fitImage = (img: HTMLImageElement) => {
		bgCtx.clearRect(0, 0, width, height);
		const scale = Math.min(width / img.width, height / img.height);
		const w = img.width * scale;
		const h = img.height * scale;
		const x = (width - w) / 2;
		const y = (height - h) / 2;
		bgCtx.drawImage(img, x, y, w, h);
	};

	const renderSvgString = (svg: string) =>
		new Promise<void>((resolve) => {
			const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const img = new Image();
			img.onload = () => {
				fitImage(img);
				URL.revokeObjectURL(url);
				resolve();
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				resolve();
			};
			img.src = url;
		});

	export const renderImage = (src: string) =>
		new Promise<void>((resolve) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				fitImage(img);
				resolve();
			};
			img.onerror = () => resolve();
			img.src = src;
		});

	export const clearBackground = () => {
		if (!bgCtx) return;
		bgCtx.clearRect(0, 0, width, height);
	};

	export const replaceTemplate = async (svg: string | null) => {
		if (!bgCtx || !drawCtx) return;
		clearBackground();
		drawCtx.clearRect(0, 0, width, height);
		history = [];
		if (svg) await renderSvgString(svg);
	};

	const loadImage = (src: string) =>
		new Promise<HTMLImageElement | null>((resolve) => {
			const cached = imageCache.get(src);
			if (cached && cached.complete && cached.naturalWidth > 0) {
				resolve(cached);
				return;
			}
			const img = new Image();
			img.onload = () => {
				imageCache.set(src, img);
				resolve(img);
			};
			img.onerror = () => resolve(null);
			img.src = src;
		});

	const rasterTextSlot = (ctx: CanvasRenderingContext2D, slot: TextSlot, text: string) => {
		if (!text) return;
		const fontSize = slot.fontSize ?? 48;
		const fontFamily = slot.fontFamily ?? "'Schoolbell', 'Comic Sans MS', cursive";
		const align = slot.align ?? 'center';
		ctx.save();
		ctx.fillStyle = slot.color ?? '#1a1a1a';
		ctx.font = `${fontSize}px ${fontFamily}`;
		ctx.textAlign = align;
		ctx.textBaseline = 'top';

		const words = text.split(/(\s+)/);
		const lines: string[] = [];
		let line = '';
		for (const token of words) {
			if (token === '') continue;
			const next = line + token;
			if (ctx.measureText(next).width > slot.width && line.trim() !== '') {
				lines.push(line.trim());
				line = token.trim() === '' ? '' : token;
			} else {
				line = next;
			}
		}
		if (line.trim() !== '') lines.push(line.trim());

		const lineHeight = fontSize * 1.15;
		const blockHeight = lines.length * lineHeight;
		let y = slot.y + Math.max(0, (slot.height - blockHeight) / 2);
		let x = slot.x;
		if (align === 'center') x = slot.x + slot.width / 2;
		else if (align === 'right') x = slot.x + slot.width;

		for (const ln of lines) {
			ctx.fillText(ln, x, y);
			y += lineHeight;
		}
		ctx.restore();
	};

	const rasterImageSlot = async (
		ctx: CanvasRenderingContext2D,
		slot: ImageSlot,
		value: string
	) => {
		if (!value) return;
		const img = await loadImage(value);
		if (!img) return;
		ctx.save();
		ctx.beginPath();
		ctx.rect(slot.x, slot.y, slot.width, slot.height);
		ctx.clip();
		const scale = Math.max(slot.width / img.width, slot.height / img.height);
		const w = img.width * scale;
		const h = img.height * scale;
		const dx = slot.x + (slot.width - w) / 2;
		const dy = slot.y + (slot.height - h) / 2;
		ctx.drawImage(img, dx, dy, w, h);
		ctx.restore();
	};

	export const composite = async (): Promise<HTMLCanvasElement | null> => {
		if (!bgCanvas || !drawCanvas) return null;
		const out = document.createElement('canvas');
		out.width = width;
		out.height = height;
		const ctx = out.getContext('2d');
		if (!ctx) return null;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, width, height);

		for (const slot of slots) {
			if (slot.kind === 'image') {
				const val = slotValues[slot.id] ?? '';
				await rasterImageSlot(ctx, slot, val);
			}
		}

		ctx.drawImage(drawCanvas, 0, 0);

		ctx.globalCompositeOperation = 'multiply';
		ctx.drawImage(bgCanvas, 0, 0);
		ctx.globalCompositeOperation = 'source-over';

		for (const slot of slots) {
			if (slot.kind === 'text') {
				const explicit = slotValues[slot.id];
				const text = explicit !== undefined ? explicit : slot.defaultText ?? '';
				rasterTextSlot(ctx, slot, text);
			}
		}

		return out;
	};

	const getCoords = (e: PointerEvent) => {
		const rect = drawCanvas.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * width;
		const y = ((e.clientY - rect.top) / rect.height) * height;
		return { x, y };
	};

	const isInputAllowed = (e: PointerEvent) => {
		if (!stylusMode) return true;
		return e.pointerType === 'pen';
	};

	const startDraw = (e: PointerEvent) => {
		if (e.button !== undefined && e.button !== 0) return;
		if (!isInputAllowed(e)) return;
		e.preventDefault();
		drawCanvas.setPointerCapture(e.pointerId);
		activePointerId = e.pointerId;
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
		if (activePointerId !== null && e.pointerId !== activePointerId) return;
		if (!isInputAllowed(e)) return;
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
		if (activePointerId !== null && e.pointerId !== activePointerId) return;
		drawing = false;
		activePointerId = null;
		try {
			drawCanvas.releasePointerCapture(e.pointerId);
		} catch {
			// ignore
		}
	};

	const handleTextInput = (slotId: string, e: Event) => {
		const target = e.target as HTMLDivElement;
		const value = target.innerText;
		slotValues = { ...slotValues, [slotId]: value };
		dispatch('slotchange', { id: slotId, value });
	};

	const handleImagePick = (slotId: string, e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			alert('Please pick a picture file.');
			target.value = '';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const value = reader.result as string;
			slotValues = { ...slotValues, [slotId]: value };
			dispatch('slotchange', { id: slotId, value });
		};
		reader.readAsDataURL(file);
		target.value = '';
	};

	const clearImageSlot = (slotId: string) => {
		slotValues = { ...slotValues, [slotId]: '' };
		dispatch('slotchange', { id: slotId, value: '' });
	};

	onMount(() => {
		bgCtx = bgCanvas.getContext('2d')!;
		drawCtx = drawCanvas.getContext('2d')!;
		mounted = true;
		if (templateSvg) renderSvgString(templateSvg);
	});

	$: if (mounted && templateSvg !== undefined) {
		// background changes are driven explicitly via replaceTemplate() from the parent
	}

	$: aspect = `${width} / ${height}`;
</script>

<div class="cc-root">
	<div class="toolbar">
		<slot name="toolbar-start" />

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
			<button
				type="button"
				class="tool-btn stylus"
				class:active={stylusMode}
				on:click={() => (stylusMode = !stylusMode)}
				title={stylusMode
					? 'Stylus only — palms and fingers ignored. Click to allow any input.'
					: 'Allow any input. Click to ignore palms and fingers (stylus only).'}
				aria-pressed={stylusMode}
			>
				<span aria-hidden="true">✎</span>
				<span class="tool-label">{stylusMode ? 'STYLUS' : 'ANY INPUT'}</span>
			</button>
		</div>

		<div class="tool-group">
			<button type="button" class="tool-btn ghost" on:click={undo} title="Undo last stroke">
				<span aria-hidden="true">↶</span>
				<span class="tool-label">UNDO</span>
			</button>
			<button type="button" class="tool-btn ghost" on:click={clearDrawLayer} title="Clear drawing">
				<span aria-hidden="true">✕</span>
				<span class="tool-label">CLEAR</span>
			</button>
			{#if showPrint}
				<button
					type="button"
					class="tool-btn ghost"
					on:click={() => dispatch('print')}
					title="Print"
				>
					<span aria-hidden="true">🖨</span>
					<span class="tool-label">{printLabel}</span>
				</button>
			{/if}
			{#if showSave}
				<button
					type="button"
					class="tool-btn ghost"
					on:click={() => dispatch('save')}
					title="Save as PNG"
				>
					<span aria-hidden="true">💾</span>
					<span class="tool-label">SAVE</span>
				</button>
			{/if}
		</div>

		<slot name="toolbar-end" />
	</div>

	<slot name="above-canvas" />

	<div class="page-row">
		{#if $$slots.sidebar}
			<aside class="sidebar">
				<slot name="sidebar" />
			</aside>
		{/if}

		<div class="stage" class:eraser={tool === 'eraser'} style="--aspect: {aspect};">
			<div class="canvas-wrap">
				<canvas
					class="canvas-draw"
					bind:this={drawCanvas}
					{width}
					{height}
					on:pointerdown={startDraw}
					on:pointermove={moveDraw}
					on:pointerup={endDraw}
					on:pointercancel={endDraw}
					on:pointerleave={endDraw}
				/>
				<canvas class="canvas-bg" bind:this={bgCanvas} {width} {height} />
				{#if foldGuideX !== null}
					<div
						class="fold-guide"
						style="left: {(foldGuideX / width) * 100}%;"
						aria-hidden="true"
					/>
				{/if}
				{#each slots as slot (slot.id)}
					{#if slot.kind === 'text'}
						<div
							class="slot text"
							class:filled={(slotValues[slot.id] ?? '').length > 0}
							style="
								left: {(slot.x / width) * 100}%;
								top: {(slot.y / height) * 100}%;
								width: {(slot.width / width) * 100}%;
								height: {(slot.height / height) * 100}%;
								--slot-font-size: {((slot.fontSize ?? 48) / height) * 100}cqh;
								--slot-color: {slot.color ?? '#1a1a1a'};
								--slot-align: {slot.align ?? 'center'};
								--slot-font-family: {slot.fontFamily ?? "'Schoolbell', 'Comic Sans MS', cursive"};
							"
						>
							<div
								class="slot-editor"
								contenteditable="true"
								data-placeholder={slot.placeholder ?? slot.defaultText ?? ''}
								on:input={(e) => handleTextInput(slot.id, e)}
								role="textbox"
								tabindex="0"
							>{slotValues[slot.id] ?? slot.defaultText ?? ''}</div>
						</div>
					{:else}
						<div
							class="slot image"
							class:filled={(slotValues[slot.id] ?? '').length > 0}
							style="
								left: {(slot.x / width) * 100}%;
								top: {(slot.y / height) * 100}%;
								width: {(slot.width / width) * 100}%;
								height: {(slot.height / height) * 100}%;
							"
						>
							{#if slotValues[slot.id]}
								<img src={slotValues[slot.id]} alt="" />
								<button
									type="button"
									class="slot-remove"
									on:click={() => clearImageSlot(slot.id)}
									aria-label="Remove image"
								>✕</button>
							{:else}
								<label class="slot-upload">
									<span aria-hidden="true">📷</span>
									<span>{slot.hint ?? 'Add a photo'}</span>
									<input
										type="file"
										accept="image/*"
										on:change={(e) => handleImagePick(slot.id, e)}
									/>
								</label>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.cc-root {
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

	.tool-btn.stylus {
		border-color: var(--rp-rose);
		color: var(--rp-rose);
	}

	.tool-btn.stylus:hover,
	.tool-btn.stylus:focus-visible {
		background: var(--rp-rose);
		color: var(--rp-base);
		box-shadow: 0 0 10px var(--rp-rose);
	}

	.tool-btn.stylus.active {
		background: var(--rp-rose);
		color: var(--rp-base);
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 12px var(--rp-rose);
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

	.stage {
		flex: 1;
		min-width: 0;
		min-height: 0;
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #ffffff;
		border: 2px solid var(--rp-pine);
		border-radius: 4px;
		box-shadow: 0 0 18px var(--rp-pine);
		overflow: hidden;
		isolation: isolate;
	}

	.canvas-wrap {
		position: relative;
		aspect-ratio: var(--aspect);
		height: 100%;
		max-width: 100%;
		container-type: size;
	}

	.canvas-draw,
	.canvas-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		background: #ffffff;
		image-rendering: auto;
	}

	.canvas-bg {
		mix-blend-mode: multiply;
		pointer-events: none;
		background: transparent;
	}

	.canvas-draw {
		touch-action: none;
		cursor: crosshair;
	}

	.stage.eraser .canvas-draw {
		cursor: cell;
	}

	.fold-guide {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 0;
		border-left: 2px dashed rgba(0, 0, 0, 0.18);
		pointer-events: none;
		z-index: 2;
	}

	.slot {
		position: absolute;
		z-index: 3;
	}

	.slot.text {
		display: flex;
		align-items: center;
		justify-content: var(--slot-align, center);
		text-align: var(--slot-align, center);
		color: var(--slot-color, #1a1a1a);
		font-family: var(--slot-font-family, cursive);
		font-size: var(--slot-font-size, 48px);
		line-height: 1.15;
		border: 2px dashed rgba(196, 167, 231, 0.55);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.35);
		transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
	}

	.slot.text:hover {
		border-color: rgba(196, 167, 231, 0.9);
		box-shadow: 0 0 6px rgba(196, 167, 231, 0.5);
	}

	.slot.text:focus-within {
		border-color: var(--rp-gold);
		background: rgba(255, 255, 255, 0.7);
		box-shadow: 0 0 8px var(--rp-gold);
	}

	.slot.text.filled {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(196, 167, 231, 0.25);
	}

	.slot-editor {
		width: 100%;
		min-height: 1em;
		padding: 0.15em 0.4em;
		outline: none;
		color: inherit;
		font-family: inherit;
		font-size: inherit;
		text-align: inherit;
		line-height: inherit;
		caret-color: var(--rp-iris);
	}

	.slot-editor:empty::before {
		content: attr(data-placeholder);
		color: rgba(0, 0, 0, 0.4);
		font-style: italic;
	}

	.slot.image {
		border: 2px dashed rgba(156, 207, 216, 0.7);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.35);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.slot.image:hover {
		border-color: rgba(156, 207, 216, 1);
		box-shadow: 0 0 8px rgba(156, 207, 216, 0.6);
	}

	.slot.image.filled {
		border-color: rgba(156, 207, 216, 0.35);
		background: transparent;
	}

	.slot.image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.slot-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		width: 100%;
		height: 100%;
		cursor: pointer;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.1em;
		color: var(--rp-subtle, #6e6a86);
		text-align: center;
		padding: 0.5rem;
	}

	.slot-upload span:first-child {
		font-size: 2rem;
	}

	.slot-upload input {
		display: none;
	}

	.slot-remove {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid var(--rp-love);
		background: var(--rp-base);
		color: var(--rp-love);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.6rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 6px var(--rp-love);
	}

	.slot-remove:hover,
	.slot-remove:focus-visible {
		background: var(--rp-love);
		color: var(--rp-base);
		outline: none;
	}

	.tool-label {
		display: inline;
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
	}

	@media (max-width: 520px) {
		.tool-label {
			display: none;
		}
	}
</style>
