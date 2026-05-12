import type { AreaDef, AreaId, TileKind } from './types';

const T: TileKind = 'tree';
const G: TileKind = 'grass';
const P: TileKind = 'path';
const F: TileKind = 'flower-bed';
const S: TileKind = 'stone';
const A: TileKind = 'water';
const R: TileKind = 'rose-plot';

// Each row is left-to-right; rows top-to-bottom.
function grid(rows: TileKind[][]): TileKind[] {
	return rows.flat();
}

const courtyard: AreaDef = {
	id: 'courtyard',
	name: 'Castle Courtyard',
	accent: 'var(--rp-gold)',
	width: 16,
	height: 11,
	tiles: grid([
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T, T, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, P, S, S, P, G, G, G, G, G, G, T],
		[T, G, G, G, G, S, A, A, S, G, G, G, G, G, G, P],
		[P, G, G, G, G, S, A, A, S, G, G, G, G, G, G, T],
		[T, G, G, G, G, P, S, S, P, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T, T, T]
	]),
	doors: [
		{ x: 7, y: 0, toArea: 'rose-garden', toX: 7, toY: 8, label: "Jane's Rose Garden" },
		{ x: 0, y: 5, toArea: 'lavender-meadow', toX: 0, toY: 0, label: "Isla's Lavender Meadow", comingSoon: true },
		{ x: 15, y: 4, toArea: 'pond', toX: 0, toY: 0, label: "Ollie's Pond", comingSoon: true },
		{ x: 7, y: 10, toArea: 'cottage', toX: 0, toY: 0, label: 'Your Cottage', comingSoon: true }
	],
	plots: [],
	npcs: [
		{ id: 'jane', x: 11, y: 2 },
		{ id: 'isla', x: 2, y: 3 },
		{ id: 'ollie', x: 12, y: 8 }
	],
	welcome: 'Hello, neighbor. Welcome to the Kingdom.'
};

const roseGarden: AreaDef = {
	id: 'rose-garden',
	name: "Jane's Rose Garden",
	accent: 'var(--rp-love)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, R, G, G, R, G, G, R, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, R, G, G, R, G, G, R, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, F, G, G, G, G, G, G, G, G, G, F, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, P, G, G, G, G, G, T],
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T]
	]),
	doors: [{ x: 7, y: 9, toArea: 'courtyard', toX: 7, toY: 1, label: 'Castle Courtyard' }],
	plots: [
		{ id: 'rose-1', x: 2, y: 2, kind: 'rose' },
		{ id: 'rose-2', x: 5, y: 2, kind: 'rose' },
		{ id: 'rose-3', x: 8, y: 2, kind: 'rose' },
		{ id: 'rose-4', x: 2, y: 4, kind: 'rose' },
		{ id: 'rose-5', x: 5, y: 4, kind: 'rose' },
		{ id: 'rose-6', x: 8, y: 4, kind: 'rose' }
	],
	npcs: [{ id: 'jane', x: 11, y: 6 }],
	welcome: 'Press SPACE on a plot to plant a rose. Wait. Press SPACE again to harvest.'
};

export const areas: Record<AreaId, AreaDef> = {
	courtyard,
	'rose-garden': roseGarden,
	'lavender-meadow': courtyard,
	pond: courtyard,
	cottage: courtyard
};

export function getArea(id: AreaId): AreaDef {
	return areas[id];
}

export function tileAt(area: AreaDef, x: number, y: number): TileKind | null {
	if (x < 0 || y < 0 || x >= area.width || y >= area.height) return null;
	return area.tiles[y * area.width + x];
}

export function doorAt(area: AreaDef, x: number, y: number) {
	return area.doors.find((d) => d.x === x && d.y === y) ?? null;
}

export function plotAt(area: AreaDef, x: number, y: number) {
	return area.plots.find((p) => p.x === x && p.y === y) ?? null;
}

export function npcAt(area: AreaDef, x: number, y: number) {
	return area.npcs.find((n) => n.x === x && n.y === y) ?? null;
}
