import type { AreaDef, AreaId, PlotDef, TileKind } from './types';

// --- Single-letter tile aliases keep the grids below readable. ---
const T: TileKind = 'tree';
const G: TileKind = 'grass';
const P: TileKind = 'path';
const F: TileKind = 'flower-bed';
const S: TileKind = 'stone';
const A: TileKind = 'water';
const R: TileKind = 'rose-plot';
const L: TileKind = 'lavender';
const N: TileKind = 'bluebonnet';
const K: TileKind = 'seed-bin';
const D: TileKind = 'sand';
const W: TileKind = 'wall';
const O: TileKind = 'wood-floor';
const B: TileKind = 'bed';
const H: TileKind = 'hearth';
const I: TileKind = 'window';
const E: TileKind = 'fence';
const C: TileKind = 'dock';
const M: TileKind = 'palm';
const X: TileKind = 'sandcastle';
const U: TileKind = 'dune-grass';
const Y: TileKind = 'berry-bush';
const V: TileKind = 'oven';
const Q: TileKind = 'counter';
const J: TileKind = 'table';
const Z: TileKind = 'rug';
const b: TileKind = 'bookshelf'; // lowercase: uppercase B is taken by 'bed'

// Each row is left-to-right; rows top-to-bottom.
// Throws on ragged rows so a miscounted tile fails loudly at module load.
function grid(rows: TileKind[][]): TileKind[] {
	const width = rows[0]?.length ?? 0;
	for (let i = 0; i < rows.length; i++) {
		if (rows[i].length !== width) {
			throw new Error(`grid(): row ${i} has ${rows[i].length} tiles, expected ${width}`);
		}
	}
	return rows.flat();
}

// The hub plaza: fountain in the middle, paths radiating to every door.
const courtyard: AreaDef = {
	id: 'courtyard',
	name: 'Castle Courtyard',
	accent: 'var(--rp-gold)',
	width: 18,
	height: 12,
	tiles: grid([
		[T, T, T, T, T, T, T, T, P, T, T, T, T, T, T, T, T, T],
		[T, G, F, G, G, G, G, G, P, G, G, G, G, G, F, G, G, T],
		[P, P, P, P, P, P, P, P, P, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, P, P, P, P, P, P, G, G, G, G, G, T],
		[T, G, E, F, G, G, P, S, S, S, S, P, G, G, F, E, G, T],
		[P, P, P, P, P, P, P, S, A, A, S, P, P, P, P, P, P, P],
		[T, G, E, F, G, G, P, S, A, A, S, P, G, G, F, E, G, T],
		[T, G, G, G, G, G, P, S, S, S, S, P, G, G, G, G, G, T],
		[T, G, G, G, G, G, P, P, P, P, P, P, P, P, P, P, P, P],
		[T, G, F, G, G, G, G, P, G, G, P, G, G, G, F, G, G, T],
		[T, G, G, G, G, G, G, P, G, G, P, G, G, G, G, G, G, T],
		[T, T, T, T, T, T, T, P, T, T, P, T, T, T, T, T, T, T]
	]),
	doors: [
		{ x: 8, y: 0, toArea: 'rose-garden', toX: 7, toY: 8, label: "Jane's Rose Garden" },
		{
			x: 0,
			y: 2,
			toArea: 'bluebonnet-garden',
			toX: 12,
			toY: 5,
			label: "Mommy's Bluebonnet Garden"
		},
		{ x: 0, y: 5, toArea: 'lavender-meadow', toX: 12, toY: 5, label: "Isla's Lavender Meadow" },
		{ x: 17, y: 5, toArea: 'pond', toX: 1, toY: 4, label: "Ollie's Pond" },
		{ x: 17, y: 8, toArea: 'tulip-garden', toX: 1, toY: 5, label: "Daddy's Tulip Garden" },
		{ x: 7, y: 11, toArea: 'cottage', toX: 4, toY: 1, label: 'Your Cottage' },
		{ x: 10, y: 11, toArea: 'bakery', toX: 5, toY: 7, label: 'Sweet Bakery' }
	],
	plots: [],
	npcs: [
		{ id: 'mommy', x: 4, y: 1, wander: 2 },
		{ id: 'ollie', x: 12, y: 2, wander: 3 },
		{ id: 'jane', x: 10, y: 3, wander: 2 },
		{ id: 'isla', x: 4, y: 8, wander: 2 },
		{ id: 'daddy', x: 13, y: 7, wander: 2 }
	],
	welcome: 'Welcome to the Kingdom! Follow the paths to visit all your friends.',
	critters: ['butterfly', 'bird']
};

