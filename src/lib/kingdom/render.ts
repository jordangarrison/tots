import type { CharacterId } from '$lib/characters';
import type {
	AreaDef,
	Critter,
	Facing,
	GroundItem,
	ItemId,
	PlacedDecor,
	PlotDef,
	PlotState,
	TileKind
} from './types';
import { STAGE_DURATIONS_MS } from './plots';
import { drawSprite } from './sprites';

export const TILE_PX = 36;

const COLOR: Record<TileKind, string> = {
	grass: '#4d6b3a',
	path: '#9b8b6e',
	sand: '#d4b483',
	water: '#3b6e8a',
	wall: '#3d3a52',
	'flower-bed': '#6b3a52',
	lavender: '#7a5a9c',
	bluebonnet: '#3a4b8a',
	tree: '#27543c',
	stone: '#6e6a86',
	'rose-plot': '#5a3a25',
	'seed-bin': '#6b4a30',
	'wood-floor': '#6b4a30',
	bed: '#6b4a30',
	hearth: '#3d3a52',
	window: '#3d3a52',
	fence: '#4d6b3a',
	dock: '#2d5570',
	palm: '#d4b483',
	sandcastle: '#d4b483',
	'dune-grass': '#d4b483',
	'berry-bush': '#4d6b3a',
	oven: '#6b4a30',
	counter: '#6b4a30',
	table: '#6b4a30',
	rug: '#6b4a30',
	bookshelf: '#3d3a52'
};

const GRID_LINE = 'rgba(0,0,0,0.18)';
const DOOR_GOLD = '#f6c177';
const BERRY = '#3b5fa6';
const BERRY_LIGHT = '#6a8ed6';

export function areaPixelSize(area: AreaDef): { w: number; h: number } {
	return { w: area.width * TILE_PX, h: area.height * TILE_PX };
}

export interface PlaceCursor {
	itemId: ItemId;
	x: number;
	y: number;
	valid: boolean;
}

export interface CharacterSpriteState {
	id: CharacterId;
	x: number; // tile-space float (smooth movement)
	y: number;
	facing: Facing;
	moving: boolean;
	walkT: number; // 0..1
}

export type NpcMark = 'quest' | 'ready';

export interface DrawArgs {
	ctx: CanvasRenderingContext2D;
	area: AreaDef;
	plots: Record<string, PlotState>;
	player: CharacterSpriteState;
	npcs: CharacterSpriteState[]; // already excludes the player's character
	npcMarks: Partial<Record<CharacterId, NpcMark>>;
	placedDecor: PlacedDecor[];
	placeCursor: PlaceCursor | null;
	groundItems: GroundItem[];
	critters: Critter[];
	now: number;
}

export function draw(args: DrawArgs): void {
	const {
		ctx,
		area,
		plots,
		player,
		npcs,
		npcMarks,
		placedDecor,
		placeCursor,
		groundItems,
		critters,
		now
	} = args;
	const { w, h } = areaPixelSize(area);
	ctx.fillStyle = '#191724';
	ctx.fillRect(0, 0, w, h);

	for (let y = 0; y < area.height; y++) {
		for (let x = 0; x < area.width; x++) {
			drawTile(ctx, x, y, area.tiles[y * area.width + x], now);
		}
	}

	for (const plot of area.plots) {
		drawPlot(ctx, plot, plots[plot.id], now);
	}

	for (const item of groundItems) {
		drawGroundItem(ctx, item, now);
	}

	for (const decor of placedDecor) {
		if (decor.areaId !== area.id) continue;
		drawDecor(ctx, decor.x, decor.y, decor.itemId);
	}

	for (const door of area.doors) {
		drawDoor(ctx, door.x, door.y, !!door.comingSoon, now);
	}

	// Player + NPCs together, lower on screen drawn in front.
	const sprites = [...npcs, player].sort((a, b) => a.y - b.y);
	for (const s of sprites) {
		drawSprite(ctx, s.id, s.x * TILE_PX, s.y * TILE_PX, TILE_PX, s.facing, {
			moving: s.moving,
			walkT: s.walkT,
			now,
			isPlayer: s === player
		});
	}

	for (const npc of npcs) {
		const mark = npcMarks[npc.id];
		if (mark) drawNpcMark(ctx, npc.x, npc.y, mark, now);
	}

	// Critters fly above everyone.
	for (const critter of critters) {
		drawCritter(ctx, critter, now);
	}

	if (placeCursor) {
		drawPlaceCursor(ctx, placeCursor, now);
	}
}

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

function woodFloorDetail(ctx: CanvasRenderingContext2D, px: number, py: number): void {
	ctx.fillStyle = 'rgba(0,0,0,0.18)';
	ctx.fillRect(px, py + 9, TILE_PX, 1);
	ctx.fillRect(px, py + 27, TILE_PX, 1);
	ctx.fillStyle = 'rgba(255,255,255,0.04)';
	ctx.fillRect(px + 4, py + 4, 8, 1);
	ctx.fillRect(px + 22, py + 22, 8, 1);
}

function sandDetail(ctx: CanvasRenderingContext2D, px: number, py: number): void {
	ctx.fillStyle = 'rgba(255,255,255,0.06)';
	ctx.fillRect(px + 8, py + 10, 4, 2);
	ctx.fillRect(px + 22, py + 24, 4, 2);
}

/** Chunky filled pixel-circle from 2px rows (rugs, tabletops…). */
function pixelCircle(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	r: number,
	color: string
): void {
	ctx.fillStyle = color;
	const step = 2;
	for (let yy = -r; yy < r; yy += step) {
		const mid = yy + step / 2;
		const half = Math.sqrt(Math.max(0, r * r - mid * mid));
		const hw = Math.round(half / step) * step;
		if (hw <= 0) continue;
		ctx.fillRect(cx - hw, cy + yy, hw * 2, step);
	}
}

