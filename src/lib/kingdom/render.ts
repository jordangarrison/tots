import { characters } from '$lib/characters';
import type { Character } from '$lib/characters';
import type { AreaDef, Facing, ItemId, PlacedDecor, PlotDef, PlotState, TileKind } from './types';

export const TILE_PX = 36;

const COLOR: Record<TileKind, string> = {
	grass: '#4d6b3a',
	path: '#9b8b6e',
	sand: '#d4b483',
	water: '#3b6e8a',
	wall: '#3d3a52',
	'flower-bed': '#6b3a52',
	lavender: '#7a5a9c',
	tree: '#27543c',
	stone: '#6e6a86',
	'rose-plot': '#5a3a25',
	'wood-floor': '#6b4a30',
	bed: '#6b4a30',
	hearth: '#3d3a52',
	window: '#3d3a52'
};

const GRID_LINE = 'rgba(0,0,0,0.18)';
const DOOR_OUTLINE = '#f6c177';
const PLAYER_RING = '#e0def4';

export function areaPixelSize(area: AreaDef): { w: number; h: number } {
	return { w: area.width * TILE_PX, h: area.height * TILE_PX };
}

export interface PlaceCursor {
	itemId: ItemId;
	x: number;
	y: number;
	valid: boolean;
}

interface DrawArgs {
	ctx: CanvasRenderingContext2D;
	area: AreaDef;
	plots: Record<string, PlotState>;
	player: { x: number; y: number; facing: Facing; character: Character };
	placedDecor: PlacedDecor[];
	placeCursor: PlaceCursor | null;
	now: number;
}