const roseGarden: AreaDef = {
	id: 'rose-garden',
	name: "Jane's Rose Garden",
	accent: 'var(--rp-love)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T],
		[T, G, G, G, G, G, G, P, G, G, G, F, G, T],
		[T, G, R, G, G, R, G, P, R, G, G, G, G, T],
		[T, G, G, G, G, G, G, P, G, G, G, G, G, T],
		[T, G, R, G, G, R, G, P, R, G, G, F, G, T],
		[T, G, G, G, G, G, G, P, G, G, G, G, G, T],
		[T, F, G, G, G, G, G, P, G, E, F, E, G, T],
		[T, G, G, G, G, G, G, P, G, E, F, E, G, T],
		[T, G, G, G, G, G, G, P, G, G, G, G, G, T],
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T]
	]),
	doors: [
		{ x: 7, y: 9, toArea: 'courtyard', toX: 8, toY: 1, label: 'Castle Courtyard' },
		{ x: 7, y: 0, toArea: 'berry-woods', toX: 7, toY: 8, label: 'Berry Woods' }
	],
	plots: [
		{ id: 'rose-1', x: 2, y: 2, kind: 'rose' },
		{ id: 'rose-2', x: 5, y: 2, kind: 'rose' },
		{ id: 'rose-3', x: 8, y: 2, kind: 'rose' },
		{ id: 'rose-4', x: 2, y: 4, kind: 'rose' },
		{ id: 'rose-5', x: 5, y: 4, kind: 'rose' },
		{ id: 'rose-6', x: 8, y: 4, kind: 'rose' }
	],
	npcs: [{ id: 'jane', x: 10, y: 3, wander: 2 }],
	welcome: 'Press SPACE on a plot to plant a rose. Wait. Press SPACE again to harvest.',
	critters: ['petal', 'butterfly']
};

const lavenderMeadow: AreaDef = {
	id: 'lavender-meadow',
	name: "Isla's Lavender Meadow",
	accent: 'var(--rp-iris)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, G, G, G, G, G, G, G, G, G, G, F, G, T],
		[T, G, L, G, G, L, G, G, L, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, L, G, G, L, G, G, L, G, G, F, G, T],
		[T, G, G, G, G, G, G, G, G, P, P, P, P, P],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, E, F, F, E, G, G, E, F, F, E, G, T],
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
	npcs: [{ id: 'isla', x: 7, y: 6, wander: 2 }],
	welcome: 'Walk up to a lavender bush and press SPACE to pick it. It will regrow.',
	critters: ['bee', 'butterfly']
};

const pond: AreaDef = {
	id: 'pond',
	name: "Ollie's Pond",
	accent: 'var(--rp-foam)',
	width: 14,
	height: 11,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, G, G, G, U, G, G, G, G, G, G, F, G, T],
		[T, G, G, D, D, D, D, D, D, G, G, G, G, T],
		[T, G, D, D, A, A, A, A, D, D, G, G, U, T],
		[P, G, D, A, A, A, A, A, A, D, G, G, G, T],
		[T, G, D, A, A, C, A, A, A, D, G, F, G, T],
		[T, G, D, D, A, C, A, A, D, D, G, G, G, T],
		[T, G, G, D, D, C, D, D, D, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, U, G, T],
		[T, G, G, G, G, G, G, P, G, G, G, G, G, T],
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T]
	]),
	doors: [
		{ x: 0, y: 4, toArea: 'courtyard', toX: 16, toY: 5, label: 'Castle Courtyard' },
		{ x: 7, y: 10, toArea: 'beach', toX: 7, toY: 1, label: 'Beach Cove' }
	],
	plots: [],
	npcs: [{ id: 'ollie', x: 10, y: 7, wander: 2 }],
	welcome: 'Face the water and press SPACE to cast. The dock is the best fishing spot!',
	critters: ['dragonfly']
};