function drawTile(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	kind: TileKind,
	now: number
): void {
	const px = x * TILE_PX;
	const py = y * TILE_PX;
	ctx.fillStyle = COLOR[kind];
	ctx.fillRect(px, py, TILE_PX, TILE_PX);

	switch (kind) {
		case 'grass':
			ctx.fillStyle = 'rgba(0,0,0,0.08)';
			ctx.fillRect(px + 6, py + 24, 3, 4);
			ctx.fillRect(px + 22, py + 8, 3, 4);
			break;
		case 'path':
			ctx.fillStyle = 'rgba(0,0,0,0.10)';
			ctx.fillRect(px + 8, py + 12, 4, 3);
			ctx.fillRect(px + 22, py + 22, 4, 3);
			ctx.fillStyle = 'rgba(255,255,255,0.06)';
			ctx.fillRect(px + 16, py + 6, 3, 2);
			break;
		case 'sand':
			sandDetail(ctx, px, py);
			break;
		case 'water': {
			const t = (now / 600) % 1;
			ctx.fillStyle = 'rgba(255,255,255,0.10)';
			const offset = Math.floor(t * TILE_PX);
			ctx.fillRect(px, py + ((offset + 6) % TILE_PX), TILE_PX, 2);
			ctx.fillRect(px, py + ((offset + 22) % TILE_PX), TILE_PX, 2);
			break;
		}
		case 'wall':
			ctx.fillStyle = '#26233a';
			ctx.fillRect(px + 1, py + 1, TILE_PX - 2, TILE_PX - 2);
			ctx.fillStyle = '#524f67';
			ctx.fillRect(px + 4, py + 4, 12, 12);
			ctx.fillRect(px + 20, py + 4, 12, 12);
			ctx.fillRect(px + 4, py + 20, 12, 12);
			ctx.fillRect(px + 20, py + 20, 12, 12);
			break;
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
		case 'bluebonnet': {
			// Base patch of grass so the deep-blue tile colour reads as a bush.
			ctx.fillStyle = COLOR.grass;
			ctx.fillRect(px, py, TILE_PX, TILE_PX);
			// Tall blue spire with paler tips — classic bluebonnet silhouette.
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 14, py + 18, 3, 12);
			ctx.fillRect(px + 22, py + 20, 3, 10);
			ctx.fillStyle = '#3b5fa6';
			ctx.fillRect(px + 12, py + 8, 7, 14);
			ctx.fillRect(px + 20, py + 12, 7, 10);
			ctx.fillStyle = '#6a8ed6';
			ctx.fillRect(px + 13, py + 9, 5, 4);
			ctx.fillRect(px + 21, py + 13, 5, 3);
			ctx.fillStyle = '#e0def4';
			ctx.fillRect(px + 14, py + 9, 2, 2);
			ctx.fillRect(px + 22, py + 13, 2, 2);
			break;
		}
		case 'tree':
			ctx.fillStyle = '#1a3a26';
			ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 8, py + 6, 6, 6);
			ctx.fillRect(px + 18, py + 10, 6, 6);
			ctx.fillRect(px + 12, py + 18, 6, 6);
			ctx.fillRect(px + 22, py + 22, 6, 6);
			break;
		case 'stone':
			ctx.fillStyle = '#908caa';
			ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
			ctx.fillStyle = '#6e6a86';
			ctx.fillRect(px + 10, py + 12, 4, 4);
			ctx.fillRect(px + 22, py + 20, 4, 4);
			break;
		case 'rose-plot':
			// Bare royal soil — the plot overlay draws everything else.
			break;
		case 'seed-bin': {
			// Grass base behind the bin so the silhouette reads cleanly.
			ctx.fillStyle = COLOR.grass;
			ctx.fillRect(px, py, TILE_PX, TILE_PX);
			// Wooden barrel.
			ctx.fillStyle = '#4a2f1d';
			ctx.fillRect(px + 6, py + 8, TILE_PX - 12, TILE_PX - 12);
			ctx.fillStyle = '#6b4a30';
			ctx.fillRect(px + 8, py + 10, TILE_PX - 16, TILE_PX - 16);
			// Iron hoops.
			ctx.fillStyle = '#26233a';
			ctx.fillRect(px + 6, py + 11, TILE_PX - 12, 2);
			ctx.fillRect(px + 6, py + 24, TILE_PX - 12, 2);
			// Heap of seeds peeking over the rim.
			ctx.fillStyle = '#d9c089';
			ctx.fillRect(px + 10, py + 6, 4, 4);
			ctx.fillRect(px + 16, py + 4, 4, 4);
			ctx.fillRect(px + 22, py + 6, 4, 4);
			break;
		}
		case 'wood-floor':
			woodFloorDetail(ctx, px, py);
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
		case 'fence': {
			// Grass tufts + a soft contact shadow under the fence line.
			ctx.fillStyle = 'rgba(0,0,0,0.08)';
			ctx.fillRect(px + 4, py + 31, 3, 3);
			ctx.fillRect(px + 28, py + 30, 3, 3);
			ctx.fillStyle = 'rgba(0,0,0,0.15)';
			ctx.fillRect(px, py + 28, TILE_PX, 2);
			// Rails run edge-to-edge so neighbouring fence tiles connect.
			ctx.fillStyle = '#e0def4';
			ctx.fillRect(px, py + 14, TILE_PX, 3);
			ctx.fillRect(px, py + 21, TILE_PX, 3);
			ctx.fillStyle = '#908caa';
			ctx.fillRect(px, py + 16, TILE_PX, 1);
			ctx.fillRect(px, py + 23, TILE_PX, 1);
			// Three pickets with pointed tops.
			for (const fx of [3, 16, 29]) {
				ctx.fillStyle = '#e0def4';
				ctx.fillRect(px + fx + 1, py + 6, 2, 2);
				ctx.fillRect(px + fx, py + 8, 4, 20);
				ctx.fillStyle = '#908caa';
				ctx.fillRect(px + fx + 3, py + 8, 1, 20);
			}
			break;
		}
		case 'dock': {
			// Warm planks over dark water, gaps showing through.
			ctx.fillStyle = '#8a6a45';
			ctx.fillRect(px, py, TILE_PX, 10);
			ctx.fillRect(px, py + 12, TILE_PX, 10);
			ctx.fillRect(px, py + 24, TILE_PX, 10);
			ctx.fillStyle = 'rgba(0,0,0,0.18)';
			ctx.fillRect(px, py + 9, TILE_PX, 1);
			ctx.fillRect(px, py + 21, TILE_PX, 1);
			ctx.fillRect(px, py + 33, TILE_PX, 1);
			ctx.fillStyle = '#9b7b52'; // grain
			ctx.fillRect(px + 4, py + 3, 10, 1);
			ctx.fillRect(px + 20, py + 16, 9, 1);
			ctx.fillRect(px + 8, py + 28, 9, 1);
			ctx.fillStyle = '#5a4530'; // nails
			ctx.fillRect(px + 2, py + 14, 2, 2);
			ctx.fillRect(px + 32, py + 14, 2, 2);
			// Water glints sliding along the gaps between planks.
			const glide = Math.floor(((now / 900) % 1) * 30);
			ctx.fillStyle = 'rgba(255,255,255,0.12)';
			ctx.fillRect(px + ((glide + x * 7) % 30) + 2, py + 10, 6, 2);
			ctx.fillRect(px + ((glide + x * 7 + 15) % 30) + 2, py + 22, 6, 2);
			// Rope posts knuckling along the edge.
			ctx.fillStyle = '#5a4530';
			ctx.fillRect(px + 1, py + 1, 5, 5);
			ctx.fillRect(px + 30, py + 1, 5, 5);
			ctx.fillStyle = '#6b4a30';
			ctx.fillRect(px + 2, py + 1, 3, 2);
			ctx.fillRect(px + 31, py + 1, 3, 2);
			ctx.fillStyle = '#d9c089'; // rope
			ctx.fillRect(px + 6, py + 3, 24, 1);
			ctx.fillRect(px + 1, py + 4, 5, 1);
			ctx.fillRect(px + 30, py + 4, 5, 1);
			break;
		}
		case 'palm': {
			sandDetail(ctx, px, py);
			ctx.fillStyle = 'rgba(0,0,0,0.18)';
			ctx.fillRect(px + 12, py + 29, 14, 3);
			// Slanted trunk with rings.
			ctx.fillStyle = '#8a6a45';
			ctx.fillRect(px + 17, py + 23, 4, 7);
			ctx.fillRect(px + 15, py + 17, 4, 7);
			ctx.fillRect(px + 13, py + 11, 4, 7);
			ctx.fillStyle = '#6b4a30';
			ctx.fillRect(px + 17, py + 28, 4, 1);
			ctx.fillRect(px + 15, py + 22, 4, 1);
			ctx.fillRect(px + 13, py + 16, 4, 1);
			// Crown of fronds fanning out.
			ctx.fillStyle = '#27543c';
			ctx.fillRect(px + 12, py + 9, 7, 3);
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 4, py + 10, 9, 3);
			ctx.fillRect(px + 2, py + 12, 3, 2);
			ctx.fillRect(px + 22, py + 8, 9, 3);
			ctx.fillRect(px + 30, py + 10, 3, 2);
			ctx.fillRect(px + 8, py + 5, 7, 3);
			ctx.fillRect(px + 20, py + 4, 7, 3);
			ctx.fillRect(px + 14, py + 3, 5, 3);
			ctx.fillStyle = '#27543c'; // frond undersides
			ctx.fillRect(px + 6, py + 12, 7, 1);
			ctx.fillRect(px + 24, py + 10, 7, 1);
			// Coconuts.
			ctx.fillStyle = '#5a4530';
			ctx.fillRect(px + 13, py + 10, 3, 3);
			ctx.fillRect(px + 17, py + 11, 3, 3);
			ctx.fillStyle = '#8a6a45';
			ctx.fillRect(px + 14, py + 11, 1, 1);
			ctx.fillRect(px + 18, py + 12, 1, 1);
			break;
		}
		case 'sandcastle': {
			sandDetail(ctx, px, py);
			ctx.fillStyle = 'rgba(0,0,0,0.15)';
			ctx.fillRect(px + 5, py + 29, 26, 3);
			// Bucket-moulded base with ridge lines.
			ctx.fillStyle = '#d9b36a';
			ctx.fillRect(px + 6, py + 20, 24, 10);
			ctx.fillStyle = 'rgba(0,0,0,0.12)';
			ctx.fillRect(px + 6, py + 23, 24, 1);
			ctx.fillRect(px + 6, py + 26, 24, 1);
			// Two towers with crenellations.
			ctx.fillStyle = '#d9b36a';
			ctx.fillRect(px + 8, py + 8, 8, 14);
			ctx.fillRect(px + 8, py + 6, 2, 2);
			ctx.fillRect(px + 11, py + 6, 2, 2);
			ctx.fillRect(px + 14, py + 6, 2, 2);
			ctx.fillRect(px + 21, py + 13, 7, 9);
			ctx.fillRect(px + 21, py + 11, 2, 2);
			ctx.fillRect(px + 24, py + 11, 2, 2);
			ctx.fillRect(px + 26, py + 11, 2, 2);
			ctx.fillStyle = '#f0d49a'; // sun-lit edges
			ctx.fillRect(px + 8, py + 8, 2, 12);
			ctx.fillRect(px + 21, py + 13, 2, 7);
			ctx.fillRect(px + 6, py + 20, 2, 8);
			ctx.fillStyle = 'rgba(0,0,0,0.25)'; // little windows
			ctx.fillRect(px + 11, py + 12, 2, 3);
			ctx.fillRect(px + 23, py + 16, 2, 3);
			// Shell door.
			ctx.fillStyle = '#8a6a45';
			ctx.fillRect(px + 17, py + 23, 3, 1);
			ctx.fillRect(px + 16, py + 24, 5, 6);
			// Tiny pink flag.
			ctx.fillStyle = '#6b4a30';
			ctx.fillRect(px + 11, py + 1, 1, 5);
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 12, py + 1, 5, 3);
			break;
		}
		case 'dune-grass': {
			sandDetail(ctx, px, py);
			ctx.fillStyle = 'rgba(0,0,0,0.12)';
			ctx.fillRect(px + 8, py + 26, 9, 1);
			ctx.fillRect(px + 22, py + 30, 9, 1);
			ctx.fillStyle = '#7a8450';
			ctx.fillRect(px + 8, py + 18, 2, 8);
			ctx.fillRect(px + 11, py + 15, 2, 11);
			ctx.fillRect(px + 14, py + 18, 2, 8);
			ctx.fillRect(px + 22, py + 22, 2, 8);
			ctx.fillRect(px + 25, py + 19, 2, 11);
			ctx.fillRect(px + 28, py + 22, 2, 8);
			ctx.fillStyle = '#6a7444';
			ctx.fillRect(px + 10, py + 17, 1, 9);
			ctx.fillRect(px + 24, py + 21, 1, 9);
			break;
		}
		case 'berry-bush': {
			ctx.fillStyle = 'rgba(0,0,0,0.18)';
			ctx.fillRect(px + 4, py + 28, 28, 3);
			// Round leafy bush (berries come from the plot overlay).
			ctx.fillStyle = '#2f6b45';
			ctx.fillRect(px + 8, py + 6, 20, 4);
			ctx.fillRect(px + 5, py + 10, 26, 16);
			ctx.fillRect(px + 8, py + 26, 20, 3);
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 9, py + 8, 7, 5);
			ctx.fillRect(px + 20, py + 12, 8, 6);
			ctx.fillRect(px + 12, py + 19, 6, 5);
			ctx.fillStyle = 'rgba(255,255,255,0.10)';
			ctx.fillRect(px + 11, py + 9, 2, 2);
			ctx.fillRect(px + 23, py + 13, 2, 2);
			ctx.fillRect(px + 15, py + 21, 2, 2);
			break;
		}
		case 'oven': {
			// Stone dome oven on a slab, embers breathing inside.
			ctx.fillStyle = '#524f67';
			ctx.fillRect(px + 3, py + 26, 30, 6);
			ctx.fillStyle = '#6e6a86';
			ctx.fillRect(px + 9, py + 3, 18, 4);
			ctx.fillRect(px + 6, py + 7, 24, 8);
			ctx.fillRect(px + 4, py + 15, 28, 11);
			ctx.fillStyle = '#908caa'; // stones
			ctx.fillRect(px + 12, py + 4, 4, 2);
			ctx.fillRect(px + 20, py + 8, 4, 3);
			ctx.fillRect(px + 8, py + 9, 4, 3);
			ctx.fillRect(px + 6, py + 17, 4, 3);
			ctx.fillRect(px + 26, py + 16, 4, 3);
			ctx.fillRect(px + 27, py + 21, 3, 3);
			// Dark arched mouth.
			ctx.fillStyle = '#191724';
			ctx.fillRect(px + 13, py + 12, 10, 2);
			ctx.fillRect(px + 11, py + 14, 14, 12);
			// Warm embers flicker like the hearth.
			const ovenFlicker = Math.sin(now / 180 + x * 2.1 + y * 1.3) * 0.5 + 0.5;
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 13, py + 20, 10, 5);
			ctx.fillStyle = '#f6c177';
			ctx.fillRect(px + 15, py + 21 + Math.floor(ovenFlicker * 2), 6, 4);
			ctx.fillStyle = '#fff4cc';
			ctx.fillRect(px + 17, py + 23 + Math.floor(ovenFlicker * 2), 2, 2);
			ctx.fillStyle = `rgba(246,193,119,${0.05 + ovenFlicker * 0.07})`;
			ctx.fillRect(px + 10, py + 26, 16, 5);
			break;
		}
		case 'counter': {
			// Bakery counter with a glass display dome. Runs edge-to-edge.
			ctx.fillStyle = '#5d4029';
			ctx.fillRect(px, py + 16, TILE_PX, 20);
			ctx.fillStyle = 'rgba(0,0,0,0.25)';
			ctx.fillRect(px, py + 16, TILE_PX, 1);
			ctx.fillStyle = '#3d2a1c'; // drawer handles
			ctx.fillRect(px + 6, py + 23, 8, 2);
			ctx.fillRect(px + 22, py + 23, 8, 2);
			ctx.fillStyle = '#8a6a45'; // counter top
			ctx.fillRect(px, py + 9, TILE_PX, 7);
			ctx.fillStyle = '#9b7b52';
			ctx.fillRect(px, py + 9, TILE_PX, 2);
			// A tiny pastry under glass.
			ctx.fillStyle = '#b07b2e';
			ctx.fillRect(px + 14, py + 6, 8, 3);
			ctx.fillStyle = '#d9b36a';
			ctx.fillRect(px + 13, py + 3, 10, 3);
			ctx.fillStyle = BERRY;
			ctx.fillRect(px + 16, py + 3, 2, 2);
			ctx.fillStyle = 'rgba(224,222,244,0.30)'; // glass dome
			ctx.fillRect(px + 11, py + 2, 14, 7);
			ctx.fillRect(px + 13, py, 10, 2);
			ctx.fillStyle = 'rgba(224,222,244,0.7)'; // glass shine
			ctx.fillRect(px + 11, py + 2, 1, 7);
			ctx.fillRect(px + 13, py, 6, 1);
			break;
		}
		case 'table': {
			woodFloorDetail(ctx, px, py);
			ctx.fillStyle = 'rgba(0,0,0,0.22)';
			ctx.beginPath();
			ctx.ellipse(px + 18, py + 28, 12, 3, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#4a2f1d'; // pedestal foot
			ctx.fillRect(px + 14, py + 27, 8, 2);
			pixelCircle(ctx, px + 18, py + 16, 12, '#6b4a30'); // rim
			pixelCircle(ctx, px + 18, py + 16, 10, '#8a6a45'); // top
			ctx.fillStyle = 'rgba(0,0,0,0.12)'; // wood grain
			ctx.fillRect(px + 12, py + 13, 8, 1);
			ctx.fillRect(px + 16, py + 20, 8, 1);
			// A little vase of flowers.
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 17, py + 10, 1, 3);
			ctx.fillRect(px + 19, py + 11, 1, 2);
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 15, py + 7, 3, 3);
			ctx.fillStyle = '#f6c177';
			ctx.fillRect(px + 18, py + 8, 3, 3);
			ctx.fillStyle = '#9ccfd8';
			ctx.fillRect(px + 16, py + 13, 4, 4);
			ctx.fillStyle = '#4f8a96';
			ctx.fillRect(px + 16, py + 16, 4, 1);
			break;
		}
		case 'rug': {
			woodFloorDetail(ctx, px, py);
			// Round woven rug — concentric rose/gold/iris rings.
			pixelCircle(ctx, px + 18, py + 18, 15, '#b04a6e');
			pixelCircle(ctx, px + 18, py + 18, 13, '#eb6f92');
			pixelCircle(ctx, px + 18, py + 18, 10, '#f6c177');
			pixelCircle(ctx, px + 18, py + 18, 7, '#c4a7e7');
			pixelCircle(ctx, px + 18, py + 18, 4, '#eb6f92');
			ctx.fillStyle = 'rgba(255,255,255,0.18)'; // woven shine
			ctx.fillRect(px + 12, py + 8, 4, 2);
			ctx.fillRect(px + 24, py + 24, 4, 2);
			break;
		}
		case 'bookshelf': {
			// Dark case full of colourful spines.
			ctx.fillStyle = '#26233a';
			ctx.fillRect(px + 2, py + 1, 32, 34);
			ctx.fillStyle = '#1f1d2e';
			ctx.fillRect(px + 4, py + 3, 28, 30);
			ctx.fillStyle = '#6b4a30'; // shelf boards
			ctx.fillRect(px + 4, py + 13, 28, 2);
			ctx.fillRect(px + 4, py + 23, 28, 2);
			ctx.fillRect(px + 4, py + 31, 28, 2);
			const rows: Array<Array<[number, number, number, string]>> = [
				[
					[5, 5, 4, '#eb6f92'],
					[10, 6, 4, '#f6c177'],
					[15, 5, 3, '#9ccfd8'],
					[19, 7, 4, '#c4a7e7'],
					[24, 5, 4, '#f6c177'],
					[29, 6, 3, '#eb6f92']
				],
				[
					[5, 15, 4, '#c4a7e7'],
					[10, 16, 3, '#eb6f92'],
					[14, 15, 4, '#f6c177'],
					[19, 15, 4, '#9ccfd8'],
					[24, 17, 4, '#eb6f92'],
					[28, 16, 4, '#e0def4']
				],
				[
					[5, 25, 4, '#f6c177'],
					[10, 25, 3, '#9ccfd8'],
					[14, 26, 4, '#eb6f92'],
					[19, 25, 4, '#c4a7e7'],
					[24, 25, 4, '#e0def4'],
					[28, 26, 4, '#f6c177']
				]
			];
			for (const row of rows) {
				for (const [bx, by, bw, c] of row) {
					ctx.fillStyle = c;
					const bottom = by < 13 ? 13 : by < 23 ? 23 : 31;
					ctx.fillRect(px + bx, py + by, bw, bottom - by);
				}
			}
			ctx.fillStyle = 'rgba(255,255,255,0.25)'; // spine labels
			ctx.fillRect(px + 6, py + 8, 2, 1);
			ctx.fillRect(px + 20, py + 18, 2, 1);
			ctx.fillRect(px + 25, py + 27, 2, 1);
			break;
		}
		default: {
			const exhaustive: never = kind;
			void exhaustive;
		}
	}

	ctx.strokeStyle = GRID_LINE;
	ctx.lineWidth = 1;
	ctx.strokeRect(px + 0.5, py + 0.5, TILE_PX - 1, TILE_PX - 1);
}

