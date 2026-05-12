<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { characters } from '$lib/characters';
	import type { Character } from '$lib/characters';
	import type { AreaDef, Facing, SaveState } from '../types';
	import { isWalkable } from '../types';
	import { areas, doorAt, findPlotDef, npcAt, plotAt, tileAt } from '../areas';
	import { advance, isHarvestable, pickLavender, plant } from '../plots';
	import { writeSave } from '../save';
	import { areaPixelSize, draw } from '../render';
	import TextBubble from './TextBubble.svelte';

	const CAST_MS = 3500;

	export let initialState: SaveState;
	export let onExit: () => void;

	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let raf = 0;

	let state: SaveState = initialState;
	$: character = characters[state.characterId] as Character;
	$: area = areas[state.areaId] as AreaDef;
	$: areaSize = areaPixelSize(area);

	// Animation state for cell-to-cell movement.
	let moveFrom: { x: number; y: number } | null = null;
	let moveStartedAt = 0;
	const MOVE_MS = 180;

	const heldDirs = new Set<Facing>();
	let lastDir: Facing | null = null;

	let bubble: { text: string; expiresAt: number; accent: string } | null = null;
	let interactHint: string | null = null;

	// Transient (per-session) fishing state. Not persisted: if the player
	// reloads mid-cast, the cast is simply abandoned.
	let casting: { startedAt: number } | null = null;

	const KEY_TO_DIR: Record<string, Facing> = {
		ArrowUp: 'up',
		ArrowDown: 'down',
		ArrowLeft: 'left',
		ArrowRight: 'right',
		w: 'up',
		W: 'up',
		s: 'down',
		S: 'down',
		a: 'left',
		A: 'left',
		d: 'right',
		D: 'right'
	};

	function dirDelta(d: Facing): { dx: number; dy: number } {
		switch (d) {
			case 'up':
				return { dx: 0, dy: -1 };
			case 'down':
				return { dx: 0, dy: 1 };
			case 'left':
				return { dx: -1, dy: 0 };
			case 'right':
				return { dx: 1, dy: 0 };
		}
	}

	function isCellBlocked(x: number, y: number): boolean {
		const k = tileAt(area, x, y);
		if (k === null) return true;
		const d = doorAt(area, x, y);
		if (d) return !!d.comingSoon; // real doors walkable, coming-soon blocks
		if (!isWalkable(k)) return true;
		if (npcAt(area, x, y)) return true;
		return false;
	}

	function tryStartMove(dir: Facing) {
		if (moveFrom || casting) return;
		state.facing = dir;
		const { dx, dy } = dirDelta(dir);
		const tx = state.playerX + dx;
		const ty = state.playerY + dy;
		if (isCellBlocked(tx, ty)) {
			state = state; // facing-only update
			return;
		}
		moveFrom = { x: state.playerX, y: state.playerY };
		moveStartedAt = performance.now();
		state.playerX = tx;
		state.playerY = ty;
		state = state;
	}

	function showBubble(text: string, accent = 'var(--rp-gold)', ms = 3200) {
		bubble = { text, expiresAt: performance.now() + ms, accent };
	}

	function transitionTo(areaId: SaveState['areaId'], toX: number, toY: number) {
		state.areaId = areaId;
		state.playerX = toX;
		state.playerY = toY;
		if (!state.visitedAreas.includes(areaId)) {
			state.visitedAreas = [...state.visitedAreas, areaId];
			showBubble(areas[areaId].welcome, areas[areaId].accent, 4200);
		}
		state = state;
		persist();
	}

	const NPC_HELLOS: Record<string, string> = {
		jane: 'Hello, neighbor! Care to plant a rose with me?',
		isla: 'Hello, neighbor! The lavender smells so good today.',
		ollie: '*happy tail wag* Wanna go fishing?'
	};

	function interact() {
		if (casting) return;

		const { dx, dy } = dirDelta(state.facing);
		const tx = state.playerX + dx;
		const ty = state.playerY + dy;

		const door = doorAt(area, tx, ty);
		if (door) {
			if (door.comingSoon) {
				showBubble(`${door.label} is coming soon!`, 'var(--rp-gold)');
				return;
			}
			transitionTo(door.toArea, door.toX, door.toY);
			return;
		}

		const npc = npcAt(area, tx, ty);
		if (npc) {
			const c = characters[npc.id];
			const hello = NPC_HELLOS[npc.id] ?? 'Hello, neighbor!';
			showBubble(`${c.name}: "${hello}"`, c.accent);
			return;
		}

		const plot = plotAt(area, tx, ty);
		if (plot) {
			if (plot.kind === 'rose') {
				interactRose(plot.id);
				return;
			}
			if (plot.kind === 'lavender') {
				interactLavender(plot.id);
				return;
			}
		}

		const tile = tileAt(area, tx, ty);
		if (tile === 'water') {
			startCasting();
			return;
		}
	}

	function interactRose(plotId: string) {
		const ps = state.plots[plotId];
		if (!ps || ps.stage === 'empty') {
			state.plots[plotId] = plant(performance.now());
			state = state;
			showBubble('🌱 A rose seed is planted.', 'var(--rp-love)');
			persist();
			return;
		}
		if (isHarvestable(ps, 'rose')) {
			state.inventory.rose += 1;
			delete state.plots[plotId];
			state = state;
			showBubble('🌹 Picked a rose!', 'var(--rp-love)');
			persist();
			return;
		}
		if (ps.stage === 'seeded') {
			showBubble('Almost sprouting...', 'var(--rp-gold)');
			return;
		}
		showBubble('Almost ready to bloom...', 'var(--rp-gold)');
	}

	function interactLavender(plotId: string) {
		const ps = state.plots[plotId];
		if (isHarvestable(ps, 'lavender')) {
			state.inventory.lavender += 1;
			state.plots[plotId] = pickLavender(performance.now());
			state = state;
			showBubble('💜 Picked some lavender!', 'var(--rp-iris)');
			persist();
			return;
		}
		showBubble('Lavender is regrowing...', 'var(--rp-iris)');
	}

	function startCasting() {
		casting = { startedAt: performance.now() };
		showBubble('🎣 Casting...', 'var(--rp-foam)', CAST_MS + 200);
	}

	function finishCasting() {
		casting = null;
		state.inventory.fish += 1;
		state = state;
		showBubble('🐟 Caught a fish!', 'var(--rp-foam)');
		persist();
	}

	function computeInteractHint(): string | null {
		if (casting) return '🎣 Casting...';

		const { dx, dy } = dirDelta(state.facing);
		const tx = state.playerX + dx;
		const ty = state.playerY + dy;

		const door = doorAt(area, tx, ty);
		if (door) return door.comingSoon ? `🚧 ${door.label}` : `▶ ${door.label}`;

		const npc = npcAt(area, tx, ty);
		if (npc) return `▶ Say hello`;

		const plot = plotAt(area, tx, ty);
		if (plot) {
			const ps = state.plots[plot.id];
			if (plot.kind === 'rose') {
				if (!ps || ps.stage === 'empty') return '▶ Plant a seed';
				if (isHarvestable(ps, 'rose')) return '▶ Pick rose';
				return '▶ Growing...';
			}
			if (plot.kind === 'lavender') {
				if (isHarvestable(ps, 'lavender')) return '▶ Pick lavender';
				return '▶ Regrowing...';
			}
		}

		const tile = tileAt(area, tx, ty);
		if (tile === 'water') return '▶ Cast line';

		return null;
	}

	// Cell-to-cell lerp for rendering only — game state holds integer cell coords.
	function renderPosition() {
		if (!moveFrom) return { x: state.playerX, y: state.playerY };
		const t = Math.min(1, (performance.now() - moveStartedAt) / MOVE_MS);
		const x = moveFrom.x + (state.playerX - moveFrom.x) * t;
		const y = moveFrom.y + (state.playerY - moveFrom.y) * t;
		return { x, y };
	}

	function persist() {
		writeSave(state);
	}

	function tick() {
		raf = requestAnimationFrame(tick);
		const now = performance.now();

		if (moveFrom && now - moveStartedAt >= MOVE_MS) {
			moveFrom = null;
			const d = doorAt(area, state.playerX, state.playerY);
			if (d && !d.comingSoon) {
				transitionTo(d.toArea, d.toX, d.toY);
			}
		}

		if (!moveFrom && (lastDir || heldDirs.size > 0)) {
			const dir = lastDir && heldDirs.has(lastDir) ? lastDir : [...heldDirs][0];
			if (dir) tryStartMove(dir);
		}

		// Advance plot growth — pure, no side effects on render.
		let dirty = false;
		for (const id of Object.keys(state.plots)) {
			const def = findPlotDef(id);
			if (!def) {
				delete state.plots[id];
				dirty = true;
				continue;
			}
			const cur = state.plots[id];
			const next = advance(cur, def.kind, now);
			if (next === null) {
				delete state.plots[id];
				dirty = true;
			} else if (next !== cur) {
				state.plots[id] = next;
				dirty = true;
			}
		}
		if (dirty) state = state;

		if (casting && now - casting.startedAt >= CAST_MS) {
			finishCasting();
		}

		if (bubble && now >= bubble.expiresAt) bubble = null;
		interactHint = computeInteractHint();

		if (ctx) {
			const pos = renderPosition();
			draw({
				ctx,
				area,
				plots: state.plots,
				player: {
					x: pos.x,
					y: pos.y,
					facing: state.facing,
					character
				},
				now
			});
		}
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.repeat) return;
		const dir = KEY_TO_DIR[e.key];
		if (dir) {
			e.preventDefault();
			heldDirs.add(dir);
			lastDir = dir;
			return;
		}
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			interact();
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		const dir = KEY_TO_DIR[e.key];
		if (dir) {
			heldDirs.delete(dir);
			if (lastDir === dir) lastDir = null;
		}
	}

	function pressDir(d: Facing) {
		heldDirs.add(d);
		lastDir = d;
	}
	function releaseDir(d: Facing) {
		heldDirs.delete(d);
		if (lastDir === d) lastDir = null;
	}

	onMount(() => {
		ctx = canvasEl.getContext('2d');
		if (ctx) ctx.imageSmoothingEnabled = false;

		// Show welcome on first ever entry to courtyard.
		if (state.visitedAreas.length === 1 && state.areaId === 'courtyard') {
			showBubble(area.welcome, area.accent, 4200);
		}

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		raf = requestAnimationFrame(tick);
	});

	onDestroy(() => {
		if (raf) cancelAnimationFrame(raf);
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);
		persist();
	});