const bluebonnetGarden: AreaDef = {
	id: 'bluebonnet-garden',
	name: "Mommy's Bluebonnet Garden",
	accent: 'var(--rp-foam)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, N, G, N, G, G, N, G, G, N, G, N, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, R, G, R, G, G, R, G, R, G, G, K, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, E, T],
		[T, G, G, G, G, G, G, G, G, G, P, P, P, P],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, R, G, R, G, G, R, G, R, G, G, G, T],
		[T, N, G, G, G, G, N, G, G, N, G, N, G, T],
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T]
	]),
	doors: [{ x: 13, y: 5, toArea: 'courtyard', toX: 1, toY: 2, label: 'Castle Courtyard' }],
	plots: [
		{ id: 'bluebonnet-1', x: 2, y: 3, kind: 'bluebonnet' },
		{ id: 'bluebonnet-2', x: 4, y: 3, kind: 'bluebonnet' },
		{ id: 'bluebonnet-3', x: 7, y: 3, kind: 'bluebonnet' },
		{ id: 'bluebonnet-4', x: 9, y: 3, kind: 'bluebonnet' },
		{ id: 'bluebonnet-5', x: 2, y: 7, kind: 'bluebonnet' },
		{ id: 'bluebonnet-6', x: 4, y: 7, kind: 'bluebonnet' },
		{ id: 'bluebonnet-7', x: 7, y: 7, kind: 'bluebonnet' },
		{ id: 'bluebonnet-8', x: 9, y: 7, kind: 'bluebonnet' }
	],
	npcs: [{ id: 'mommy', x: 6, y: 5, wander: 2 }],
	welcome: 'Grab seeds from the bin, then plant them. No picking the bluebonnets!',
	critters: ['butterfly', 'bee']
};

const tulipGarden: AreaDef = {
	id: 'tulip-garden',
	name: "Daddy's Tulip Garden",
	accent: 'var(--rp-gold)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, G, G, G, F, G, G, G, G, G, E, F, E, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[P, P, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, G, F, G, G, G, G, G, G, F, G, G, G, T],
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T]
	]),
	doors: [{ x: 0, y: 5, toArea: 'courtyard', toX: 16, toY: 8, label: 'Castle Courtyard' }],
	plots: [],
	npcs: [{ id: 'daddy', x: 7, y: 5, wander: 2 }],
	welcome: 'Tulips pop up around the garden — grab them fast before they vanish!',
	critters: ['butterfly', 'bird'],
	spawns: [{ itemId: 'tulip', everyMs: 1800, max: 4, lifetimeMs: 8000, on: ['grass'] }]
};

const cottage: AreaDef = {
	id: 'cottage',
	name: 'Your Cottage',
	accent: 'var(--rp-rose)',
	width: 12,
	height: 9,
	tiles: grid([
		[W, W, I, W, P, W, W, I, W, W, W, W],
		[W, B, O, O, O, O, O, O, O, O, b, W],
		[W, B, O, O, O, O, O, O, O, O, O, W],
		[W, O, O, O, Z, Z, Z, O, O, O, O, W],
		[W, O, O, O, Z, Z, Z, O, O, J, O, W],
		[W, O, O, O, O, O, O, O, O, O, O, W],
		[W, O, O, O, O, O, O, O, O, O, O, W],
		[W, O, O, O, O, H, O, O, O, O, O, W],
		[W, W, W, W, W, W, W, W, W, W, W, W]
	]),
	doors: [{ x: 4, y: 0, toArea: 'courtyard', toX: 7, toY: 10, label: 'Castle Courtyard' }],
	plots: [],
	npcs: [],
	welcome: 'Home sweet home. Press P to decorate.'
};

// Sunny cove south of the pond: shells wash up on the sand, a dock juts into the sea.
const beach: AreaDef = {
	id: 'beach',
	name: 'Beach Cove',
	accent: 'var(--rp-gold)',
	width: 16,
	height: 11,
	tiles: grid([
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T, T, T],
		[T, G, G, U, G, G, G, P, G, G, U, G, G, U, G, T],
		[T, G, U, G, G, M, G, P, G, G, G, U, G, G, G, T],
		[T, D, D, D, D, D, D, D, D, D, D, D, D, U, D, T],
		[T, D, D, M, D, D, D, D, D, D, D, X, D, D, D, T],
		[T, D, D, D, D, D, D, D, D, D, D, D, D, D, M, T],
		[T, D, D, D, D, U, D, D, D, D, D, D, D, D, D, T],
		[T, D, D, D, D, D, D, D, D, D, D, D, D, D, D, T],
		[A, A, A, A, A, A, A, A, C, A, A, A, A, A, A, A],
		[A, A, A, A, A, A, A, A, C, A, A, A, A, A, A, A],
		[A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A]
	]),
	doors: [{ x: 7, y: 0, toArea: 'pond', toX: 7, toY: 9, label: "Ollie's Pond" }],
	plots: [],
	npcs: [
		{ id: 'ollie', x: 4, y: 5, wander: 3 },
		{ id: 'isla', x: 12, y: 4, wander: 1 }
	],
	welcome: 'Seashells wash up on the sand — press SPACE to collect them!',
	critters: ['bird'],
	spawns: [{ itemId: 'shell', everyMs: 2600, max: 5, lifetimeMs: null, on: ['sand'] }]
};