/* ------------------------------------------------------------------ */
/* Item art (placed decor, ground items, place cursor)                 */
/* ------------------------------------------------------------------ */

function drawDecor(ctx: CanvasRenderingContext2D, x: number, y: number, itemId: ItemId): void {
	drawDecorAt(ctx, x * TILE_PX, y * TILE_PX, itemId, x + y);
}

/** Draw an item into the tile-sized pixel box at (px, py). `seed` picks stable variants. */
function drawDecorAt(
	ctx: CanvasRenderingContext2D,
	px: number,
	py: number,
	itemId: ItemId,
	seed: number
): void {
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
		case 'tulip': {
			// Red/yellow variety stays stable per tile.
			const yellow = ((seed % 2) + 2) % 2 === 0;
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 16, py + 18, 4, 12);
			ctx.fillRect(px + 10, py + 22, 8, 3);
			ctx.fillStyle = yellow ? '#f6c177' : '#eb6f92';
			ctx.fillRect(px + 12, py + 10, 4, 8);
			ctx.fillRect(px + 20, py + 10, 4, 8);
			ctx.fillRect(px + 16, py + 8, 4, 10);
			ctx.fillStyle = yellow ? '#eb6f92' : '#f6c177';
			ctx.fillRect(px + 16, py + 10, 4, 4);
			break;
		}
		case 'seed':
			// Small linen sack with seeds spilling out.
			ctx.fillStyle = '#d9c089';
			ctx.fillRect(px + 10, py + 12, 16, 16);
			ctx.fillStyle = '#9b8b6e';
			ctx.fillRect(px + 10, py + 10, 16, 4);
			ctx.fillStyle = '#4a3a2a';
			ctx.fillRect(px + 14, py + 8, 8, 4);
			ctx.fillStyle = '#3d2a1c';
			ctx.fillRect(px + 12, py + 26, 2, 2);
			ctx.fillRect(px + 18, py + 26, 2, 2);
			ctx.fillRect(px + 24, py + 26, 2, 2);
			break;
		case 'berry':
			// A plump trio of blueberries with a leaf.
			ctx.fillStyle = '#3a8050';
			ctx.fillRect(px + 17, py + 7, 2, 4);
			ctx.fillRect(px + 13, py + 9, 8, 3);
			berryDot(ctx, px + 9, py + 13);
			berryDot(ctx, px + 19, py + 12);
			berryDot(ctx, px + 14, py + 20);
			break;
		case 'shell': {
			// Pink-and-cream spiral seashell.
			ctx.fillStyle = '#f2c79f';
			ctx.fillRect(px + 13, py + 8, 11, 2);
			ctx.fillRect(px + 11, py + 10, 15, 13);
			ctx.fillRect(px + 9, py + 20, 4, 4);
			ctx.fillRect(px + 13, py + 23, 11, 3);
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 13, py + 12, 11, 9);
			ctx.fillStyle = '#f2c79f';
			ctx.fillRect(px + 15, py + 14, 7, 5);
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 17, py + 16, 3, 2);
			ctx.fillStyle = '#fff4cc';
			ctx.fillRect(px + 13, py + 10, 2, 2);
			break;
		}
		case 'butterfly':
			// Open wings, gold over pink, dark body. Static as decor.
			ctx.fillStyle = '#f6c177';
			ctx.fillRect(px + 8, py + 8, 8, 7);
			ctx.fillRect(px + 20, py + 8, 8, 7);
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(px + 10, py + 16, 6, 6);
			ctx.fillRect(px + 20, py + 16, 6, 6);
			ctx.fillStyle = 'rgba(255,255,255,0.55)';
			ctx.fillRect(px + 10, py + 10, 2, 2);
			ctx.fillRect(px + 24, py + 10, 2, 2);
			ctx.fillStyle = '#26233a';
			ctx.fillRect(px + 16, py + 9, 4, 13);
			ctx.fillRect(px + 14, py + 5, 1, 4);
			ctx.fillRect(px + 21, py + 5, 1, 4);
			break;
		case 'muffin':
			// A berry muffin on a tiny plate.
			ctx.fillStyle = '#e0def4';
			ctx.fillRect(px + 8, py + 26, 20, 3);
			ctx.fillStyle = '#908caa';
			ctx.fillRect(px + 8, py + 28, 20, 1);
			ctx.fillStyle = '#b07b2e'; // pleated wrapper
			ctx.fillRect(px + 11, py + 18, 14, 8);
			ctx.fillStyle = '#8a5e22';
			ctx.fillRect(px + 13, py + 18, 1, 8);
			ctx.fillRect(px + 17, py + 18, 1, 8);
			ctx.fillRect(px + 21, py + 18, 1, 8);
			ctx.fillStyle = '#d9b36a'; // domed top
			ctx.fillRect(px + 12, py + 8, 12, 3);
			ctx.fillRect(px + 10, py + 11, 16, 7);
			ctx.fillStyle = '#f0d49a';
			ctx.fillRect(px + 13, py + 9, 4, 2);
			ctx.fillStyle = BERRY; // berry dots
			ctx.fillRect(px + 14, py + 12, 3, 3);
			ctx.fillRect(px + 20, py + 10, 3, 3);
			ctx.fillRect(px + 17, py + 15, 2, 2);
			break;
		default: {
			const exhaustive: never = itemId;
			void exhaustive;
		}
	}
}

