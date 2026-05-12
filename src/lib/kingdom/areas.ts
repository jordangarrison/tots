import type { AreaDef, AreaId, PlotDef, TileKind } from './types';

const T: TileKind = 'tree';
const G: TileKind = 'grass';
const P: TileKind = 'path';
const F: TileKind = 'flower-bed';
const S: TileKind = 'stone';
const A: TileKind = 'water';
const R: TileKind = 'rose-plot';
const L: TileKind = 'lavender';
const D: TileKind = 'sand';
const W: TileKind = 'wall';
const O: TileKind = 'wood-floor';
const B: TileKind = 'bed';
const H: TileKind = 'hearth';
const I: TileKind = 'window';

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
		{ x: 0, y: 5, toArea: 'lavender-meadow', toX: 12, toY: 5, label: "Isla's Lavender Meadow" },
		{ x: 15, y: 4, toArea: 'pond', toX: 1, toY: 4, label: "Ollie's Pond" },
		{ x: 7, y: 10, toArea: 'cottage', toX: 4, toY: 1, label: 'Your Cottage' }
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

const lavenderMeadow: AreaDef = {
	id: 'lavender-meadow',
	name: "Isla's Lavender Meadow",
	accent: 'var(--rp-iris)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, L, G, G, L, G, G, L, G, G, G, F, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, L, G, G, L, G, G, L, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, P],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, F, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T]
	]),
	doors: [{ x: 13, y: 5, toArea: 'courtyard', toX: 1, toY: 5, label: 'Castle Courtyard' }],
	plots: [
		{ id: 'lavender-1', x: 2, y: 2, kind: 'lavender' },
		{ id: 'lavender-2', x: 5, y: 2, kind: 'lavender' },
		{ id: 'lavender-3', x: 8, y: 2, kind: 'lavender' },
		{ id: 'lavender-4', x: 2, y: 4, kind: 'lavender' },
		{ id: 'lavender-5', x: 5, y: 4, kind: 'lavender' },
		{ id: 'lavender-6', x: 8, y: 4, kind: 'lavender' }
	],
	npcs: [{ id: 'isla', x: 7, y: 6 }],
	welcome: 'Walk up to a lavender bush and press SPACE to pick it. It will regrow.'
};

const pond: AreaDef = {
	id: 'pond',
	name: "Ollie's Pond",
	accent: 'var(--rp-foam)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, D, D, D, D, D, D, G, G, G, G, T],
		[T, G, D, D, A, A, A, A, D, D, G, G, G, T],
		[P, G, D, A, A, A, A, A, A, D, G, G, G, T],
		[T, G, D, A, A, A, A, A, A, D, G, G, G, T],
		[T, G, D, D, A, A, A, A, D, D, G, G, G, T],
		[T, G, G, D, D, D, D, D, D, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T]
	]),
	doors: [{ x: 0, y: 4, toArea: 'courtyard', toX: 14, toY: 4, label: 'Castle Courtyard' }],
	plots: [],
	npcs: [{ id: 'ollie', x: 11, y: 7 }],
	welcome: 'Face the water and press SPACE to cast. Wait for a bite!'
};

const cottage: AreaDef = {
	id: 'cottage',
	name: 'Your Cottage',
	accent: 'var(--rp-rose)',
	width: 10,
	height: 8,
	tiles: grid([
		[W, W, W, W, P, W, W, W, W, W],
		[W, B, O, O, O, O, O, O, I, W],
		[W, B, O, O, O, O, O, O, O, W],
		[W, O, O, O, O, O, O, O, O, W],
		[W, O, O, O, O, O, O, O, O, W],
		[W, O, O, O, O, O, O, O, O, W],
		[W, O, O, O, O, H, O, O, O, W],
		[W, W, W, W, W, W, W, W, W, W]
	]),
	doors: [{ x: 4, y: 0, toArea: 'courtyard', toX: 7, toY: 9, label: 'Castle Courtyard' }],
	plots: [],
	npcs: [],
	welcome: 'Home sweet home. Press P to decorate.'
};

export const areas: Record<AreaId, AreaDef> = {
	courtyard,
	'rose-garden': roseGarden,
	'lavender-meadow': lavenderMeadow,
	pond,
	cottage
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

export function findPlotDef(id: string): PlotDef | null {
	for (const area of Object.values(areas)) {
		const found = area.plots.find((p) => p.id === id);
		if (found) return found;
	}
	return null;
}