export function draw({ ctx, area, plots, player, placedDecor, placeCursor, now }: DrawArgs) {
	const { w, h } = areaPixelSize(area);
	ctx.fillStyle = '#191724';
	ctx.fillRect(0, 0, w, h);

	for (let y = 0; y < area.height; y++) {
		for (let x = 0; x < area.width; x++) {
			const kind = area.tiles[y * area.width + x];
			drawTile(ctx, x, y, kind, now);
		}
	}

	for (const plot of area.plots) {
		const state = plots[plot.id];
		drawPlot(ctx, plot, state);
	}

	for (const decor of placedDecor) {
		if (decor.areaId !== area.id) continue;
		drawDecor(ctx, decor.x, decor.y, decor.itemId);
	}

	for (const door of area.doors) {
		drawDoor(ctx, door.x, door.y, !!door.comingSoon);
	}

	for (const npc of area.npcs) {
		if (npc.id === player.character.id) continue; // you're playing as them
		const c = characters[npc.id];
		drawCharacter(ctx, npc.x, npc.y, c.emoji, c.accent);
	}

	drawCharacter(ctx, player.x, player.y, player.character.emoji, PLAYER_RING, player.facing);

	if (placeCursor) {
		drawPlaceCursor(ctx, placeCursor, now);
	}
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
	ctx.fillStyle = COLOR[kind];
	ctx.fillRect(px, py, TILE_PX, TILE_PX);

	switch (kind) {
		case 'tree':
			ctx.fillStyle = '#1a3a26';
			ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 8, py + 6, 6, 6);
			ctx.fillRect(px + 18, py + 10, 6, 6);
			ctx.fillRect(px + 12, py + 18, 6, 6);
			ctx.fillRect(px + 22, py + 22, 6, 6);
			break;
		case 'water': {
			const t = (now / 600) % 1;
			ctx.fillStyle = 'rgba(255,255,255,0.10)';
			const offset = Math.floor(t * TILE_PX);
			ctx.fillRect(px, py + ((offset + 6) % TILE_PX), TILE_PX, 2);
			ctx.fillRect(px, py + ((offset + 22) % TILE_PX), TILE_PX, 2);
			break;
		}
		case 'flower-bed':
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 6, py + 6, 6, 6);
			ctx.fillRect(px + 22, py + 8, 6, 6);
			ctx.fillRect(px + 14, py + 22, 6, 6);
			ctx.fillStyle = '#f6c177';
			ctx.fillRect(px + 10, py + 18, 4, 4);
			break;
		case 'lavender':
			ctx.fillStyle = '#c4a7e7';
			ctx.fillRect(px + 8, py + 4, 4, 8);
			ctx.fillRect(px + 18, py + 8, 4, 10);
			ctx.fillRect(px + 26, py + 6, 4, 8);
			ctx.fillRect(px + 12, py + 20, 4, 10);
			break;
		case 'stone':
			ctx.fillStyle = '#908caa';
			ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
			ctx.fillStyle = '#6e6a86';
			ctx.fillRect(px + 10, py + 12, 4, 4);
			ctx.fillRect(px + 22, py + 20, 4, 4);
			break;
		case 'wall':
			ctx.fillStyle = '#26233a';
			ctx.fillRect(px + 1, py + 1, TILE_PX - 2, TILE_PX - 2);
			ctx.fillStyle = '#524f67';
			ctx.fillRect(px + 4, py + 4, 12, 12);
			ctx.fillRect(px + 20, py + 4, 12, 12);
			ctx.fillRect(px + 4, py + 20, 12, 12);
			ctx.fillRect(px + 20, py + 20, 12, 12);
			break;
		case 'sand':
			ctx.fillStyle = 'rgba(255,255,255,0.06)';
			ctx.fillRect(px + 8, py + 10, 4, 2);
			ctx.fillRect(px + 22, py + 24, 4, 2);
			break;
		case 'grass':
			ctx.fillStyle = 'rgba(0,0,0,0.08)';
			ctx.fillRect(px + 6, py + 24, 3, 4);
			ctx.fillRect(px + 22, py + 8, 3, 4);
			break;
		case 'wood-floor':
			// Plank seams.
			ctx.fillStyle = 'rgba(0,0,0,0.18)';
			ctx.fillRect(px, py + 9, TILE_PX, 1);
			ctx.fillRect(px, py + 27, TILE_PX, 1);
			ctx.fillStyle = 'rgba(255,255,255,0.04)';
			ctx.fillRect(px + 4, py + 4, 8, 1);
			ctx.fillRect(px + 22, py + 22, 8, 1);
			break;
		case 'bed':
			// Quilt + pillow. Two-tile bed reads as one frame because adjacent tiles share style.
			ctx.fillStyle = '#54486b'; // frame
			ctx.fillRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4);
			ctx.fillStyle = '#9ccfd8'; // blanket
			ctx.fillRect(px + 5, py + 8, TILE_PX - 10, TILE_PX - 12);
			ctx.fillStyle = '#e0def4'; // pillow stripe
			ctx.fillRect(px + 5, py + 5, TILE_PX - 10, 4);
			ctx.fillStyle = 'rgba(0,0,0,0.25)';
			ctx.fillRect(px + 5, py + 18, TILE_PX - 10, 2);
			break;
		case 'hearth': {
			ctx.fillStyle = '#2a2738'; // hearth stones
			ctx.fillRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4);
			ctx.fillStyle = '#6e6a86';
			ctx.fillRect(px + 4, py + 4, 8, 6);
			ctx.fillRect(px + 16, py + 4, 8, 6);
			ctx.fillRect(px + 26, py + 4, 6, 6);
			// Flame.
			const flicker = Math.sin(now / 180) * 0.5 + 0.5;
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 12, py + 16, 12, 14);
			ctx.fillStyle = '#f6c177';
			ctx.fillRect(px + 14, py + 18 + Math.floor(flicker * 2), 8, 10);
			ctx.fillStyle = '#fff4cc';
			ctx.fillRect(px + 16, py + 22 + Math.floor(flicker * 2), 4, 4);
			break;
		}
		case 'window':
			ctx.fillStyle = '#26233a';
			ctx.fillRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4);
			ctx.fillStyle = '#9ccfd8'; // sky
			ctx.fillRect(px + 6, py + 6, TILE_PX - 12, TILE_PX - 12);
			ctx.fillStyle = '#26233a'; // mullions
			ctx.fillRect(px + 6, py + TILE_PX / 2 - 1, TILE_PX - 12, 2);
			ctx.fillRect(px + TILE_PX / 2 - 1, py + 6, 2, TILE_PX - 12);
			break;
	}

	ctx.strokeStyle = GRID_LINE;
	ctx.lineWidth = 1;
	ctx.strokeRect(px + 0.5, py + 0.5, TILE_PX - 1, TILE_PX - 1);
}