function berryDot(ctx: CanvasRenderingContext2D, bx: number, by: number): void {
	ctx.fillStyle = BERRY;
	ctx.fillRect(bx + 1, by, 6, 8);
	ctx.fillRect(bx, by + 1, 8, 6);
	ctx.fillStyle = BERRY_LIGHT;
	ctx.fillRect(bx + 1, by + 1, 3, 2);
	ctx.fillStyle = '#e0def4';
	ctx.fillRect(bx + 2, by + 1, 1, 1);
}

/* ------------------------------------------------------------------ */
/* Ground items (wild tulips, seashells…)                              */
/* ------------------------------------------------------------------ */

const SWAYING_ITEMS: ReadonlySet<ItemId> = new Set<ItemId>(['tulip', 'rose', 'lavender', 'berry']);

function drawGroundItem(ctx: CanvasRenderingContext2D, item: GroundItem, now: number): void {
	const px = item.x * TILE_PX;
	const py = item.y * TILE_PX;
	const elapsed = now - item.spawnedAt;
	// Pop-in over the first 250ms.
	const popT = Math.min(1, Math.max(0, elapsed / 250));
	// Wilt/shrink through the last 25% of a limited lifetime.
	let wilting = false;
	let wiltT = 0;
	if (item.lifetimeMs !== null) {
		const lifeT = Math.min(1, Math.max(0, elapsed / item.lifetimeMs));
		const wiltStart = 0.75;
		if (lifeT > wiltStart) {
			wilting = true;
			wiltT = (lifeT - wiltStart) / (1 - wiltStart);
		}
	}
	const scale = popT * (1 - wiltT * 0.65);
	const swayAmp = SWAYING_ITEMS.has(item.itemId) ? 1.5 : 0.5;
	const sway = Math.sin(now / 220 + item.x * 1.7 + item.y) * swayAmp;

	ctx.save();
	ctx.translate(px + TILE_PX / 2 + sway, py + TILE_PX);
	ctx.scale(scale, scale);
	ctx.translate(-(TILE_PX / 2), -TILE_PX);

	drawDecorAt(ctx, 0, 0, item.itemId, item.x + item.y);

	if (wilting) {
		// Pulse a gold warning ring when about to vanish.
		const pulse = (Math.sin(now / 90) + 1) / 2;
		ctx.strokeStyle = `rgba(246, 193, 119, ${0.4 + pulse * 0.4})`;
		ctx.lineWidth = 2;
		ctx.strokeRect(2, 2, TILE_PX - 4, TILE_PX - 4);
	} else if (item.lifetimeMs === null) {
		// Permanent pickups (seashells) glint now and then, desynced by position.
		const tw = (now + item.x * 967 + item.y * 487) % 2300;
		if (tw < 320) {
			const a = Math.sin((tw / 320) * Math.PI);
			ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * a})`;
			const sx = TILE_PX - 10;
			const sy = 10;
			ctx.fillRect(sx - 1, sy - 4, 2, 8);
			ctx.fillRect(sx - 4, sy - 1, 8, 2);
		}
	}

	ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Plots                                                               */
/* ------------------------------------------------------------------ */

function drawPlot(
	ctx: CanvasRenderingContext2D,
	plot: PlotDef,
	state: PlotState | undefined,
	now: number
): void {
	if (plot.kind === 'rose') {
		drawRosePlot(ctx, plot.x, plot.y, state);
	} else if (plot.kind === 'lavender') {
		drawLavenderPlot(ctx, plot.x, plot.y, state);
	} else if (plot.kind === 'bluebonnet') {
		drawBluebonnetPlot(ctx, plot.x, plot.y, state);
	} else {
		drawBerryPlot(ctx, plot.x, plot.y, state, now);
	}
}

function drawBerryPlot(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	state: PlotState | undefined,
	now: number
): void {
	const px = x * TILE_PX;
	const py = y * TILE_PX;

	if (!state || state.stage === 'empty') {
		// Ripe! Plump berry clusters all over the bush tile underneath.
		berryDot(ctx, px + 9, py + 10);
		berryDot(ctx, px + 20, py + 8);
		berryDot(ctx, px + 14, py + 16);
		berryDot(ctx, px + 23, py + 17);
		berryDot(ctx, px + 10, py + 21);
		return;
	}

	if (state.stage === 'regrowing') {
		// Bare bush shows through; a tiny sparkle teases when nearly regrown.
		const t = (now - state.stageStartedAt) / STAGE_DURATIONS_MS.regrowing;
		if (t > 0.8) {
			const tw = (now + x * 701 + y * 397) % 900;
			if (tw < 450) {
				const a = Math.sin((tw / 450) * Math.PI);
				ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * a})`;
				ctx.fillRect(px + 25, py + 6, 2, 6);
				ctx.fillRect(px + 23, py + 8, 6, 2);
			}
		}
	}
	// seeded/sprout/bloomed never occur for berry bushes — nothing extra.
}

