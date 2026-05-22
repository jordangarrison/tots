import type { CharacterId } from '$lib/characters';
import type { Enemy, EnemyKind, GameState, Rock, TileKind } from './types';
import { GRID_H, GRID_W, SKY_ROWS, tileIndex } from './types';

interface Layout {
	// Pre-carved tunnel rectangles. Each enemy slot must overlap one of these
	// so the enemy has somewhere to walk at level start.
	tunnels: Array<{ x: number; y: number; w: number; h: number }>;
	// Candidate enemy spawn cells, ordered. Difficulty picks the first N.
	enemySlots: Array<{ x: number; y: number }>;
	// Candidate rock cells. These must NOT overlap a carved tunnel.
	rockSlots: Array<{ x: number; y: number }>;
}

// Three layouts that cycle by `level % 3`. Each gives every enemy a small
// connected chamber to patrol, so ghosting is reserved for when the player
// boxes them in or wanders far away.
const LAYOUTS: Layout[] = [
	// Layout A — central spine with side chambers and a lower gallery.
	{
		tunnels: [
			{ x: 7, y: 1, w: 2, h: 1 }, // top stub
			{ x: 7, y: 1, w: 1, h: 5 }, // vertical spine (player start)
			// Upper-left chamber (L-shape)
			{ x: 1, y: 3, w: 3, h: 1 },
			{ x: 2, y: 3, w: 1, h: 2 },
			// Upper-right chamber (L-shape)
			{ x: 12, y: 3, w: 3, h: 1 },
			{ x: 13, y: 3, w: 1, h: 2 },
			// Middle gallery — split so it doesn't connect to the spine directly.
			{ x: 2, y: 7, w: 4, h: 1 },
			{ x: 10, y: 7, w: 4, h: 1 },
			// Lower-left chamber
			{ x: 1, y: 10, w: 3, h: 1 },
			{ x: 2, y: 10, w: 1, h: 1 },
			// Lower-right chamber
			{ x: 12, y: 10, w: 3, h: 1 },
			{ x: 13, y: 10, w: 1, h: 1 }
		],
		enemySlots: [
			{ x: 2, y: 3 },
			{ x: 13, y: 3 },
			{ x: 3, y: 7 },
			{ x: 11, y: 7 },
			{ x: 2, y: 10 },
			{ x: 13, y: 10 }
		],
		rockSlots: [
			{ x: 4, y: 5 },
			{ x: 11, y: 5 },
			{ x: 6, y: 8 },
			{ x: 9, y: 8 },
			{ x: 5, y: 9 },
			{ x: 10, y: 9 }
		]
	},
	// Layout B — long top gallery + descending shafts to lower pockets.
	{
		tunnels: [
			{ x: 7, y: 1, w: 2, h: 1 },
			{ x: 1, y: 1, w: 14, h: 1 }, // top gallery
			{ x: 7, y: 1, w: 1, h: 3 }, // short spine
			// Mid chambers — two separate horizontals that don't touch the spine.
			{ x: 1, y: 5, w: 4, h: 1 },
			{ x: 11, y: 5, w: 4, h: 1 },
			// Deep pockets — small T-shapes.
			{ x: 3, y: 9, w: 3, h: 1 },
			{ x: 4, y: 9, w: 1, h: 2 },
			{ x: 10, y: 9, w: 3, h: 1 },
			{ x: 11, y: 9, w: 1, h: 2 }
		],
		enemySlots: [
			{ x: 2, y: 5 },
			{ x: 13, y: 5 },
			{ x: 4, y: 10 },
			{ x: 11, y: 10 },
			{ x: 3, y: 1 },
			{ x: 12, y: 1 }
		],
		rockSlots: [
			{ x: 5, y: 3 },
			{ x: 9, y: 3 },
			{ x: 6, y: 7 },
			{ x: 9, y: 7 },
			{ x: 2, y: 8 },
			{ x: 13, y: 8 }
		]
	},
	// Layout C — branching network with cross corridors.
	{
		tunnels: [
			{ x: 7, y: 1, w: 2, h: 1 },
			{ x: 7, y: 1, w: 1, h: 4 },
			// Two upper branches off the spine.
			{ x: 5, y: 4, w: 6, h: 1 },
			// Lower-left chamber
			{ x: 2, y: 6, w: 3, h: 1 },
			{ x: 2, y: 6, w: 1, h: 3 },
			// Lower-right chamber
			{ x: 11, y: 6, w: 3, h: 1 },
			{ x: 13, y: 6, w: 1, h: 3 },
			// Bottom gallery (one long horizontal).
			{ x: 5, y: 10, w: 6, h: 1 },
			{ x: 7, y: 10, w: 1, h: 1 } // a stub into bottom row
		],
		enemySlots: [
			{ x: 5, y: 4 },
			{ x: 10, y: 4 },
			{ x: 2, y: 8 },
			{ x: 13, y: 8 },
			{ x: 5, y: 10 },
			{ x: 10, y: 10 }
		],
		rockSlots: [
			{ x: 3, y: 3 },
			{ x: 12, y: 3 },
			{ x: 6, y: 5 },
			{ x: 9, y: 5 },
			{ x: 4, y: 9 },
			{ x: 11, y: 9 }
		]
	}
];