function drawDecor(ctx: CanvasRenderingContext2D, x: number, y: number, itemId: ItemId) {
	const px = x * TILE_PX;
	const py = y * TILE_PX;
	// Soft shadow under all decor.
	ctx.fillStyle = 'rgba(0,0,0,0.28)';
	ctx.beginPath();
	ctx.ellipse(px + TILE_PX / 2, py + TILE_PX - 6, TILE_PX / 3, 3, 0, 0, Math.PI * 2);
	ctx.fill();

	switch (itemId) {
		case 'rose':
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 16, py + 18, 4, 10);
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 12, py + 8, 12, 12);
			ctx.fillStyle = '#f6c177';
			ctx.fillRect(px + 16, py + 12, 4, 4);
			break;
		case 'lavender':
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 10, py + 18, 2, 10);
			ctx.fillRect(px + 18, py + 18, 2, 10);
			ctx.fillRect(px + 26, py + 18, 2, 10);
			ctx.fillStyle = '#c4a7e7';
			ctx.fillRect(px + 8, py + 8, 6, 10);
			ctx.fillRect(px + 16, py + 6, 6, 12);
			ctx.fillRect(px + 24, py + 9, 6, 10);
			ctx.fillStyle = '#e0def4';
			ctx.fillRect(px + 10, py + 10, 2, 2);
			ctx.fillRect(px + 18, py + 8, 2, 2);
			ctx.fillRect(px + 26, py + 11, 2, 2);
			break;
		case 'fish':
			ctx.fillStyle = '#9ccfd8';
			ctx.fillRect(px + 8, py + 14, 16, 8);
			ctx.fillRect(px + 24, py + 12, 2, 12);
			ctx.fillRect(px + 26, py + 10, 2, 16);
			ctx.fillStyle = '#3b6e8a';
			ctx.fillRect(px + 10, py + 16, 2, 2); // eye outline
			ctx.fillStyle = '#191724';
			ctx.fillRect(px + 10, py + 17, 1, 1);
			ctx.fillStyle = '#26233a';
			ctx.fillRect(px + 14, py + 16, 4, 1);
			break;
	}
}

function drawPlaceCursor(ctx: CanvasRenderingContext2D, cursor: PlaceCursor, now: number) {
	const px = cursor.x * TILE_PX;
	const py = cursor.y * TILE_PX;
	const pulse = (Math.sin(now / 220) + 1) / 2; // 0..1
	const alpha = 0.55 + pulse * 0.35;
	ctx.save();
	ctx.globalAlpha = alpha;
	drawDecor(ctx, cursor.x, cursor.y, cursor.itemId);
	ctx.restore();
	ctx.strokeStyle = cursor.valid ? '#9ccfd8' : '#eb6f92';
	ctx.lineWidth = 2;
	ctx.strokeRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4);
}

function drawPlot(ctx: CanvasRenderingContext2D, plot: PlotDef, state: PlotState | undefined) {
	if (plot.kind === 'rose') {
		drawRosePlot(ctx, plot.x, plot.y, state);
	} else if (plot.kind === 'lavender') {
		drawLavenderPlot(ctx, plot.x, plot.y, state);
	}
}