function drawBluebonnetPlot(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	state: PlotState | undefined
): void {
	const px = x * TILE_PX;
	const py = y * TILE_PX;
	// Soil inset over the rose-plot tile.
	ctx.fillStyle = '#3d2a1c';
	ctx.fillRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6);

	if (!state || state.stage === 'empty') return;

	if (state.stage === 'seeded') {
		ctx.fillStyle = '#d9c089';
		ctx.fillRect(px + 16, py + 18, 4, 4);
		ctx.fillRect(px + 12, py + 22, 3, 3);
		ctx.fillRect(px + 22, py + 22, 3, 3);
		return;
	}
	if (state.stage === 'sprout') {
		ctx.fillStyle = '#3a8050';
		ctx.fillRect(px + 16, py + 14, 4, 12);
		ctx.fillRect(px + 12, py + 18, 4, 4);
		ctx.fillRect(px + 20, py + 18, 4, 4);
		return;
	}
	if (state.stage === 'bloomed') {
		// A planted bluebonnet — looks like the decorative tile but soil-rooted.
		ctx.fillStyle = '#3a8050';
		ctx.fillRect(px + 17, py + 20, 3, 10);
		ctx.fillStyle = '#3b5fa6';
		ctx.fillRect(px + 14, py + 8, 8, 16);
		ctx.fillStyle = '#6a8ed6';
		ctx.fillRect(px + 15, py + 10, 6, 4);
		ctx.fillRect(px + 15, py + 16, 6, 3);
		ctx.fillStyle = '#e0def4';
		ctx.fillRect(px + 16, py + 10, 2, 2);
		ctx.fillRect(px + 19, py + 16, 2, 2);
	}
}

