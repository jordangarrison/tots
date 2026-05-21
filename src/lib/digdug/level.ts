import type { CharacterId } from '$lib/characters';
import type { Enemy, EnemyKind, GameState, Rock, TileKind } from './types';
import { GRID_H, GRID_W, SKY_ROWS, tileIndex } from './types';

interface LevelSpec {
	pookas: number;
	fygars: number;
	rocks: number;
	enemyMoveMs: number;
	// Pre-carved tunnel segments to give the player a head start (and to seat enemies).
	tunnels: Array<{ x: number; y: number; w: number; h: number }>;
}

function levelSpec(level: number): LevelSpec {
	// Difficulty ramps slowly. Loops back around with more enemies after level 5.
	const stage = Math.min(level, 6);
	return {
		pookas: Math.max(1, Math.min(5, 1 + Math.floor(stage / 2))),
		fygars: Math.max(0, Math.min(3, Math.floor((stage - 1) / 2))),
		rocks: 3 + Math.min(3, Math.floor(stage / 2)),
		enemyMoveMs: Math.max(360, 720 - stage * 50),
		// A few diverse starting tunnels — feels different across levels.
		tunnels:
			level % 3 === 1
				? [
						{ x: 7, y: 1, w: 2, h: 1 },
						{ x: 7, y: 1, w: 1, h: 4 }
					]
				: level % 3 === 2
					? [
							{ x: 1, y: 1, w: 14, h: 1 },
							{ x: 7, y: 1, w: 2, h: 3 }
						]
					: [
							{ x: 7, y: 1, w: 2, h: 1 },
							{ x: 2, y: 5, w: 12, h: 1 },
							{ x: 7, y: 1, w: 1, h: 5 }
						]
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

function placeEnemies(level: number, grid: TileKind[], now: number): Enemy[] {
	const spec = levelSpec(level);
	const enemies: Enemy[] = [];
	// Hand-picked enemy slots at varied depths so enemies don't pile up.
	const slots: Array<{ x: number; y: number }> = [
		{ x: 2, y: 3 },
		{ x: 13, y: 3 },
		{ x: 3, y: 6 },
		{ x: 12, y: 6 },
		{ x: 2, y: 9 },
		{ x: 13, y: 9 },
		{ x: 5, y: 10 },
		{ x: 10, y: 10 }
	];
	const enemyKinds: EnemyKind[] = [
		...Array<EnemyKind>(spec.pookas).fill('pooka'),
		...Array<EnemyKind>(spec.fygars).fill('fygar')
	];
	for (let i = 0; i < enemyKinds.length && i < slots.length; i++) {
		const s = slots[i];
		// Carve a tiny pocket so the enemy has somewhere to stand and we know
		// where it is at start.
		carve(grid, s.x, s.y, 1, 1);
		enemies.push({
			id: `e${i}-${enemyKinds[i]}`,
			kind: enemyKinds[i],
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
			points: depthPoints(s.y)
		});
	}
	return enemies;
}

function placeRocks(level: number, grid: TileKind[]): Rock[] {
	const spec = levelSpec(level);
	const rocks: Rock[] = [];
	// Hand-picked rock slots over un-carved dirt; we ensure the rock cell itself
	// is solid dirt so the player has to dig under it to drop it.
	const slots: Array<{ x: number; y: number }> = [
		{ x: 4, y: 4 },
		{ x: 11, y: 4 },
		{ x: 5, y: 7 },
		{ x: 9, y: 7 },
		{ x: 3, y: 9 },
		{ x: 12, y: 9 }
	];
	for (let i = 0; i < spec.rocks && i < slots.length; i++) {
		const s = slots[i];
		// Ensure the rock occupies its own dirt cell (otherwise it'd just be visual).
		grid[tileIndex(s.x, s.y)] = 'dirt';
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
	for (const t of spec.tunnels) {
		carve(grid, t.x, t.y, t.w, t.h);
	}

	// Player starts in the top tunnel network, near the middle.
	const playerCellX = 7;
	const playerCellY = 1;
	carve(grid, playerCellX, playerCellY, 1, 1);

	const enemies = placeEnemies(level, grid, now);
	const rocks = placeRocks(level, grid);

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
	// A rock is "supported" if the cell directly under it is dirt or off-grid.
	if (cellY >= GRID_H - 1) return true;
	const idx = tileIndex(cellX, cellY + 1);
	return grid[idx] === 'dirt';
}

export function depthScore(y: number): number {
	return depthPoints(y);
}