interface LevelSpec {
	pookas: number;
	fygars: number;
	rocks: number;
	enemyMoveMs: number;
	layout: Layout;
}

function levelSpec(level: number): LevelSpec {
	const stage = Math.min(level, 6);
	return {
		pookas: Math.max(1, Math.min(4, 1 + Math.floor(stage / 2))),
		fygars: Math.max(0, Math.min(2, Math.floor((stage - 1) / 2))),
		rocks: 3 + Math.min(3, Math.floor(stage / 2)),
		enemyMoveMs: Math.max(360, 720 - stage * 50),
		layout: LAYOUTS[(level - 1) % LAYOUTS.length]
	};
}

function emptyGrid(): TileKind[] {
	const g: TileKind[] = new Array(GRID_W * GRID_H);
	for (let y = 0; y < GRID_H; y++) {
		for (let x = 0; x < GRID_W; x++) {
			g[tileIndex(x, y)] = y < SKY_ROWS ? 'sky' : 'dirt';
		}
	}
	return g;
}

function carve(grid: TileKind[], x: number, y: number, w: number, h: number) {
	for (let yy = y; yy < y + h && yy < GRID_H; yy++) {
		for (let xx = x; xx < x + w && xx < GRID_W; xx++) {
			if (xx < 0 || yy < SKY_ROWS) continue;
			grid[tileIndex(xx, yy)] = 'tunnel';
		}
	}
}

function depthPoints(y: number): number {
	if (y <= 3) return 200;
	if (y <= 6) return 300;
	if (y <= 9) return 400;
	return 500;
}

function placeEnemies(level: number, layout: Layout, now: number): Enemy[] {
	const spec = levelSpec(level);
	const total = spec.pookas + spec.fygars;
	const kinds: EnemyKind[] = [
		...Array<EnemyKind>(spec.pookas).fill('pooka'),
		...Array<EnemyKind>(spec.fygars).fill('fygar')
	];
	const enemies: Enemy[] = [];
	for (let i = 0; i < total && i < layout.enemySlots.length; i++) {
		const s = layout.enemySlots[i];
		enemies.push({
			id: `e${i}-${kinds[i]}`,
			kind: kinds[i],
			cellX: s.x,
			cellY: s.y,
			moveFromX: s.x,
			moveFromY: s.y,
			moveStartedAt: now,
			moveMs: spec.enemyMoveMs,
			facing: 'left',
			state: 'roaming',
			inflateLevel: 0,
			inflateUntilDeflate: 0,
			fireAt: 0,
			fireFromCellX: s.x,
			fireFromCellY: s.y,
			fireFacing: 'left',
			noGhostUntil: now + 2000,
			points: depthPoints(s.y)
		});
	}
	return enemies;
}

function placeRocks(level: number, layout: Layout, grid: TileKind[]): Rock[] {
	const spec = levelSpec(level);
	const rocks: Rock[] = [];
	for (let i = 0; i < spec.rocks && i < layout.rockSlots.length; i++) {
		const s = layout.rockSlots[i];
		// Skip if the slot landed on a tunnel (would be a floating rock).
		if (grid[tileIndex(s.x, s.y)] !== 'dirt') continue;
		rocks.push({
			id: `r${i}`,
			cellX: s.x,
			cellY: s.y,
			state: 'resting',
			stateStartedAt: 0,
			crushed: new Set<string>()
		});
	}
	return rocks;
}

export function makeLevel(
	characterId: CharacterId,
	level: number,
	score: number,
	lives: number,
	now: number
): GameState {
	const grid = emptyGrid();
	const spec = levelSpec(level);
	for (const t of spec.layout.tunnels) {
		carve(grid, t.x, t.y, t.w, t.h);
	}

	const playerCellX = 7;
	const playerCellY = 1;
	carve(grid, playerCellX, playerCellY, 1, 1);

	const enemies = placeEnemies(level, spec.layout, now);
	const rocks = placeRocks(level, spec.layout, grid);

	return {
		characterId,
		level,
		score,
		lives,
		status: 'playing',
		statusStartedAt: now,
		grid,
		playerCellX,
		playerCellY,
		playerFromX: playerCellX,
		playerFromY: playerCellY,
		playerMoveStartedAt: now,
		playerMoveMs: 180,
		playerFacing: 'down',
		enemies,
		rocks,
		harpoon: null,
		fire: null,
		banner: { text: `LEVEL ${level}`, accent: 'var(--rp-gold)', expiresAt: now + 1600 }
	};
}

export function rockSupportedAt(grid: TileKind[], cellX: number, cellY: number): boolean {
	if (cellY >= GRID_H - 1) return true;
	const idx = tileIndex(cellX, cellY + 1);
	return grid[idx] === 'dirt';
}

export function depthScore(y: number): number {
	return depthPoints(y);
}