function drawRosePlot(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	state: PlotState | undefined
): void {
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
): void {
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

/* ------------------------------------------------------------------ */
/* Doors, marks, cursor                                                */
/* ------------------------------------------------------------------ */

function drawDoor(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	comingSoon: boolean,
	now: number
): void {
	const px = x * TILE_PX;
	const py = y * TILE_PX;
	if (comingSoon) {
		ctx.strokeStyle = '#6e6a86';
		ctx.lineWidth = 2;
		ctx.strokeRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6);
		ctx.fillStyle = '#6e6a86';
		ctx.fillRect(px + 14, py + 14, 8, 8);
		return;
	}
	// Warm gold glow that breathes.
	const pulse = (Math.sin(now / 380 + x * 5 + y * 3) + 1) / 2;
	ctx.strokeStyle = `rgba(246, 193, 119, ${0.12 + pulse * 0.18})`;
	ctx.lineWidth = 4;
	ctx.strokeRect(px + 5, py + 5, TILE_PX - 10, TILE_PX - 10);
	ctx.strokeStyle = `rgba(246, 193, 119, ${0.55 + pulse * 0.45})`;
	ctx.lineWidth = 2;
	ctx.strokeRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6);
	// An inviting sparkle, offset per door so they don't sync.
	const tw = (now + x * 977 + y * 593) % 1900;
	if (tw < 360) {
		const a = Math.sin((tw / 360) * Math.PI);
		ctx.fillStyle = `rgba(255, 244, 204, ${0.9 * a})`;
		const sx = px + TILE_PX - 9;
		const sy = py + 9;
		ctx.fillRect(sx - 1, sy - 4, 2, 8);
		ctx.fillRect(sx - 4, sy - 1, 8, 2);
	}
}