function drawRosePlot(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	state: PlotState | undefined
) {
	const px = x * TILE_PX;
	const py = y * TILE_PX;
	ctx.fillStyle = '#3d2a1c';
	ctx.fillRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6);

	if (!state || state.stage === 'empty') return;

	if (state.stage === 'seeded') {
		ctx.fillStyle = '#9b8b6e';
		ctx.fillRect(px + 16, py + 18, 4, 4);
		return;
	}
	if (state.stage === 'sprout') {
		ctx.fillStyle = '#3a8050';
		ctx.fillRect(px + 16, py + 12, 4, 10);
		ctx.fillRect(px + 12, py + 14, 4, 4);
		ctx.fillRect(px + 20, py + 14, 4, 4);
		return;
	}
	if (state.stage === 'bloomed') {
		ctx.fillStyle = '#3a8050';
		ctx.fillRect(px + 16, py + 18, 4, 10);
		ctx.fillStyle = '#eb6f92';
		ctx.fillRect(px + 12, py + 8, 12, 12);
		ctx.fillStyle = '#f6c177';
		ctx.fillRect(px + 16, py + 12, 4, 4);
	}
}

function drawLavenderPlot(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	state: PlotState | undefined
) {
	// Default (no state) = bloomed: the underlying lavender tile graphic shows
	// through, so we draw nothing extra here.
	if (!state || state.stage === 'empty') return;

	if (state.stage === 'regrowing') {
		const px = x * TILE_PX;
		const py = y * TILE_PX;
		// Cover the tile's bush graphic with grass so the bush "disappears".
		ctx.fillStyle = COLOR.grass;
		ctx.fillRect(px, py, TILE_PX, TILE_PX);
		// Tiny green stub at the base.
		ctx.fillStyle = '#3a8050';
		ctx.fillRect(px + 16, py + 22, 4, 6);
		ctx.fillRect(px + 12, py + 26, 12, 2);
		ctx.strokeStyle = GRID_LINE;
		ctx.lineWidth = 1;
		ctx.strokeRect(px + 0.5, py + 0.5, TILE_PX - 1, TILE_PX - 1);
	}
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, comingSoon: boolean) {
	const px = x * TILE_PX;
	const py = y * TILE_PX;
	ctx.strokeStyle = comingSoon ? '#6e6a86' : DOOR_OUTLINE;
	ctx.lineWidth = 2;
	ctx.strokeRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6);
	if (comingSoon) {
		ctx.fillStyle = '#6e6a86';
		ctx.fillRect(px + 14, py + 14, 8, 8);
	} else {
		ctx.fillStyle = DOOR_OUTLINE;
		ctx.fillRect(px + 16, py + 8, 4, 4);
	}
}

function drawCharacter(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	emoji: string,
	ringColor: string,
	facing?: Facing
) {
	const cx = x * TILE_PX + TILE_PX / 2;
	const cy = y * TILE_PX + TILE_PX / 2;
	ctx.fillStyle = 'rgba(0,0,0,0.25)';
	ctx.beginPath();
	ctx.ellipse(cx, cy + TILE_PX / 2 - 4, TILE_PX / 3, 3, 0, 0, Math.PI * 2);
	ctx.fill();

	ctx.strokeStyle = ringColor;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(cx, cy, TILE_PX / 2 - 4, 0, Math.PI * 2);
	ctx.stroke();

	ctx.font = `${Math.floor(TILE_PX * 0.7)}px sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(emoji, cx, cy + 1);

	if (facing) {
		ctx.fillStyle = ringColor;
		const fx = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
		const fy = facing === 'up' ? -1 : facing === 'down' ? 1 : 0;
		const tx = cx + fx * (TILE_PX / 2 - 2);
		const ty = cy + fy * (TILE_PX / 2 - 2);
		ctx.fillRect(tx - 2, ty - 2, 4, 4);
	}
}
