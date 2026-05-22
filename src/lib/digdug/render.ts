import type { Character } from '$lib/characters';
import type {
	Enemy,
	Facing,
	FireBurst,
	GameState,
	Harpoon,
	Rock,
	TileKind
} from './types';
import { GRID_H, GRID_W, SKY_ROWS, tileIndex } from './types';

export const TILE_PX = 36;

const SKY_COLOR = '#9ccfd8';
const TUNNEL_COLOR = '#191724';

// Dirt gets darker / cooler as you go deeper, like the original.
const DIRT_BANDS: Array<{ from: number; to: number; base: string; speck: string }> = [
	{ from: 1, to: 3, base: '#a87142', speck: '#c89060' },
	{ from: 4, to: 6, base: '#8a4a3d', speck: '#a8624c' },
	{ from: 7, to: 9, base: '#5a4070', speck: '#7a5a92' },
	{ from: 10, to: 99, base: '#2f3a6a', speck: '#4a5a8a' }
];

function dirtColors(y: number) {
	for (const b of DIRT_BANDS) {
		if (y >= b.from && y <= b.to) return b;
	}
	return DIRT_BANDS[DIRT_BANDS.length - 1];
}

export function gridPixelSize() {
	return { w: GRID_W * TILE_PX, h: GRID_H * TILE_PX };
}

export function draw(
	ctx: CanvasRenderingContext2D,
	state: GameState,
	character: Character,
	now: number
) {
	const { w, h } = gridPixelSize();
	ctx.fillStyle = '#0f0c1a';
	ctx.fillRect(0, 0, w, h);

	for (let y = 0; y < GRID_H; y++) {
		for (let x = 0; x < GRID_W; x++) {
			drawTile(ctx, x, y, state.grid[tileIndex(x, y)], now);
		}
	}

	// Horizon line where sky meets dirt.
	ctx.fillStyle = '#6b3a25';
	ctx.fillRect(0, SKY_ROWS * TILE_PX - 2, w, 2);
	ctx.fillStyle = '#3d2417';
	ctx.fillRect(0, SKY_ROWS * TILE_PX, w, 2);

	for (const rock of state.rocks) {
		drawRock(ctx, rock, now);
	}

	if (state.harpoon) {
		drawHarpoon(ctx, state.harpoon, now);
	}

	if (state.fire) {
		drawFire(ctx, state.fire, now);
	}

	for (const enemy of state.enemies) {
		drawEnemy(ctx, enemy, now);
	}

	const playerPos = playerRenderPos(state, now);
	if (state.status !== 'dying') {
		drawPlayer(ctx, playerPos.x, playerPos.y, state.playerFacing, character);
	} else {
		drawDeath(ctx, playerPos.x, playerPos.y, now - state.statusStartedAt, character);
	}
}

function playerRenderPos(state: GameState, now: number): { x: number; y: number } {
	const elapsed = now - state.playerMoveStartedAt;
	const t = Math.min(1, Math.max(0, elapsed / state.playerMoveMs));
	return {
		x: state.playerFromX + (state.playerCellX - state.playerFromX) * t,
		y: state.playerFromY + (state.playerCellY - state.playerFromY) * t
	};
}

export function enemyRenderPos(enemy: Enemy, now: number): { x: number; y: number } {
	const elapsed = now - enemy.moveStartedAt;
	const t = Math.min(1, Math.max(0, elapsed / enemy.moveMs));
	return {
		x: enemy.moveFromX + (enemy.cellX - enemy.moveFromX) * t,
		y: enemy.moveFromY + (enemy.cellY - enemy.moveFromY) * t
	};
}