function drawNpcMark(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	mark: NpcMark,
	now: number
): void {
	const cx = Math.round(x * TILE_PX + TILE_PX / 2);
	const bounce = Math.sin(now / 250) * 2;
	const w = 16;
	const h = 14;
	const left = cx - w / 2;
	const top = Math.round(Math.max(1, y * TILE_PX - 16 + bounce));
	// Rounded dark chip + a little tail pointing at the head.
	ctx.fillStyle = '#26233a';
	ctx.fillRect(left + 1, top, w - 2, h);
	ctx.fillRect(left, top + 1, w, h - 2);
	ctx.fillRect(cx - 2, top + h, 4, 2);
	ctx.fillRect(cx - 1, top + h + 2, 2, 1);

	if (mark === 'quest') {
		// Chunky gold exclamation mark.
		ctx.fillStyle = DOOR_GOLD;
		ctx.fillRect(cx - 2, top + 3, 4, 5);
		ctx.fillRect(cx - 2, top + 9, 4, 2);
	} else {
		// Pixel heart — gift ready!
		const hx = cx - 5;
		const hy = top + 3;
		ctx.fillStyle = '#eb6f92';
		ctx.fillRect(hx + 1, hy, 3, 2);
		ctx.fillRect(hx + 6, hy, 3, 2);
		ctx.fillRect(hx, hy + 2, 10, 2);
		ctx.fillRect(hx + 1, hy + 4, 8, 2);
		ctx.fillRect(hx + 2, hy + 6, 6, 1);
		ctx.fillRect(hx + 3, hy + 7, 4, 1);
		ctx.fillRect(hx + 4, hy + 8, 2, 1);
		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.fillRect(hx + 2, hy + 1, 1, 1);
	}
}

