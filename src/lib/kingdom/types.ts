import type { CharacterId } from '$lib/characters';

export type AreaId = 'courtyard' | 'rose-garden' | 'lavender-meadow' | 'pond' | 'cottage';

export type TileKind =
	| 'grass'
	| 'path'
	| 'sand'
	| 'water'
	| 'wall'
	| 'flower-bed'
	| 'lavender'
	| 'tree'
	| 'stone'
	| 'rose-plot'
	| 'wood-floor'
	| 'bed'
	| 'hearth'
	| 'window';

export type Facing = 'up' | 'down' | 'left' | 'right';

export type PlotKind = 'rose' | 'lavender';

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
}

export type PlotStage = 'empty' | 'seeded' | 'sprout' | 'bloomed' | 'regrowing';

export interface PlotState {
	stage: PlotStage;
	stageStartedAt: number;
}

export type ItemId = 'rose' | 'lavender' | 'fish';

export interface Inventory {
	rose: number;
	lavender: number;
	fish: number;
}

export interface PlacedDecor {
	areaId: AreaId;
	x: number;
	y: number;
	itemId: ItemId;
}

export interface SaveState {
	version: 1;
	characterId: CharacterId;
	areaId: AreaId;
	playerX: number;
	playerY: number;
	facing: Facing;
	inventory: Inventory;
	plots: Record<string, PlotState>;
	visitedAreas: AreaId[];
	placedDecor: PlacedDecor[];
}

export const SAVE_KEY = 'tots:kingdom:save:v1';

export function emptyInventory(): Inventory {
	return { rose: 0, lavender: 0, fish: 0 };
}

export function isWalkable(kind: TileKind): boolean {
	switch (kind) {
		case 'grass':
		case 'path':
		case 'sand':
		case 'wood-floor':
			return true;
		default:
			return false;
	}
}
