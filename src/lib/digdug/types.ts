import type { CharacterId } from '$lib/characters';

export const GRID_W = 16;
export const GRID_H = 12;
export const SKY_ROWS = 1;

export type TileKind = 'sky' | 'dirt' | 'tunnel';

export type Facing = 'up' | 'down' | 'left' | 'right';

export type EnemyKind = 'pooka' | 'fygar';

export type EnemyState = 'roaming' | 'ghost' | 'inflated' | 'popping';

export interface Enemy {
	id: string;
	kind: EnemyKind;
	cellX: number;
	cellY: number;
	moveFromX: number;
	moveFromY: number;
	moveStartedAt: number;
	moveMs: number;
	facing: Facing;
	state: EnemyState;
	// 0..4. Inflated > 0 freezes the enemy. At 4 it pops.
	inflateLevel: number;
	inflateUntilDeflate: number;
	// Fygar: fire breath state.
	fireAt: number;
	fireFromCellX: number;
	fireFromCellY: number;
	fireFacing: Facing;
	// Enemy can't enter ghost mode again until this timestamp. Set on level
	// start and after each rematerialization so ghosting stays rare.
	noGhostUntil: number;
	// Score points awarded when popped (depth-based).
	points: number;
}

export type RockState = 'resting' | 'wobble' | 'falling' | 'broken';

export interface Rock {
	id: string;
	cellX: number;
	// During fall, this is fractional.
	cellY: number;
	state: RockState;
	stateStartedAt: number;
	// Tracks enemies the rock has already crushed during this fall so we don't double-score.
	crushed: Set<string>;
}

export interface Harpoon {
	// Where the harpoon was fired from (player cell at fire time).
	originX: number;
	originY: number;
	dir: Facing;
	// How many cells the harpoon currently spans (1..MAX).
	length: number;
	// 0..1 — animation progress when extending or retracting.
	animProgress: number;
	animStartedAt: number;
	animFromLength: number;
	animToLength: number;
	connectedEnemyId: string | null;
	// True after harpoon reached max range with no hit — will retract.
	retracting: boolean;
	// Last time we pumped while connected.
	lastPumpAt: number;
}

export interface FireBurst {
	cellX: number;
	cellY: number;
	dir: Facing;
	cells: number;
	startedAt: number;
	durationMs: number;
}

export type GameStatus = 'playing' | 'dying' | 'level-clear' | 'game-over';

export interface GameState {
	characterId: CharacterId;
	level: number;
	score: number;
	lives: number;
	status: GameStatus;
	statusStartedAt: number;
	grid: TileKind[];
	playerCellX: number;
	playerCellY: number;
	playerFromX: number;
	playerFromY: number;
	playerMoveStartedAt: number;
	playerMoveMs: number;
	playerFacing: Facing;
	enemies: Enemy[];
	rocks: Rock[];
	harpoon: Harpoon | null;
	fire: FireBurst | null;
	// Banner to show at level start ("LEVEL 3") and on death.
	banner: { text: string; accent: string; expiresAt: number } | null;
}

export function tileIndex(x: number, y: number): number {
	return y * GRID_W + x;
}

export function tileAt(grid: TileKind[], x: number, y: number): TileKind | null {
	if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return null;
	return grid[tileIndex(x, y)];
}

export function isOpen(kind: TileKind | null): boolean {
	return kind === 'sky' || kind === 'tunnel';
}