function drawPlaceCursor(ctx: CanvasRenderingContext2D, cursor: PlaceCursor, now: number): void {
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

/* ------------------------------------------------------------------ */
/* Critters — ambient life, drawn above everyone                       */
/* ------------------------------------------------------------------ */

function drawCritter(ctx: CanvasRenderingContext2D, c: Critter, now: number): void {
	const cx = c.x * TILE_PX;
	const cy = c.y * TILE_PX;
	switch (c.kind) {
		case 'butterfly': {
			const flap = Math.abs(Math.sin(now / 110 + c.phase)); // 0..1 wing spread
			const bob = Math.sin(now / 320 + c.phase) * 1.5;
			const wings = ['#f6c177', '#eb6f92', '#c4a7e7'];
			const wing = wings[Math.abs(Math.floor(c.phase * 7)) % 3];
			const y = cy + bob;
			const w = 1 + Math.round(flap * 3);
			ctx.fillStyle = wing;
			ctx.fillRect(cx - 1 - w, y - 3, w, 3);
			ctx.fillRect(cx - 1 - Math.max(1, w - 1), y, Math.max(1, w - 1), 2);
			ctx.fillRect(cx + 1, y - 3, w, 3);
			ctx.fillRect(cx + 1, y, Math.max(1, w - 1), 2);
			if (w > 2) {
				ctx.fillStyle = 'rgba(255,255,255,0.5)';
				ctx.fillRect(cx - w, y - 2, 1, 1);
				ctx.fillRect(cx + w - 1, y - 2, 1, 1);
			}
			ctx.fillStyle = '#26233a';
			ctx.fillRect(cx - 1, y - 3, 2, 6);
			break;
		}
		case 'bee': {
			const y = cy + Math.sin(now / 180 + c.phase) * 1.5;
			if (Math.floor(now / 45 + c.phase * 10) % 2 === 0) {
				ctx.fillStyle = 'rgba(255,255,255,0.55)'; // blurry wings
				ctx.fillRect(cx - 2, y - 5, 2, 3);
				ctx.fillRect(cx, y - 5, 2, 3);
			}
			ctx.fillStyle = '#f6c177';
			ctx.fillRect(cx - 3, y - 2, 6, 4);
			ctx.fillStyle = '#26233a';
			ctx.fillRect(cx - 1, y - 2, 2, 4); // stripe
			ctx.fillRect(cx + 3, y - 1, 1, 2); // nose
			break;
		}
		case 'petal': {
			// A drifting petal rocking side to side.
			const tilt = Math.sin(now / 300 + c.phase) > 0 ? 1 : -1;
			ctx.fillStyle = '#eb6f92';
			ctx.fillRect(cx - 2, cy + (tilt > 0 ? 0 : -1), 2, 2);
			ctx.fillRect(cx, cy + (tilt > 0 ? -1 : 0), 2, 2);
			ctx.fillStyle = 'rgba(255,255,255,0.35)';
			ctx.fillRect(cx - 1, cy, 1, 1);
			break;
		}
		case 'dragonfly': {
			const dir = c.vx >= 0 ? 1 : -1;
			const y = cy + Math.sin(now / 260 + c.phase) * 1.2;
			const wingA = Math.floor(now / 50 + c.phase * 13) % 2 === 0 ? 0.5 : 0.18;
			ctx.fillStyle = `rgba(255,255,255,${wingA})`; // shimmering wings
			ctx.fillRect(cx - 5, y - 4, 4, 2);
			ctx.fillRect(cx + 1, y - 4, 4, 2);
			ctx.fillStyle = '#9ccfd8'; // slim foam body
			ctx.fillRect(cx - 4, y - 1, 8, 2);
			ctx.fillStyle = '#4f8a96';
			ctx.fillRect(dir > 0 ? cx - 4 : cx + 2, y - 1, 2, 2); // tail
			ctx.fillStyle = '#26233a';
			ctx.fillRect(dir > 0 ? cx + 3 : cx - 4, y - 1, 1, 1); // eye
			break;
		}
		case 'bird': {
			const dir = c.vx >= 0 ? 1 : -1;
			const y = cy + Math.sin(now / 300 + c.phase) * 2;
			const flapUp = Math.floor(now / 160 + c.phase * 7) % 2 === 0;
			ctx.fillStyle = '#3b5fa6'; // little bluebird, slightly larger
			ctx.fillRect(cx - 5, y - 2, 10, 5);
			ctx.fillRect(dir > 0 ? cx + 3 : cx - 7, y - 4, 4, 4); // head
			ctx.fillRect(dir > 0 ? cx - 7 : cx + 5, y - 1, 2, 2); // tail
			ctx.fillStyle = '#6a8ed6'; // belly
			ctx.fillRect(cx - 3, y + 1, 6, 2);
			ctx.fillStyle = '#f6c177'; // beak
			ctx.fillRect(dir > 0 ? cx + 7 : cx - 9, y - 3, 2, 2);
			ctx.fillStyle = '#e0def4'; // eye
			ctx.fillRect(dir > 0 ? cx + 5 : cx - 6, y - 3, 1, 1);
			ctx.fillStyle = '#2d4a85'; // flapping wing
			if (flapUp) {
				ctx.fillRect(cx - 2, y - 5, 5, 3);
			} else {
				ctx.fillRect(cx - 2, y + 2, 5, 3);
			}
			break;
		}
		default: {
			const exhaustive: never = c.kind;
			void exhaustive;
		}
	}
}
