<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { characters } from '$lib/characters';
	import type { Character, CharacterId } from '$lib/characters';
	import type {
		AreaDef,
		Critter,
		Facing,
		GroundItem,
		GroundSpawnDef,
		ItemId,
		SaveState,
		TileKind
	} from '../types';
	import { ALL_ITEMS, MAX_HEARTS, isWalkable } from '../types';
	import { areas, doorAt, findPlotDef, plotAt, tileAt } from '../areas';
	import { advance as advancePlot, isHarvestable, pickRegrowing, plant } from '../plots';
	import { writeSave } from '../save';
	import { TILE_PX, areaPixelSize, draw } from '../render';
	import type { CharacterSpriteState, NpcMark, PlaceCursor } from '../render';
	import { butterflyAt, spawnCritters, updateCritters } from '../critters';
	import { completePages, greetingPages, questById, questPool, reminderPages } from '../dialogue';
	import type { DialogueContext, QuestTemplate } from '../dialogue';
	import { sfxBlip, sfxCoin, sfxFanfare, sfxMove, sfxPop } from '$lib/arcade/sounds';
	import TextBubble from './TextBubble.svelte';
	import DialoguePanel from './DialoguePanel.svelte';

	const CAST_MS = 3500;
	const MOVE_MS = 180;
	const NPC_MOVE_MS = 320;
	const MAX_ACTIVE_QUESTS = 3;

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

	// ---- Living world state (per-session, rebuilt on every area change) ----

	interface NpcEnt {
		id: CharacterId;
		x: number;
		y: number;
		facing: Facing;
		homeX: number;
		homeY: number;
		wander: number;
		moveFrom: { x: number; y: number } | null;
		moveStartedAt: number;
		nextThinkAt: number;
	}

	let npcEnts: NpcEnt[] = [];
	let groundItems: GroundItem[] = [];
	let spawnClocks: number[] = [];
	let critters: Critter[] = [];
	let lastTickAt = 0;

	// Open conversation. While set, movement is paused and SPACE advances pages.
	let dialogue: { speakerId: CharacterId; pages: string[]; onClose: () => void } | null = null;
	let panelRef: DialoguePanel | null = null;

	const ITEM_EMOJI: Record<ItemId, string> = {
		rose: '🌹',
		lavender: '💜',
		fish: '🐟',
		tulip: '🌷',
		seed: '🌱',
		berry: '🫐',
		shell: '🐚',
		butterfly: '🦋',
		muffin: '🧁'
	};
	const ITEM_NAME: Record<ItemId, string> = {
		rose: 'Rose',
		lavender: 'Lavender',
		fish: 'Fish',
		tulip: 'Tulip',
		seed: 'Seed',
		berry: 'Berry',
		shell: 'Shell',
		butterfly: 'Butterfly',
		muffin: 'Muffin'
	};
	const ITEM_ACCENT: Record<ItemId, string> = {
		rose: 'var(--rp-love)',
		lavender: 'var(--rp-iris)',
		fish: 'var(--rp-foam)',
		tulip: 'var(--rp-gold)',
		seed: 'var(--rp-pine)',
		berry: 'var(--rp-iris)',
		shell: 'var(--rp-gold)',
		butterfly: 'var(--rp-love)',
		muffin: 'var(--rp-gold)'
	};

	// Cozy one-line reactions for furniture and scenery.
	const TILE_FLAVOR: Partial<Record<TileKind, string>> = {
		bed: '💤 So cozy! But adventure awaits!',
		hearth: '🔥 Warm and crackling.',
		bookshelf: '📚 So many stories in here!',
		counter: '🧁 Everything smells amazing!',
		sandcastle: '🏰 A castle fit for tiny crabs!',
		table: '🌼 What a pretty little table.',
		window: '🪟 What a lovely view!'
	};

	$: visibleItems = ALL_ITEMS.filter((id) => state.inventory[id] > 0);
	$: questChips = Object.values(state.activeQuests).map((q) => ({
		npc: characters[q.npc].name,
		accent: characters[q.npc].accent,
		emoji: ITEM_EMOJI[q.itemId],
		have: Math.min(state.inventory[q.itemId], q.count),
		need: q.count,
		ready: state.inventory[q.itemId] >= q.count
	}));

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

	const FACINGS: Facing[] = ['up', 'down', 'left', 'right'];

	function npcEntAt(x: number, y: number): NpcEnt | null {
		return npcEnts.find((n) => (n.x === x && n.y === y) || (n.moveFrom?.x === x && n.moveFrom?.y === y)) ?? null;
	}

	function isCellBlocked(x: number, y: number): boolean {
		const k = tileAt(area, x, y);
		if (k === null) return true;
		const d = doorAt(area, x, y);
		if (d) return !!d.comingSoon; // real doors walkable, coming-soon blocks
		if (!isWalkable(k)) return true;
		if (npcEntAt(x, y)) return true;
		return false;
	}

	function npcCellBlocked(x: number, y: number, self: NpcEnt): boolean {
		const k = tileAt(area, x, y);
		if (k === null || !isWalkable(k)) return true;
		if (doorAt(area, x, y)) return true; // NPCs never stand in doorways
		if (plotAt(area, x, y)) return true;
		if (decorAt(x, y)) return true;
		if (groundItemAt(x, y)) return true;
		if (x === state.playerX && y === state.playerY) return true;
		const other = npcEntAt(x, y);
		if (other && other !== self) return true;
		return false;
	}

	function tryStartMove(dir: Facing) {
		if (moveFrom || casting || dialogue) return;
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

	// ---- Area setup & transitions ----

	function setupArea(now: number) {
		npcEnts = area.npcs
			.filter((n) => n.id !== state.characterId)
			.map((n) => ({
				id: n.id,
				x: n.x,
				y: n.y,
				facing: 'down' as Facing,
				homeX: n.x,
				homeY: n.y,
				wander: n.wander ?? 0,
				moveFrom: null,
				moveStartedAt: 0,
				nextThinkAt: now + 800 + Math.random() * 2400
			}));
		groundItems = [];
		critters = spawnCritters(area, now);
		const spawns = area.spawns ?? [];
		spawnClocks = spawns.map(() => now);
		// Pre-seed persistent pickups (e.g. seashells) so the area isn't bare on arrival.
		for (const def of spawns) {
			if (def.lifetimeMs === null) {
				for (let i = 0; i < Math.min(2, def.max); i++) spawnGroundItem(def, now);
			}
		}
	}

	function transitionTo(areaId: SaveState['areaId'], toX: number, toY: number) {
		state.areaId = areaId;
		state.playerX = toX;
		state.playerY = toY;
		if (areaId !== 'cottage') placeMode = null;
		setupArea(performance.now());
		sfxMove();
		if (!state.visitedAreas.includes(areaId)) {
			state.visitedAreas = [...state.visitedAreas, areaId];
			showBubble(areas[areaId].welcome, areas[areaId].accent, 4200);
		}
		state = state;
		persist();
	}

	// If a map redesign left a saved position inside a wall, walk a small spiral
	// outward until we find open ground.
	function ensureSafeSpawn() {
		const k = tileAt(area, state.playerX, state.playerY);
		const door = doorAt(area, state.playerX, state.playerY);
		if (k !== null && isWalkable(k) && (!door || !door.comingSoon)) return;
		for (let r = 1; r < Math.max(area.width, area.height); r++) {
			for (let y = state.playerY - r; y <= state.playerY + r; y++) {
				for (let x = state.playerX - r; x <= state.playerX + r; x++) {
					const t = tileAt(area, x, y);
					if (t !== null && isWalkable(t) && !doorAt(area, x, y) && !npcEntAt(x, y)) {
						state.playerX = x;
						state.playerY = y;
						state = state;
						return;
					}
				}
			}
		}
	}

	// ---- Ground items (wild tulips, seashells…) ----

	function groundItemAt(x: number, y: number): GroundItem | null {
		return groundItems.find((g) => g.x === x && g.y === y) ?? null;
	}

	function spawnGroundItem(def: GroundSpawnDef, now: number) {
		if (groundItems.filter((g) => g.itemId === def.itemId).length >= def.max) return;
		const candidates: { x: number; y: number }[] = [];
		for (let y = 0; y < area.height; y++) {
			for (let x = 0; x < area.width; x++) {
				const k = tileAt(area, x, y);
				if (k === null || !def.on.includes(k)) continue;
				if (doorAt(area, x, y) || plotAt(area, x, y)) continue;
				if (npcEntAt(x, y) || decorAt(x, y) || groundItemAt(x, y)) continue;
				if (x === state.playerX && y === state.playerY) continue;
				candidates.push({ x, y });
			}
		}
		if (candidates.length === 0) return;
		const pick = candidates[Math.floor(Math.random() * candidates.length)];
		const lifetimeMs = def.lifetimeMs === null ? null : def.lifetimeMs + Math.random() * 3000;
		groundItems = [...groundItems, { itemId: def.itemId, x: pick.x, y: pick.y, spawnedAt: now, lifetimeMs }];
	}

	const PICKUP_LINES: Partial<Record<ItemId, string>> = {
		tulip: '🌷 You grabbed a tulip!',
		shell: '🐚 A beautiful seashell!'
	};

	function pickGroundItem(g: GroundItem) {
		groundItems = groundItems.filter((it) => it !== g);
		state.inventory[g.itemId] += 1;
		state = state;
		sfxPop();
		showBubble(PICKUP_LINES[g.itemId] ?? `${ITEM_EMOJI[g.itemId]} Picked up!`, 'var(--rp-gold)');
		persist();
	}

	// ---- Cottage decorating ----

	function decorAt(x: number, y: number) {
		return (
			state.placedDecor.find((d) => d.areaId === state.areaId && d.x === x && d.y === y) ?? null
		);
	}

	function canPlaceAt(x: number, y: number): boolean {
		if (state.areaId !== 'cottage') return false;
		const k = tileAt(area, x, y);
		if (k !== 'wood-floor' && k !== 'rug') return false;
		if (decorAt(x, y)) return false;
		return true;
	}

	function firstAvailableItem(): ItemId | null {
		for (const id of ALL_ITEMS) {
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
			showBubble('Place on the floor or rug.', 'var(--rp-gold)', 1400);
			return;
		}
		const id = placeMode.itemId;
		if (state.inventory[id] <= 0) {
			showBubble(`No ${ITEM_NAME[id].toLowerCase()} left.`, 'var(--rp-gold)', 1400);
			return;
		}
		state.inventory[id] -= 1;
		state.placedDecor = [...state.placedDecor, { areaId: 'cottage', x, y, itemId: id }];
		state = state;
		sfxBlip();
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
		sfxPop();
		showBubble('Picked it up.', 'var(--rp-rose)', 1200);
		persist();
		return true;
	}

	// ---- Conversations & errands ----

	function oppositeFacing(f: Facing): Facing {
		switch (f) {
			case 'up':
				return 'down';
			case 'down':
				return 'up';
			case 'left':
				return 'right';
			case 'right':
				return 'left';
		}
	}

	function dialogueCtx(npcId: CharacterId, firstMeeting: boolean): DialogueContext {
		return {
			npc: npcId,
			playerId: state.characterId,
			playerName: character.name,
			areaId: state.areaId,
			hearts: state.friendship[npcId] ?? 0,
			inventory: state.inventory,
			activeQuest: state.activeQuests[npcId] ?? null,
			questsDone: state.questsDone,
			firstMeeting
		};
	}

	function pickQuestTemplate(npcId: CharacterId): QuestTemplate | null {
		const pool = questPool(npcId);
		if (pool.length === 0) return null;
		const activeItems = new Set(Object.values(state.activeQuests).map((q) => q.itemId));
		const fresh = pool.filter((t) => !activeItems.has(t.itemId));
		const pickFrom = fresh.length > 0 ? fresh : pool;
		return pickFrom[Math.floor(Math.random() * pickFrom.length)];
	}

	function acceptQuest(t: QuestTemplate) {
		state.activeQuests = {
			...state.activeQuests,
			[t.npc]: { id: t.id, npc: t.npc, itemId: t.itemId, count: t.count }
		};
		state = state;
		sfxBlip();
		showBubble(
			`📋 ${characters[t.npc].name} needs ${t.count}× ${ITEM_EMOJI[t.itemId]}`,
			characters[t.npc].accent,
			3600
		);
		persist();
	}

	function completeQuest(t: QuestTemplate) {
		state.inventory[t.itemId] = Math.max(0, state.inventory[t.itemId] - t.count);
		state.inventory[t.rewardItemId] += t.rewardCount;
		state.friendship = {
			...state.friendship,
			[t.npc]: Math.min(MAX_HEARTS, (state.friendship[t.npc] ?? 0) + 1)
		};
		delete state.activeQuests[t.npc];
		state.questsDone += 1;
		state = state;
		sfxFanfare();
		showBubble(
			`💖 +1 heart with ${characters[t.npc].name}! Got ${t.rewardCount}× ${ITEM_EMOJI[t.rewardItemId]}`,
			'var(--rp-love)',
			4200
		);
		persist();
	}

	function openDialogue(ent: NpcEnt) {
		ent.facing = oppositeFacing(state.facing);
		ent.nextThinkAt = performance.now() + 60_000; // stand still while chatting
		const npcId = ent.id;
		const hearts = state.friendship[npcId] ?? 0;
		const firstMeeting = hearts === 0;
		const aq = state.activeQuests[npcId] ?? null;
		const ctx = dialogueCtx(npcId, firstMeeting);

		let pages: string[];
		let onClose: () => void = () => {};

		if (aq) {
			const t = questById(aq.id);
			if (t && state.inventory[aq.itemId] >= aq.count) {
				pages = completePages(t, ctx);
				onClose = () => completeQuest(t);
			} else if (t) {
				pages = reminderPages(t, ctx);
			} else {
				// Template vanished in an update — drop the errand gracefully.
				delete state.activeQuests[npcId];
				state = state;
				pages = greetingPages(ctx);
			}
		} else {
			pages = greetingPages(ctx);
			if (firstMeeting) {
				state.friendship = { ...state.friendship, [npcId]: 1 };
				state = state;
				persist();
			} else if (Object.keys(state.activeQuests).length < MAX_ACTIVE_QUESTS) {
				const t = pickQuestTemplate(npcId);
				if (t) {
					pages = [...pages, ...t.offer];
					onClose = () => acceptQuest(t);
				}
			}
		}

		heldDirs.clear();
		lastDir = null;
		sfxBlip();
		dialogue = { speakerId: npcId, pages, onClose };
	}

	function closeDialogue() {
		if (!dialogue) return;
		const d = dialogue;
		const ent = npcEnts.find((e) => e.id === d.speakerId);
		if (ent) ent.nextThinkAt = performance.now() + 1200 + Math.random() * 1800;
		dialogue = null;
		d.onClose();
	}

	function computeMarks(): Partial<Record<CharacterId, NpcMark>> {
		const marks: Partial<Record<CharacterId, NpcMark>> = {};
		const totalActive = Object.keys(state.activeQuests).length;
		for (const ent of npcEnts) {
			const aq = state.activeQuests[ent.id];
			if (aq) {
				if (state.inventory[aq.itemId] >= aq.count) marks[ent.id] = 'ready';
			} else if ((state.friendship[ent.id] ?? 0) === 0 || totalActive < MAX_ACTIVE_QUESTS) {
				marks[ent.id] = 'quest';
			}
		}
		return marks;
	}

	// ---- Interactions ----

	function interact() {
		if (casting) return;
		if (dialogue) {
			panelRef?.advance();
			return;
		}

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

		const ground = groundItemAt(tx, ty);
		if (ground) {
			pickGroundItem(ground);
			return;
		}

		if (area.catchButterflies) {
			const b = butterflyAt(critters, tx, ty);
			if (b) {
				critters = critters.filter((c) => c !== b);
				state.inventory.butterfly += 1;
				state = state;
				sfxPop();
				showBubble('🦋 Caught a butterfly! So gentle.', 'var(--rp-iris)');
				persist();
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

		const ent = npcEntAt(tx, ty);
		if (ent) {
			openDialogue(ent);
			return;
		}

		const plot = plotAt(area, tx, ty);
		if (plot) {
			if (plot.kind === 'rose') {
				interactRose(plot.id);
				return;
			}
			if (plot.kind === 'lavender') {
				interactRegrowing(plot.id, 'lavender');
				return;
			}
			if (plot.kind === 'berry') {
				interactRegrowing(plot.id, 'berry');
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
		if (tile === 'oven') {
			bakeMuffin();
			return;
		}
		if (tile === 'bluebonnet') {
			showBubble("Mommy's bluebonnets are for looking, not picking.", 'var(--rp-foam)');
			return;
		}
		if (tile && TILE_FLAVOR[tile]) {
			showBubble(TILE_FLAVOR[tile] as string, 'var(--rp-rose)');
			return;
		}
	}

	function interactRose(plotId: string) {
		const ps = state.plots[plotId];
		if (!ps || ps.stage === 'empty') {
			state.plots[plotId] = plant(performance.now());
			state = state;
			sfxBlip();
			showBubble('🌱 A rose seed is planted.', 'var(--rp-love)');
			persist();
			return;
		}
		if (isHarvestable(ps, 'rose')) {
			state.inventory.rose += 1;
			delete state.plots[plotId];
			state = state;
			sfxPop();
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

	function interactRegrowing(plotId: string, kind: 'lavender' | 'berry') {
		const ps = state.plots[plotId];
		if (isHarvestable(ps, kind)) {
			state.inventory[kind === 'lavender' ? 'lavender' : 'berry'] += 1;
			state.plots[plotId] = pickRegrowing(performance.now());
			state = state;
			sfxPop();
			showBubble(
				kind === 'lavender' ? '💜 Picked some lavender!' : '🫐 Picked sweet berries!',
				kind === 'lavender' ? 'var(--rp-iris)' : 'var(--rp-foam)'
			);
			persist();
			return;
		}
		showBubble(
			kind === 'lavender' ? 'Lavender is regrowing...' : 'The berries are regrowing...',
			'var(--rp-iris)'
		);
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
			sfxBlip();
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
		sfxBlip();
		showBubble('🌱 Picked up a bluebonnet seed.', 'var(--rp-pine)');
		persist();
	}

	function bakeMuffin() {
		if (state.inventory.berry < 2) {
			showBubble('Bring 2 🫐 berries to bake a muffin!', 'var(--rp-gold)');
			return;
		}
		state.inventory.berry -= 2;
		state.inventory.muffin += 1;
		state = state;
		sfxCoin();
		showBubble('🧁 You baked a berry muffin!', 'var(--rp-rose)');
		persist();
	}

	function startCasting() {
		casting = { startedAt: performance.now() };
		showBubble('🎣 Casting...', 'var(--rp-foam)', CAST_MS + 200);
	}

	function finishCasting() {
		casting = null;
		state.inventory.fish += 1;
		state = state;
		sfxCoin();
		showBubble('🐟 Caught a fish!', 'var(--rp-foam)');
		persist();
	}

	function computeInteractHint(): string | null {
		if (dialogue) return null;
		if (casting) return '🎣 Casting...';

		const { dx, dy } = dirDelta(state.facing);
		const tx = state.playerX + dx;
		const ty = state.playerY + dy;

		if (placeMode) {
			if (decorAt(tx, ty)) return '▶ Pick up';
			if (canPlaceAt(tx, ty))
				return `▶ Place ${ITEM_EMOJI[placeMode.itemId]} ${ITEM_NAME[placeMode.itemId]}`;
			return '✗ Not here';
		}

		if (decorAt(tx, ty)) return '▶ Pick up';

		const ground = groundItemAt(tx, ty);
		if (ground) return `▶ Pick up ${ITEM_EMOJI[ground.itemId]}`;

		if (area.catchButterflies && butterflyAt(critters, tx, ty)) return '▶ Catch it!';

		const door = doorAt(area, tx, ty);
		if (door) return door.comingSoon ? `🚧 ${door.label}` : `▶ ${door.label}`;

		const ent = npcEntAt(tx, ty);
		if (ent) {
			const aq = state.activeQuests[ent.id];
			if (aq && state.inventory[aq.itemId] >= aq.count) return `▶ Give ${ITEM_EMOJI[aq.itemId]}`;
			return `▶ Talk to ${characters[ent.id].name}`;
		}

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
			if (plot.kind === 'berry') {
				if (isHarvestable(ps, 'berry')) return '▶ Pick berries';
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
		if (tile === 'oven') return state.inventory.berry >= 2 ? '▶ Bake a muffin!' : '▶ Oven (needs 2 🫐)';
		if (tile === 'bluebonnet') return '▶ Look (no picking)';
		if (tile && TILE_FLAVOR[tile]) return '▶ Look';

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
		if (!moveFrom) return { x: state.playerX, y: state.playerY, t: 0 };
		const t = Math.min(1, (performance.now() - moveStartedAt) / MOVE_MS);
		const x = moveFrom.x + (state.playerX - moveFrom.x) * t;
		const y = moveFrom.y + (state.playerY - moveFrom.y) * t;
		return { x, y, t };
	}

	function npcSpriteStates(now: number): CharacterSpriteState[] {
		return npcEnts.map((ent) => {
			if (!ent.moveFrom) {
				return { id: ent.id, x: ent.x, y: ent.y, facing: ent.facing, moving: false, walkT: 0 };
			}
			const t = Math.min(1, (now - ent.moveStartedAt) / NPC_MOVE_MS);
			return {
				id: ent.id,
				x: ent.moveFrom.x + (ent.x - ent.moveFrom.x) * t,
				y: ent.moveFrom.y + (ent.y - ent.moveFrom.y) * t,
				facing: ent.facing,
				moving: true,
				walkT: t
			};
		});
	}

	function thinkNpcs(now: number) {
		for (const ent of npcEnts) {
			if (ent.moveFrom && now - ent.moveStartedAt >= NPC_MOVE_MS) {
				ent.moveFrom = null;
			}
			if (dialogue?.speakerId === ent.id) continue;
			if (ent.moveFrom || now < ent.nextThinkAt) continue;
			ent.nextThinkAt = now + 1600 + Math.random() * 2800;
			if (ent.wander <= 0) {
				// Statues are sad: even rooted NPCs glance around sometimes.
				if (Math.random() < 0.5) ent.facing = FACINGS[Math.floor(Math.random() * 4)];
				continue;
			}
			const dir = FACINGS[Math.floor(Math.random() * 4)];
			ent.facing = dir;
			if (Math.random() < 0.35) continue; // just look around
			const { dx, dy } = dirDelta(dir);
			const tx = ent.x + dx;
			const ty = ent.y + dy;
			if (Math.abs(tx - ent.homeX) > ent.wander || Math.abs(ty - ent.homeY) > ent.wander) continue;
			if (npcCellBlocked(tx, ty, ent)) continue;
			ent.moveFrom = { x: ent.x, y: ent.y };
			ent.moveStartedAt = now;
			ent.x = tx;
			ent.y = ty;
		}
	}

	function persist() {
		writeSave(state);
	}

	function tick() {
		raf = requestAnimationFrame(tick);
		const now = performance.now();
		const dtMs = lastTickAt === 0 ? 16 : Math.min(100, now - lastTickAt);
		lastTickAt = now;

		if (moveFrom && now - moveStartedAt >= MOVE_MS) {
			moveFrom = null;
			const d = doorAt(area, state.playerX, state.playerY);
			if (d && !d.comingSoon) {
				transitionTo(d.toArea, d.toX, d.toY);
			}
		}

		if (!dialogue && !moveFrom && (lastDir || heldDirs.size > 0)) {
			const dir = lastDir && heldDirs.has(lastDir) ? lastDir : [...heldDirs][0];
			if (dir) tryStartMove(dir);
		}

		thinkNpcs(now);

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
			const next = advancePlot(cur, def.kind, now);
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

		// Ground-item spawners: expire stale pickups, spawn new on cadence.
		if (groundItems.some((g) => g.lifetimeMs !== null && now - g.spawnedAt >= g.lifetimeMs)) {
			groundItems = groundItems.filter(
				(g) => g.lifetimeMs === null || now - g.spawnedAt < g.lifetimeMs
			);
		}
		const spawns = area.spawns ?? [];
		for (let i = 0; i < spawns.length; i++) {
			if (now - (spawnClocks[i] ?? 0) >= spawns[i].everyMs) {
				spawnGroundItem(spawns[i], now);
				spawnClocks[i] = now;
			}
		}

		critters = updateCritters(critters, area, now, dtMs);

		if (bubble && now >= bubble.expiresAt) bubble = null;
		interactHint = computeInteractHint();

		if (ctx) {
			const pos = renderPosition();
			draw({
				ctx,
				area,
				plots: state.plots,
				player: {
					id: state.characterId,
					x: pos.x,
					y: pos.y,
					facing: state.facing,
					moving: !!moveFrom,
					walkT: pos.t
				},
				npcs: npcSpriteStates(now),
				npcMarks: dialogue ? {} : computeMarks(),
				placedDecor: state.placedDecor,
				placeCursor: placeCursor(),
				groundItems,
				critters,
				now
			});
		}
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.repeat) return;
		if (dialogue) {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				panelRef?.advance();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				closeDialogue();
			}
			return;
		}
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
			const id = ALL_ITEMS[idx];
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
		if (dialogue) return;
		heldDirs.add(d);
		lastDir = d;
	}
	function releaseDir(d: Facing) {
		heldDirs.delete(d);
		if (lastDir === d) lastDir = null;
	}

	function onActionButton() {
		if (dialogue) {
			panelRef?.advance();
			return;
		}
		interact();
	}

	onMount(() => {
		ctx = canvasEl.getContext('2d');
		if (ctx) ctx.imageSmoothingEnabled = false;

		setupArea(performance.now());
		ensureSafeSpawn();

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
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
		}
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
			{#if visibleItems.length === 0}
				<span class="inventory hint-chip">Explore & collect!</span>
			{:else}
				{#each visibleItems as id (id)}
					<span
						class="inventory"
						style="--chip-accent: {ITEM_ACCENT[id]};"
						title="{ITEM_NAME[id]}: {state.inventory[id]}"
					>
						{ITEM_EMOJI[id]}
						{state.inventory[id]}
					</span>
				{/each}
			{/if}
		</div>
	</header>

	{#if questChips.length > 0}
		<div class="quests" aria-label="Errands">
			{#each questChips as q (q.npc)}
				<span class="quest-chip" class:ready={q.ready} style="--chip-accent: {q.accent};">
					📋 {q.npc}: {q.emoji} {q.have}/{q.need}{q.ready ? ' ✓' : ''}
				</span>
			{/each}
		</div>
	{/if}

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
					{#each ALL_ITEMS as id, idx (id)}
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
							<span class="item-label">{ITEM_EMOJI[id]} {ITEM_NAME[id]}</span>
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

		{#if dialogue}
			<DialoguePanel
				bind:this={panelRef}
				speakerId={dialogue.speakerId}
				hearts={state.friendship[dialogue.speakerId] ?? 0}
				pages={dialogue.pages}
				onDone={closeDialogue}
			/>
		{:else if bubble}
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
		<button class="action" type="button" on:click={onActionButton}>A</button>
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
		max-width: 45%;
	}

	.inventory {
		font-family: 'VT323', monospace;
		font-size: 1.25rem;
		color: var(--rp-text);
		background: var(--rp-surface);
		padding: 0.05rem 0.5rem;
		border: 2px solid var(--chip-accent, var(--rp-muted));
		box-shadow: 0 0 8px var(--chip-accent, transparent);
		white-space: nowrap;
	}

	.inventory.hint-chip {
		border-color: var(--rp-muted);
		color: var(--rp-subtle);
		box-shadow: none;
		font-size: 1.05rem;
	}

	.quests {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.35rem;
		width: 100%;
		max-width: 720px;
	}

	.quest-chip {
		font-family: 'VT323', monospace;
		font-size: 1.05rem;
		color: var(--rp-text);
		background: var(--rp-surface);
		border: 2px solid var(--chip-accent);
		padding: 0.05rem 0.55rem;
		opacity: 0.92;
		white-space: nowrap;
	}

	.quest-chip.ready {
		box-shadow: 0 0 10px var(--chip-accent);
		animation: ready-pulse 1.2s ease-in-out infinite;
	}

	@keyframes ready-pulse {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
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
		justify-content: center;
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
		max-height: 62vh;
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
