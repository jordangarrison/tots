<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { characters } from '$lib/characters';
	import type { Character } from '$lib/characters';
	import type { AreaDef, Facing, ItemId, PlacedDecor, SaveState } from '../types';
	import { isWalkable } from '../types';
	import { areas, doorAt, findPlotDef, npcAt, plotAt, tileAt } from '../areas';
	import { advance, isHarvestable, pickLavender, plant } from '../plots';
	import { writeSave } from '../save';
	import { TILE_PX, areaPixelSize, draw } from '../render';
	import type { PlaceCursor, WildTulip } from '../render';
	import TextBubble from './TextBubble.svelte';

	const CAST_MS = 3500;
	const TULIP_LIFETIME_MS = 7000;
	const TULIP_SPAWN_EVERY_MS = 1800;
	const TULIP_MAX_ACTIVE = 4;

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

	// Place-mode lets the player drop a chosen inventory item onto the
	// cottage floor. Per-session UI state only — no need to persist.
	let placeMode: { itemId: ItemId } | null = null;

	const ITEM_ORDER: ItemId[] = ['rose', 'lavender', 'fish', 'tulip', 'seed'];
	const ITEM_LABEL: Record<ItemId, string> = {
		rose: '🌹 Rose',
		lavender: '💜 Lavender',
		fish: '🐟 Fish',
		tulip: '🌷 Tulip',
		seed: '🌱 Seed'
	};
	const ITEM_ACCENT: Record<ItemId, string> = {
		rose: 'var(--rp-love)',
		lavender: 'var(--rp-iris)',
		fish: 'var(--rp-foam)',
		tulip: 'var(--rp-gold)',
		seed: 'var(--rp-pine)'
	};

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
		if (areaId !== 'cottage') placeMode = null;
		// Wild tulips are per-area: clear them whenever we leave the tulip garden,
		// and seed a fresh batch when we arrive.
		wildTulips = [];
		lastTulipSpawnAt = areaId === 'tulip-garden' ? performance.now() : 0;
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
		ollie: '*happy tail wag* Wanna go fishing?',
		mommy: 'Welcome, little one! Grab seeds from the bin and plant them — but no picking!',
		daddy: 'Quick — the tulips never stay long! Catch one before it vanishes.'
	};

	// Transient (per-session) tulip patches in Daddy's garden.
	let wildTulips: WildTulip[] = [];
	let lastTulipSpawnAt = 0;

	function decorAt(x: number, y: number): PlacedDecor | null {
		return (
			state.placedDecor.find((d) => d.areaId === state.areaId && d.x === x && d.y === y) ?? null
		);
	}

	function canPlaceAt(x: number, y: number): boolean {
		if (state.areaId !== 'cottage') return false;
		if (tileAt(area, x, y) !== 'wood-floor') return false;
		if (decorAt(x, y)) return false;
		return true;
	}

	function firstAvailableItem(): ItemId | null {
		for (const id of ITEM_ORDER) {
			if (state.inventory[id] > 0) return id;
		}
		return null;
	}

	function selectItem(id: ItemId) {
		placeMode = { itemId: id };
	}

	function toggleDecorating() {
		if (placeMode) {
			placeMode = null;
			return;
		}
		if (state.areaId !== 'cottage') {
			showBubble('Decorate inside your cottage.', 'var(--rp-rose)');
			return;
		}
		const first = firstAvailableItem();
		if (!first) {
			showBubble('Gather flowers or fish first!', 'var(--rp-gold)');
			return;
		}
		placeMode = { itemId: first };
		showBubble('Pick a tile, then SPACE to place.', 'var(--rp-rose)', 2400);
	}

	function placeAt(x: number, y: number) {
		if (!placeMode) return;
		if (!canPlaceAt(x, y)) {
			showBubble('Place on the wood floor.', 'var(--rp-gold)', 1400);
			return;
		}
		const id = placeMode.itemId;
		if (state.inventory[id] <= 0) {
			showBubble(`No ${id} left.`, 'var(--rp-gold)', 1400);
			return;
		}
		state.inventory[id] -= 1;
		state.placedDecor = [...state.placedDecor, { areaId: 'cottage', x, y, itemId: id }];
		state = state;
		persist();
		// If we ran out of this item, auto-swap to the next available so the
		// kid stays in place mode without a dead-end.
		if (state.inventory[id] <= 0) {
			const next = firstAvailableItem();
			placeMode = next ? { itemId: next } : null;
		}
	}

	function pickupAt(x: number, y: number): boolean {
		const d = decorAt(x, y);
		if (!d) return false;
		state.placedDecor = state.placedDecor.filter((it) => it !== d);
		state.inventory[d.itemId] = (state.inventory[d.itemId] ?? 0) + 1;
		state = state;
		showBubble('Picked it up.', 'var(--rp-rose)', 1200);
		persist();
		return true;
	}

	function interact() {
		if (casting) return;

		const { dx, dy } = dirDelta(state.facing);
		const tx = state.playerX + dx;
		const ty = state.playerY + dy;

		// In place mode, SPACE places (or picks up) on the facing tile.
		if (placeMode) {
			if (decorAt(tx, ty)) {
				pickupAt(tx, ty);
			} else {
				placeAt(tx, ty);
			}
			return;
		}

		// Normal play: SPACE on a placed decor tile picks it back up.
		if (decorAt(tx, ty)) {
			pickupAt(tx, ty);
			return;
		}

		// Daddy's garden: grab a wild tulip before it disappears.
		if (state.areaId === 'tulip-garden') {
			const wild = wildTulipAt(tx, ty);
			if (wild) {
				pickWildTulip(wild);
				return;
			}
		}

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
			if (plot.kind === 'bluebonnet') {
				interactBluebonnet(plot.id);
				return;
			}
		}

		const tile = tileAt(area, tx, ty);
		if (tile === 'water') {
			startCasting();
			return;
		}
		if (tile === 'seed-bin') {
			collectSeed();
			return;
		}
		if (tile === 'bluebonnet') {
			showBubble("Mommy's bluebonnets are for looking, not picking.", 'var(--rp-foam)');
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

	function interactBluebonnet(plotId: string) {
		const ps = state.plots[plotId];
		if (!ps || ps.stage === 'empty') {
			if (state.inventory.seed <= 0) {
				showBubble('Grab seeds from the bin first!', 'var(--rp-pine)');
				return;
			}
			state.inventory.seed -= 1;
			state.plots[plotId] = plant(performance.now());
			state = state;
			showBubble('🌱 You planted a bluebonnet seed.', 'var(--rp-foam)');
			persist();
			return;
		}
		if (ps.stage === 'seeded') {
			showBubble('Tiny sprout coming soon...', 'var(--rp-gold)');
			return;
		}
		if (ps.stage === 'sprout') {
			showBubble('Almost bluebonnet time...', 'var(--rp-gold)');
			return;
		}
		showBubble('A pretty bluebonnet — no picking!', 'var(--rp-foam)');
	}

	function collectSeed() {
		state.inventory.seed += 1;
		state = state;
		showBubble('🌱 Picked up a bluebonnet seed.', 'var(--rp-pine)');
		persist();
	}

	function wildTulipAt(x: number, y: number): WildTulip | null {
		return wildTulips.find((t) => t.x === x && t.y === y) ?? null;
	}

	function pickWildTulip(tulip: WildTulip) {
		wildTulips = wildTulips.filter((t) => t !== tulip);
		state.inventory.tulip += 1;
		state = state;
		showBubble('🌷 You grabbed a tulip!', 'var(--rp-gold)');
		persist();
	}

	function spawnTulip(now: number) {
		if (state.areaId !== 'tulip-garden') return;
		if (wildTulips.length >= TULIP_MAX_ACTIVE) return;
		const candidates: { x: number; y: number }[] = [];
		for (let y = 0; y < area.height; y++) {
			for (let x = 0; x < area.width; x++) {
				if (tileAt(area, x, y) !== 'grass') continue;
				if (npcAt(area, x, y)) continue;
				if (doorAt(area, x, y)) continue;
				if (x === state.playerX && y === state.playerY) continue;
				if (wildTulips.some((t) => t.x === x && t.y === y)) continue;
				candidates.push({ x, y });
			}
		}
		if (candidates.length === 0) return;
		const pick = candidates[Math.floor(Math.random() * candidates.length)];
		const lifetimeMs = TULIP_LIFETIME_MS + Math.floor(Math.random() * 3000);
		wildTulips = [...wildTulips, { x: pick.x, y: pick.y, spawnedAt: now, lifetimeMs }];
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

		if (placeMode) {
			if (decorAt(tx, ty)) return '▶ Pick up';
			if (canPlaceAt(tx, ty)) return `▶ Place ${ITEM_LABEL[placeMode.itemId]}`;
			return '✗ Not here';
		}

		if (decorAt(tx, ty)) return '▶ Pick up';

		if (state.areaId === 'tulip-garden' && wildTulipAt(tx, ty)) return '▶ Grab tulip!';

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
			if (plot.kind === 'bluebonnet') {
				if (!ps || ps.stage === 'empty')
					return state.inventory.seed > 0 ? '▶ Plant a seed' : '✗ Need a seed';
				if (ps.stage === 'bloomed') return '▶ Look (no picking)';
				return '▶ Growing...';
			}
		}

		const tile = tileAt(area, tx, ty);
		if (tile === 'water') return '▶ Cast line';
		if (tile === 'seed-bin') return '▶ Take a seed';
		if (tile === 'bluebonnet') return '▶ Look (no picking)';

		return null;
	}

	function placeCursor(): PlaceCursor | null {
		if (!placeMode) return null;
		const { dx, dy } = dirDelta(state.facing);
		const tx = state.playerX + dx;
		const ty = state.playerY + dy;
		const valid = canPlaceAt(tx, ty) || !!decorAt(tx, ty);
		return { itemId: placeMode.itemId, x: tx, y: ty, valid };
	}

	function onCanvasPointer(e: PointerEvent) {
		if (!placeMode) return;
		const target = e.currentTarget as HTMLCanvasElement;
		const rect = target.getBoundingClientRect();
		const scale = rect.width / target.width;
		const cx = (e.clientX - rect.left) / scale;
		const cy = (e.clientY - rect.top) / scale;
		const tx = Math.floor(cx / TILE_PX);
		const ty = Math.floor(cy / TILE_PX);
		if (tx < 0 || ty < 0 || tx >= area.width || ty >= area.height) return;
		if (decorAt(tx, ty)) {
			pickupAt(tx, ty);
		} else if (canPlaceAt(tx, ty)) {
			placeAt(tx, ty);
		}
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

		// Tulip garden — expire stale tulips, then spawn new ones on a steady cadence.
		if (state.areaId === 'tulip-garden') {
			const before = wildTulips.length;
			wildTulips = wildTulips.filter((t) => now - t.spawnedAt < t.lifetimeMs);
			if (wildTulips.length !== before) {
				wildTulips = wildTulips;
			}
			if (now - lastTulipSpawnAt >= TULIP_SPAWN_EVERY_MS) {
				spawnTulip(now);
				lastTulipSpawnAt = now;
			}
		} else if (wildTulips.length > 0) {
			wildTulips = [];
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
				placedDecor: state.placedDecor,
				placeCursor: placeCursor(),
				wildTulips,
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
			return;
		}
		if (e.key === 'p' || e.key === 'P') {
			e.preventDefault();
			toggleDecorating();
			return;
		}
		if (e.key === 'Escape' && placeMode) {
			e.preventDefault();
			placeMode = null;
			return;
		}
		if (placeMode && /^[1-9]$/.test(e.key)) {
			const idx = Number(e.key) - 1;
			const id = ITEM_ORDER[idx];
			if (id && state.inventory[id] > 0) {
				e.preventDefault();
				selectItem(id);
			}
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

		// If a previous save dropped us in the tulip garden, prime the spawn clock.
		if (state.areaId === 'tulip-garden') {
			lastTulipSpawnAt = performance.now();
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
			<span class="inventory tulip" title="Tulips grabbed">🌷 {state.inventory.tulip}</span>
			<span class="inventory seed" title="Bluebonnet seeds">🌱 {state.inventory.seed}</span>
		</div>
	</header>

	{#if state.areaId === 'cottage'}
		<div class="picker" class:open={placeMode}>
			<button
				class="decorate-toggle"
				type="button"
				on:click={toggleDecorating}
				aria-pressed={!!placeMode}
			>
				{placeMode ? '✕ Done' : '🛠 Decorate'}
			</button>
			{#if placeMode}
				<div class="items" role="radiogroup" aria-label="Pick a decoration">
					{#each ITEM_ORDER as id, idx (id)}
						<button
							type="button"
							class="item"
							class:selected={placeMode.itemId === id}
							style="--item-accent: {ITEM_ACCENT[id]};"
							role="radio"
							aria-checked={placeMode.itemId === id}
							disabled={state.inventory[id] <= 0}
							on:click={() => selectItem(id)}
						>
							<span class="item-label">{ITEM_LABEL[id]}</span>
							<span class="item-count">×{state.inventory[id]}</span>
							<span class="item-key">{idx + 1}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<div class="stage">
		<canvas
			bind:this={canvasEl}
			width={areaSize.w}
			height={areaSize.h}
			tabindex="0"
			aria-label="Kingdom game canvas"
			on:pointerdown={onCanvasPointer}
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
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.3rem;
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

	.inventory.tulip {
		border-color: var(--rp-gold);
		box-shadow: 0 0 8px var(--rp-gold);
	}

	.inventory.seed {
		border-color: var(--rp-pine);
		box-shadow: 0 0 8px var(--rp-pine);
	}

	.picker {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: 720px;
	}

	.decorate-toggle {
		background: var(--rp-surface);
		border: 2px solid var(--rp-rose);
		color: var(--rp-rose);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.18em;
		padding: 0.45rem 0.8rem;
		cursor: pointer;
		box-shadow: 0 0 6px var(--rp-rose);
	}

	.picker.open .decorate-toggle {
		background: var(--rp-rose);
		color: var(--rp-base);
	}

	.items {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.item {
		position: relative;
		background: var(--rp-surface);
		border: 2px solid var(--item-accent);
		color: var(--rp-text);
		font-family: 'VT323', monospace;
		font-size: 1.1rem;
		padding: 0.35rem 0.7rem 0.35rem 0.55rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 5.5rem;
		cursor: pointer;
		box-shadow: 0 0 4px var(--item-accent);
	}

	.item:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		box-shadow: none;
	}

	.item.selected {
		background: var(--item-accent);
		color: var(--rp-base);
		box-shadow: 0 0 10px var(--item-accent);
	}

	.item-label {
		font-size: 0.95rem;
		line-height: 1;
	}

	.item-count {
		font-size: 0.85rem;
		opacity: 0.85;
	}

	.item-key {
		position: absolute;
		top: 2px;
		right: 4px;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.45rem;
		letter-spacing: 0.1em;
		opacity: 0.75;
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
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 20px var(--accent);
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

	.db.up {
		left: 40px;
		top: 0;
	}
	.db.down {
		left: 40px;
		top: 80px;
	}
	.db.left {
		left: 0;
		top: 40px;
	}
	.db.right {
		left: 80px;
		top: 40px;
	}

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
		.touch-controls {
			display: none;
		}
	}
</style>