</script>

<div class="game" style="--accent: {area.accent};">
	<header class="hud">
		<button class="exit" type="button" on:click={onExit} aria-label="Back to game picker">
			◄ EXIT
		</button>
		<span class="area-name">{area.name}</span>
		<div class="inventory-row">
			<span class="inventory rose" title="Roses picked">🌹 {state.inventory.rose}</span>
			<span class="inventory lavender" title="Lavender picked">💜 {state.inventory.lavender}</span>
			<span class="inventory fish" title="Fish caught">🐟 {state.inventory.fish}</span>
		</div>
	</header>

	<div class="stage">
		<canvas
			bind:this={canvasEl}
			width={areaSize.w}
			height={areaSize.h}
			tabindex="0"
			aria-label="Kingdom game canvas"
		/>

		{#if bubble}
			<TextBubble text={bubble.text} accent={bubble.accent} />
		{/if}

		{#if interactHint}
			<div class="hint">{interactHint} <span class="key">[SPACE]</span></div>
		{/if}
	</div>

	<div class="touch-controls" aria-hidden="true">
		<div class="dpad">
			<button
				class="db up"
				type="button"
				on:pointerdown={() => pressDir('up')}
				on:pointerup={() => releaseDir('up')}
				on:pointerleave={() => releaseDir('up')}
				on:pointercancel={() => releaseDir('up')}>▲</button
			>
			<button
				class="db left"
				type="button"
				on:pointerdown={() => pressDir('left')}
				on:pointerup={() => releaseDir('left')}
				on:pointerleave={() => releaseDir('left')}
				on:pointercancel={() => releaseDir('left')}>◀</button
			>
			<button
				class="db right"
				type="button"
				on:pointerdown={() => pressDir('right')}
				on:pointerup={() => releaseDir('right')}
				on:pointerleave={() => releaseDir('right')}
				on:pointercancel={() => releaseDir('right')}>▶</button
			>
			<button
				class="db down"
				type="button"
				on:pointerdown={() => pressDir('down')}
				on:pointerup={() => releaseDir('down')}
				on:pointerleave={() => releaseDir('down')}
				on:pointercancel={() => releaseDir('down')}>▼</button
			>
		</div>
		<button class="action" type="button" on:click={interact}>A</button>
	</div>
</div>

<style>
	.game {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 720px;
		gap: 0.5rem;
	}

	.exit {
		background: transparent;
		border: 2px solid var(--rp-muted);
		color: var(--rp-subtle);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.2em;
		padding: 0.4rem 0.7rem;
		cursor: pointer;
	}

	.exit:hover,
	.exit:focus-visible {
		color: var(--rp-text);
		border-color: var(--rp-text);
		outline: none;
	}

	.area-name {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.75rem;
		color: var(--accent);
		text-shadow: 0 0 6px var(--accent);
		letter-spacing: 0.18em;
		text-align: center;
	}

	.inventory-row {
		display: flex;
		gap: 0.4rem;
	}

	.inventory {
		font-family: 'VT323', monospace;
		font-size: 1.4rem;
		color: var(--rp-text);
		background: var(--rp-surface);
		padding: 0.1rem 0.6rem;
		border: 2px solid var(--rp-muted);
	}

	.inventory.rose {
		border-color: var(--rp-love);
		box-shadow: 0 0 8px var(--rp-love);
	}

	.inventory.lavender {
		border-color: var(--rp-iris);
		box-shadow: 0 0 8px var(--rp-iris);
	}

	.inventory.fish {
		border-color: var(--rp-foam);
		box-shadow: 0 0 8px var(--rp-foam);
	}

	.stage {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		max-width: 100%;
	}

	canvas {
		display: block;
		image-rendering: pixelated;
		max-width: 100%;
		max-height: 60vh;
		border: 3px solid var(--accent);
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 20px var(--accent);
	}

	canvas:focus-visible {
		outline: 2px solid var(--rp-foam);
		outline-offset: 2px;
	}

	.hint {
		position: absolute;
		top: -1.6rem;
		left: 50%;
		transform: translateX(-50%);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		color: var(--rp-text);
		background: var(--rp-surface);
		border: 2px solid var(--rp-foam);
		padding: 0.25rem 0.6rem;
		box-shadow: 0 0 6px var(--rp-foam);
		letter-spacing: 0.15em;
		white-space: nowrap;
	}

	.hint .key {
		color: var(--rp-gold);
		margin-left: 0.4rem;
	}

	.touch-controls {
		display: flex;
		justify-content: space-between;
		width: 100%;
		max-width: 720px;
		padding: 0 0.5rem;
		align-items: flex-end;
		user-select: none;
	}

	.dpad {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.db {
		position: absolute;
		width: 40px;
		height: 40px;
		background: var(--rp-surface);
		border: 2px solid var(--rp-iris);
		color: var(--rp-text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 0 6px var(--rp-iris);
		touch-action: none;
	}

	.db:active {
		background: var(--rp-iris);
		color: var(--rp-base);
	}

	.db.up { left: 40px; top: 0; }
	.db.down { left: 40px; top: 80px; }
	.db.left { left: 0; top: 40px; }
	.db.right { left: 80px; top: 40px; }

	.action {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: var(--rp-surface);
		border: 3px solid var(--rp-love);
		color: var(--rp-love);
		font-family: 'Press Start 2P', cursive;
		font-size: 1.4rem;
		cursor: pointer;
		box-shadow: 0 0 10px var(--rp-love);
		touch-action: none;
	}

	.action:active {
		background: var(--rp-love);
		color: var(--rp-base);
	}

	@media (min-width: 720px) and (pointer: fine) {
		.touch-controls { display: none; }
	}
</style>
