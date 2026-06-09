import type { CharacterId } from '$lib/characters';

export type AreaId =
	| 'courtyard'
	| 'rose-garden'
	| 'lavender-meadow'
	| 'pond'
	| 'cottage'
	| 'bluebonnet-garden'
	| 'tulip-garden'
	| 'beach'
	| 'berry-woods'
	| 'bakery';

export type TileKind =
	| 'grass'
	| 'path'
	| 'sand'
	| 'water'
	| 'wall'
	| 'flower-bed'
	| 'lavender'
	| 'bluebonnet'
	| 'tree'
	| 'stone'
	| 'rose-plot'
	| 'seed-bin'
	| 'wood-floor'
	| 'bed'
	| 'hearth'
	| 'window'
	| 'fence'
	| 'dock'
	| 'palm'
	| 'sandcastle'
	| 'dune-grass'
	| 'berry-bush'
	| 'oven'
	| 'counter'
	| 'table'
	| 'rug'
	| 'bookshelf';

export type Facing = 'up' | 'down' | 'left' | 'right';

export type PlotKind = 'rose' | 'lavender' | 'bluebonnet' | 'berry';

export interface PlotDef {
	id: string;
	x: number;
	y: number;
	kind: PlotKind;
}

export interface DoorDef {
	x: number;
	y: number;
	toArea: AreaId;
	toX: number;
	toY: number;
	label: string;
	comingSoon?: boolean;
}

export interface NpcDef {
	id: CharacterId;
	x: number;
	y: number;
	/** Max tiles the NPC may wander from home. Omit/0 = stands still. */
	wander?: number;
}

export type CritterKind = 'butterfly' | 'bee' | 'petal' | 'dragonfly' | 'bird';

/** Ambient creature, simulated per-session (never persisted). Coords are tile-space floats. */
export interface Critter {
	kind: CritterKind;
	x: number;
	y: number;
	vx: number;
	vy: number;
	/** Free-running animation phase offset so critters don't move in lockstep. */
	phase: number;
	spawnedAt: number;
}

/** Item lying on the ground waiting to be picked up (wild tulips, seashells…). */
export interface GroundItem {
	itemId: ItemId;
	x: number;
	y: number;
	spawnedAt: number;
	/** null = stays until picked; otherwise despawns after this long. */
	lifetimeMs: number | null;
}

/** Per-area spawner config for ground items. */
export interface GroundSpawnDef {
	itemId: ItemId;
	everyMs: number;
	max: number;
	lifetimeMs: number | null;
	/** Tile kinds the item may appear on. */
	on: TileKind[];
}

export interface AreaDef {
	id: AreaId;
	name: string;
	accent: string;
	width: number;
	height: number;
	tiles: TileKind[];
	doors: DoorDef[];
	plots: PlotDef[];
	npcs: NpcDef[];
	welcome: string;
	/** Ambient critter kinds that live here (spawn/behavior in critters.ts). */
	critters?: CritterKind[];
	/** Ground-item spawners (replaces the old hardcoded wild-tulip logic). */
	spawns?: GroundSpawnDef[];
	/** Butterflies here can be caught with SPACE (Berry Woods). */
	catchButterflies?: boolean;
}

export type PlotStage = 'empty' | 'seeded' | 'sprout' | 'bloomed' | 'regrowing';

export interface PlotState {
	stage: PlotStage;
	stageStartedAt: number;
}

export type ItemId =
	| 'rose'
	| 'lavender'
	| 'fish'
	| 'tulip'
	| 'seed'
	| 'berry'
	| 'shell'
	| 'butterfly'
	| 'muffin';

export const ALL_ITEMS: ItemId[] = [
	'rose',
	'lavender',
	'fish',
	'tulip',
	'seed',
	'berry',
	'shell',
	'butterfly',
	'muffin'
];

export type Inventory = Record<ItemId, number>;

export interface PlacedDecor {
	areaId: AreaId;
	x: number;
	y: number;
	itemId: ItemId;
}

/** A fetch errand an NPC has asked the player to run. */
export interface ActiveQuest {
	/** QuestTemplate id from dialogue.ts. */
	id: string;
	npc: CharacterId;
	itemId: ItemId;
	count: number;
}

export const MAX_HEARTS = 5;

export interface SaveState {
	version: 2;
	characterId: CharacterId;
	areaId: AreaId;
	playerX: number;
	playerY: number;
	facing: Facing;
	inventory: Inventory;
	plots: Record<string, PlotState>;
	visitedAreas: AreaId[];
	placedDecor: PlacedDecor[];
	/** Friendship hearts per character, 0..MAX_HEARTS. */
	friendship: Record<CharacterId, number>;
	/** At most one active errand per NPC. */
	activeQuests: Partial<Record<CharacterId, ActiveQuest>>;
	questsDone: number;
}

export const SAVE_KEY = 'tots:kingdom:save:v1';

export function emptyInventory(): Inventory {
	const inv = {} as Inventory;
	for (const id of ALL_ITEMS) inv[id] = 0;
	return inv;
}

export function emptyFriendship(): Record<CharacterId, number> {
	return { jane: 0, isla: 0, ollie: 0, mommy: 0, daddy: 0 };
}

export function isWalkable(kind: TileKind): boolean {
	switch (kind) {
		case 'grass':
		case 'path':
		case 'sand':
		case 'wood-floor':
		case 'dock':
		case 'dune-grass':
		case 'rug':
			return true;
		default:
			return false;
	}
}