function drawTile(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	kind: TileKind,
	now: number
) {
	const px = x * TILE_PX;
	const py = y * TILE_PX;
	if (kind === 'sky') {
		ctx.fillStyle = SKY_COLOR;
		ctx.fillRect(px, py, TILE_PX, TILE_PX);
		// A few drifting cloud puffs.
		const drift = (now / 80 + x * 13 + y * 7) % TILE_PX;
		ctx.fillStyle = 'rgba(255,255,255,0.45)';
		ctx.fillRect(px + ((drift + 4) % TILE_PX), py + 8, 8, 3);
		ctx.fillRect(px + ((drift + 16) % TILE_PX), py + 20, 6, 2);
		return;
	}
	if (kind === 'tunnel') {
		ctx.fillStyle = TUNNEL_COLOR;
		ctx.fillRect(px, py, TILE_PX, TILE_PX);
		return;
	}
	// Dirt — banded by depth.
	const cols = dirtColors(y);
	ctx.fillStyle = cols.base;
	ctx.fillRect(px, py, TILE_PX, TILE_PX);
	// Stable speckle pattern based on cell coords.
	const seed = (x * 928371 + y * 13371) >>> 0;
	const spots = 6;
	ctx.fillStyle = cols.speck;
	for (let i = 0; i < spots; i++) {
		const sx = (seed >>> (i * 3)) & 0x1f;
		const sy = (seed >>> (i * 3 + 4)) & 0x1f;
		ctx.fillRect(px + (sx % (TILE_PX - 4)), py + (sy % (TILE_PX - 4)), 2, 2);
	}
	// Subtle horizontal striations.
	ctx.fillStyle = 'rgba(0,0,0,0.18)';
	ctx.fillRect(px, py + 8, TILE_PX, 1);
	ctx.fillRect(px, py + 24, TILE_PX, 1);
}