// Shady woods north of the rose garden: berry bushes in the clearings,
// and butterflies kids can actually catch.
const berryWoods: AreaDef = {
	id: 'berry-woods',
	name: 'Berry Woods',
	accent: 'var(--rp-pine)',
	width: 14,
	height: 10,
	tiles: grid([
		[T, T, T, T, T, T, T, T, T, T, T, T, T, T],
		[T, T, G, G, G, G, G, G, G, G, G, T, T, T],
		[T, G, G, Y, G, Y, G, G, Y, G, Y, G, T, T],
		[T, G, G, G, G, G, G, G, G, G, G, G, G, T],
		[T, T, G, Y, G, T, G, P, G, T, Y, G, T, T],
		[T, T, G, G, G, G, P, P, G, G, G, G, T, T],
		[T, G, G, Y, G, G, P, G, G, Y, G, G, G, T],
		[T, G, G, G, G, G, P, P, P, G, G, T, T, T],
		[T, T, G, G, G, G, G, P, G, G, G, T, T, T],
		[T, T, T, T, T, T, T, P, T, T, T, T, T, T]
	]),
	doors: [{ x: 7, y: 9, toArea: 'rose-garden', toX: 7, toY: 1, label: "Jane's Rose Garden" }],
	plots: [
		{ id: 'berry-1', x: 3, y: 2, kind: 'berry' },
		{ id: 'berry-2', x: 5, y: 2, kind: 'berry' },
		{ id: 'berry-3', x: 8, y: 2, kind: 'berry' },
		{ id: 'berry-4', x: 10, y: 2, kind: 'berry' },
		{ id: 'berry-5', x: 3, y: 4, kind: 'berry' },
		{ id: 'berry-6', x: 10, y: 4, kind: 'berry' },
		{ id: 'berry-7', x: 3, y: 6, kind: 'berry' },
		{ id: 'berry-8', x: 9, y: 6, kind: 'berry' }
	],
	npcs: [{ id: 'jane', x: 4, y: 7, wander: 2 }],
	welcome: 'Pick berries from the bushes — and try catching a butterfly!',
	critters: ['butterfly'],
	catchButterflies: true
};

// Cozy interior off the courtyard plaza: bring berries to the oven for muffins.
const bakery: AreaDef = {
	id: 'bakery',
	name: 'Sweet Bakery',
	accent: 'var(--rp-rose)',
	width: 12,
	height: 9,
	tiles: grid([
		[W, W, I, W, W, W, W, W, I, W, W, W],
		[W, O, O, O, V, V, O, O, O, O, O, W],
		[W, O, O, O, O, O, O, O, O, O, O, W],
		[W, O, Q, Q, Q, Q, O, O, O, O, O, W],
		[I, O, O, O, O, O, O, O, O, O, O, I],
		[W, O, O, O, O, O, Z, Z, Z, O, O, W],
		[W, O, O, O, O, O, Z, J, Z, O, O, W],
		[W, O, O, O, O, O, O, O, O, O, O, W],
		[W, W, W, W, W, P, W, W, W, W, W, W]
	]),
	doors: [{ x: 5, y: 8, toArea: 'courtyard', toX: 10, toY: 10, label: 'Castle Courtyard' }],
	plots: [],
	npcs: [{ id: 'mommy', x: 7, y: 2, wander: 1 }],
	welcome: 'Mommy bakes here! Bring 2 berries to the oven to make a muffin.'
};

export const areas: Record<AreaId, AreaDef> = {
	courtyard,
	'rose-garden': roseGarden,
	'lavender-meadow': lavenderMeadow,
	'bluebonnet-garden': bluebonnetGarden,
	'tulip-garden': tulipGarden,
	pond,
	cottage,
	beach,
	'berry-woods': berryWoods,
	bakery
};

// A miscounted grid row corrupts every tile after it, so verify the dimension
// math for every area as soon as this module loads. Cheap (a few comparisons)
// and it protects all future map edits.
function assertAreaIntegrity(all: Record<AreaId, AreaDef>): void {
	for (const area of Object.values(all)) {
		const expected = area.width * area.height;
		if (area.tiles.length !== expected) {
			throw new Error(
				`Area "${area.id}": tiles.length is ${area.tiles.length}, expected ${expected} (${area.width}x${area.height})`
			);
		}
	}
}
assertAreaIntegrity(areas);

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