function dirOffset(d: Facing): { dx: number; dy: number } {
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

function drawHarpoon(ctx: CanvasRenderingContext2D, h: Harpoon, now: number) {
	const visualLength =
		h.animFromLength + (h.animToLength - h.animFromLength) * h.animProgress;
	if (visualLength <= 0) return;

	const { dx, dy } = dirOffset(h.dir);
	const startCx = h.originX * TILE_PX + TILE_PX / 2;
	const startCy = h.originY * TILE_PX + TILE_PX / 2;
	const endCx = startCx + dx * visualLength * TILE_PX;
	const endCy = startCy + dy * visualLength * TILE_PX;

	// Shaft.
	ctx.strokeStyle = '#e0def4';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(startCx, startCy);
	ctx.lineTo(endCx, endCy);
	ctx.stroke();

	// Spear tip — small triangle at end.
	ctx.fillStyle = '#f6c177';
	const tipSize = 6;
	ctx.beginPath();
	if (h.dir === 'left' || h.dir === 'right') {
		ctx.moveTo(endCx, endCy - tipSize);
		ctx.lineTo(endCx + dx * tipSize * 1.6, endCy);
		ctx.lineTo(endCx, endCy + tipSize);
	} else {
		ctx.moveTo(endCx - tipSize, endCy);
		ctx.lineTo(endCx, endCy + dy * tipSize * 1.6);
		ctx.lineTo(endCx + tipSize, endCy);
	}
	ctx.closePath();
	ctx.fill();

	// Sparkle when pumping (connected).
	if (h.connectedEnemyId !== null) {
		const pulse = (Math.sin(now / 60) + 1) / 2;
		ctx.fillStyle = `rgba(246, 193, 119, ${0.4 + pulse * 0.5})`;
		ctx.fillRect(startCx - 4, startCy - 4, 8, 8);
	}
}

function drawFire(ctx: CanvasRenderingContext2D, fire: FireBurst, now: number) {
	const elapsed = now - fire.startedAt;
	const t = Math.min(1, Math.max(0, elapsed / fire.durationMs));
	const fade = 1 - t;
	const flicker = (Math.sin(now / 40) + 1) / 2;
	const { dx, dy } = dirOffset(fire.dir);

	for (let i = 1; i <= fire.cells; i++) {
		const cx = fire.cellX + dx * i;
		const cy = fire.cellY + dy * i;
		const px = cx * TILE_PX;
		const py = cy * TILE_PX;
		// Outer glow.
		ctx.fillStyle = `rgba(235, 111, 146, ${0.7 * fade})`;
		ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
		// Inner flame.
		ctx.fillStyle = `rgba(246, 193, 119, ${0.9 * fade})`;
		const wobble = Math.floor(flicker * 4);
		ctx.fillRect(px + 8 + wobble, py + 8, TILE_PX - 16 - wobble, TILE_PX - 16);
		// Hot core.
		ctx.fillStyle = `rgba(255, 244, 204, ${0.95 * fade})`;
		ctx.fillRect(px + 14, py + 14 + Math.floor(flicker * 2), 8, 8);
	}
}

function drawRock(ctx: CanvasRenderingContext2D, rock: Rock, now: number) {
	if (rock.state === 'broken') {
		// Tiny dust puff for ~400ms after breaking.
		const elapsed = now - rock.stateStartedAt;
		if (elapsed > 400) return;
		const t = elapsed / 400;
		const px = rock.cellX * TILE_PX;
		const py = rock.cellY * TILE_PX;
		ctx.fillStyle = `rgba(155, 139, 110, ${1 - t})`;
		const r = 4 + t * 8;
		ctx.fillRect(px + TILE_PX / 2 - r, py + TILE_PX / 2 - 2, r * 2, 4);
		return;
	}

	let renderY = rock.cellY;
	let shakeX = 0;
	if (rock.state === 'wobble') {
		shakeX = Math.sin(now / 40) * 2;
	}
	const px = rock.cellX * TILE_PX + shakeX;
	const py = renderY * TILE_PX;

	// Rock body — stacked pixel chunks.
	ctx.fillStyle = '#6e6a86';
	ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
	ctx.fillStyle = '#908caa';
	ctx.fillRect(px + 6, py + 6, TILE_PX - 16, TILE_PX - 16);
	ctx.fillStyle = '#524f67';
	ctx.fillRect(px + 8, py + 22, 8, 4);
	ctx.fillRect(px + 22, py + 10, 6, 4);
	// Highlight glint.
	ctx.fillStyle = 'rgba(255,255,255,0.25)';
	ctx.fillRect(px + 10, py + 8, 4, 2);
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, now: number) {
	const pos = enemyRenderPos(enemy, now);
	const px = pos.x * TILE_PX;
	const py = pos.y * TILE_PX;
	const cx = px + TILE_PX / 2;
	const cy = py + TILE_PX / 2;
	const ghost = enemy.state === 'ghost';
	const inflated = enemy.state === 'inflated' || enemy.state === 'popping';

	ctx.save();
	if (ghost) ctx.globalAlpha = 0.45;
	if (enemy.state === 'popping') {
		const t = Math.min(1, (now - enemy.inflateUntilDeflate) / 240);
		const scale = 1 + t * 1.4;
		ctx.translate(cx, cy);
		ctx.scale(scale, scale);
		ctx.translate(-cx, -cy);
		ctx.globalAlpha = 1 - t;
	} else if (inflated) {
		const scale = 1 + enemy.inflateLevel * 0.18;
		ctx.translate(cx, cy);
		ctx.scale(scale, scale);
		ctx.translate(-cx, -cy);
	}

	if (enemy.kind === 'pooka') {
		drawPooka(ctx, px, py, enemy.facing, ghost);
	} else {
		drawFygar(ctx, px, py, enemy.facing, ghost, now);
	}

	ctx.restore();
}

function drawPooka(
	ctx: CanvasRenderingContext2D,
	px: number,
	py: number,
	facing: Facing,
	ghost: boolean
) {
	// Body — round red blob.
	ctx.fillStyle = ghost ? '#e0def4' : '#eb6f92';
	ctx.fillRect(px + 8, py + 8, TILE_PX - 16, TILE_PX - 12);
	ctx.fillRect(px + 6, py + 12, TILE_PX - 12, TILE_PX - 18);
	// Highlight.
	ctx.fillStyle = ghost ? '#ffffff' : '#f6a3b8';
	ctx.fillRect(px + 10, py + 10, 4, 4);
	// Goggles — Pooka's iconic yellow goggles, two big circles.
	ctx.fillStyle = '#f6c177';
	ctx.fillRect(px + 8, py + 16, 8, 8);
	ctx.fillRect(px + 20, py + 16, 8, 8);
	ctx.fillStyle = '#26233a';
	ctx.fillRect(px + 10, py + 18, 4, 4);
	ctx.fillRect(px + 22, py + 18, 4, 4);
	// Facing tick — small indicator on the side they face.
	ctx.fillStyle = ghost ? '#9ccfd8' : '#26233a';
	const fo = dirOffset(facing);
	ctx.fillRect(px + TILE_PX / 2 + fo.dx * 12 - 1, py + TILE_PX / 2 + fo.dy * 12 - 1, 3, 3);
}

function drawFygar(
	ctx: CanvasRenderingContext2D,
	px: number,
	py: number,
	facing: Facing,
	ghost: boolean,
	now: number
) {
	// Body — green dragon. We bias body width toward facing direction so it
	// reads as a dragon pointing somewhere.
	ctx.fillStyle = ghost ? '#e0def4' : '#3a8050';
	ctx.fillRect(px + 6, py + 10, TILE_PX - 12, TILE_PX - 14);
	ctx.fillStyle = ghost ? '#ffffff' : '#5fb780';
	ctx.fillRect(px + 8, py + 12, TILE_PX - 16, 4);

	// Spikes along the back.
	ctx.fillStyle = ghost ? '#9ccfd8' : '#27543c';
	ctx.fillRect(px + 10, py + 6, 3, 4);
	ctx.fillRect(px + 16, py + 4, 3, 6);
	ctx.fillRect(px + 22, py + 6, 3, 4);

	// Eye on the facing side.
	const fo = dirOffset(facing);
	const eyeX = px + TILE_PX / 2 + fo.dx * 10 - 2;
	const eyeY = py + TILE_PX / 2 + fo.dy * 8 - 2;
	ctx.fillStyle = '#fff4cc';
	ctx.fillRect(eyeX, eyeY, 5, 5);
	ctx.fillStyle = '#26233a';
	ctx.fillRect(eyeX + 1, eyeY + 1, 3, 3);

	// Subtle wobble flicker so Fygars look alive.
	if (!ghost) {
		const t = (Math.sin(now / 200) + 1) / 2;
		ctx.fillStyle = `rgba(246, 193, 119, ${0.25 + t * 0.35})`;
		ctx.fillRect(px + TILE_PX / 2 + fo.dx * 14 - 2, py + TILE_PX / 2 + fo.dy * 12 - 2, 4, 4);
	}
}

function drawPlayer(
	ctx: CanvasRenderingContext2D,
	cellX: number,
	cellY: number,
	facing: Facing,
	character: Character
) {
	const px = cellX * TILE_PX;
	const py = cellY * TILE_PX;
	const cx = px + TILE_PX / 2;
	const cy = py + TILE_PX / 2;

	// Shadow.
	ctx.fillStyle = 'rgba(0,0,0,0.4)';
	ctx.beginPath();
	ctx.ellipse(cx, cy + TILE_PX / 2 - 4, TILE_PX / 3, 3, 0, 0, Math.PI * 2);
	ctx.fill();

	// Character accent ring.
	ctx.strokeStyle = character.accent;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(cx, cy, TILE_PX / 2 - 4, 0, Math.PI * 2);
	ctx.stroke();

	// Helmet / scarf — small overlay so the digger reads as suited up.
	ctx.fillStyle = '#9ccfd8';
	ctx.fillRect(cx - 8, cy - TILE_PX / 2 + 4, 16, 4);

	// Character emoji.
	ctx.font = `${Math.floor(TILE_PX * 0.7)}px sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(character.emoji, cx, cy + 1);

	// Facing pip.
	const fo = dirOffset(facing);
	ctx.fillStyle = character.accent;
	ctx.fillRect(cx + fo.dx * (TILE_PX / 2 - 2) - 2, cy + fo.dy * (TILE_PX / 2 - 2) - 2, 4, 4);
}

function drawDeath(
	ctx: CanvasRenderingContext2D,
	cellX: number,
	cellY: number,
	elapsed: number,
	character: Character
) {
	const cx = cellX * TILE_PX + TILE_PX / 2;
	const cy = cellY * TILE_PX + TILE_PX / 2;
	const t = Math.min(1, elapsed / 1200);
	// Spin + shrink.
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(t * Math.PI * 3);
	ctx.scale(1 - t * 0.7, 1 - t * 0.7);
	ctx.globalAlpha = 1 - t * 0.5;
	ctx.font = `${Math.floor(TILE_PX * 0.7)}px sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = character.accent;
	ctx.fillText(character.emoji, 0, 0);
	ctx.restore();
	// Burst.
	const burst = Math.min(1, elapsed / 600);
	ctx.strokeStyle = `rgba(246, 193, 119, ${1 - burst})`;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(cx, cy, 6 + burst * 30, 0, Math.PI * 2);
	ctx.stroke();
}
