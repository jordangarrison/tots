import type { CharacterId } from '$lib/characters';
import type { Facing } from './types';

/**
 * Pixel-art character sprites for the Kingdom, drawn entirely with fillRect.
 *
 * Every sprite is authored on an 18×18 "fat pixel" grid (one grid unit = 2
 * screen px at the standard 36px tile), so the art scales with `size`. Each
 * rect is laid down twice: first inflated by 1px in the outline color, then
 * filled — later fills cover interior halos so only the silhouette keeps its
 * dark 1px edge and sprites pop against the grass.
 */

export interface SpriteOpts {
	moving: boolean;
	/** 0..1 walk-cycle phase (one stride per tile step). Ignored when !moving. */
	walkT: number;
	/** performance.now() timestamp for idle bob + blink. */
	now: number;
	/** Soft glow under the player-controlled character. */
	isPlayer?: boolean;
}

const GRID = 18;
const OUTLINE = '#26233a';
const SHOE = '#524f67';
const MOUTH = '#b04a6e';
const CHEEK = '#eba9b4';
const SKIN = '#f2c79f';
const SKIN_LIGHT = '#f7d7b5';

// Free-running per-character phase so bobs/blinks/wags never sync up.
const PHASE: Record<CharacterId, number> = {
	jane: 0,
	isla: 1.7,
	ollie: 3.1,
	mommy: 4.6,
	daddy: 5.9
};

/** One fat-pixel rect in 18-grid units: [x, y, w, h, color]. */
type Rect = [x: number, y: number, w: number, h: number, c: string];

type View = 'down' | 'up' | 'side';

interface Pose {
	frame: 0 | 1;
	moving: boolean;
	blink: boolean;
	now: number;
	phase: number;
}

/** Draw a character into the size×size pixel box whose top-left is (px, py). */
export function drawSprite(
	ctx: CanvasRenderingContext2D,
	id: CharacterId,
	px: number,
	py: number,
	size: number,
	facing: Facing,
	opts: SpriteOpts
): void {
	const u = size / GRID;
	const phase = PHASE[id];
	const frame: 0 | 1 = opts.moving && opts.walkT >= 0.5 ? 1 : 0;
	const view: View = facing === 'up' ? 'up' : facing === 'down' ? 'down' : 'side';
	const mirror = facing === 'left';
	// Blink every ~3.2s for ~130ms (eyes become 1px lines); never when facing up.
	const blink = facing !== 'up' && (opts.now + phase * 997) % 3200 < 130;
	const pose: Pose = { frame, moving: opts.moving, blink, now: opts.now, phase };

	if (opts.isPlayer) drawGlow(ctx, px, py, size);
	drawShadow(ctx, px, py, size);

	// Idle: gentle 1px bob. Walking: tiny 1px hop on the second stride frame.
	const bob = opts.moving ? (frame === 1 ? -1 : 0) : Math.round(Math.sin(opts.now / 420 + phase));

	paintRects(ctx, buildCharacter(id, view, pose), px, py + bob, u, mirror);
}

function buildCharacter(id: CharacterId, view: View, pose: Pose): Rect[] {
	switch (id) {
		case 'jane':
			return buildRoyalLady(JANE, view, pose);
		case 'isla':
			return buildRoyalLady(ISLA, view, pose);
		case 'mommy':
			return buildRoyalLady(MOMMY, view, pose);
		case 'daddy':
			return buildKing(view, pose);
		case 'ollie':
			return buildDog(view, pose);
	}
}

/** Soft foam under-glow marking the player-controlled character. */
function drawGlow(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
	const cx = px + size / 2;
	const cy = py + size - 4;
	ctx.save();
	ctx.translate(cx, cy);
	ctx.scale(1, 0.4);
	const r = size * 0.46;
	const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
	g.addColorStop(0, 'rgba(224, 222, 244, 0.34)');
	g.addColorStop(0.6, 'rgba(156, 207, 216, 0.16)');
	g.addColorStop(1, 'rgba(156, 207, 216, 0)');
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.arc(0, 0, r, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
	ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
	ctx.beginPath();
	ctx.ellipse(px + size / 2, py + size - 3, size / 3.2, size / 13, 0, 0, Math.PI * 2);
	ctx.fill();
}

/**
 * Paint grid-unit rects into the sprite box. Pass 1 lays every rect down
 * inflated by 1px in the outline color; pass 2 draws the fills, covering all
 * interior halos so only the outer silhouette keeps its dark edge.
 */
function paintRects(
	ctx: CanvasRenderingContext2D,
	rects: Rect[],
	ox: number,
	oy: number,
	u: number,
	mirror: boolean
): void {
	const o = Math.max(1, Math.floor(u / 2));
	ctx.fillStyle = OUTLINE;
	for (const [x, y, w, h] of rects) {
		const s = toScreen(x, y, w, h, ox, oy, u, mirror);
		ctx.fillRect(s.x - o, s.y - o, s.w + o * 2, s.h + o * 2);
	}
	for (const [x, y, w, h, c] of rects) {
		const s = toScreen(x, y, w, h, ox, oy, u, mirror);
		ctx.fillStyle = c;
		ctx.fillRect(s.x, s.y, s.w, s.h);
	}
}

function toScreen(
	x: number,
	y: number,
	w: number,
	h: number,
	ox: number,
	oy: number,
	u: number,
	mirror: boolean
): { x: number; y: number; w: number; h: number } {
	const gx = mirror ? GRID - x - w : x;
	const x1 = Math.round(gx * u);
	const x2 = Math.round((gx + w) * u);
	const y1 = Math.round(y * u);
	const y2 = Math.round((y + h) * u);
	return { x: ox + x1, y: oy + y1, w: Math.max(1, x2 - x1), h: Math.max(1, y2 - y1) };
}

/* ------------------------------------------------------------------ */
/* Royal ladies — Jane, Isla (princesses) and Mommy (queen)            */
/* ------------------------------------------------------------------ */

interface RoyalLook {
	/** Grid y of the crown's topmost pixel; smaller = taller character. */
	top: number;
	hair: string;
	/** Side-lock length in the down view (0 = hair pulled back). */
	sideLock: number;
	/** Hair fall length down the back in the up view (0 = bun instead). */
	backLen: number;
	bun: boolean;
	gown: string;
	gownDark: string;
	crown: string;
	glint: string;
	/** Three-point queen crown instead of a petite tiara. */
	crown3: boolean;
	skin: string;
}

const JANE: RoyalLook = {
	top: 3,
	hair: '#5b3a29',
	sideLock: 6.5,
	backLen: 5.5,
	bun: false,
	gown: '#eb6f92',
	gownDark: '#b04a6e',
	crown: '#f6c177',
	glint: '#fff4cc',
	crown3: false,
	skin: SKIN
};

const ISLA: RoyalLook = {
	top: 3,
	hair: '#e8c878',
	sideLock: 5,
	backLen: 4,
	bun: false,
	gown: '#c4a7e7',
	gownDark: '#8d6bb8',
	crown: '#e0def4',
	glint: '#ffffff',
	crown3: false,
	skin: SKIN_LIGHT
};

const MOMMY: RoyalLook = {
	top: 2.5,
	hair: '#4a3527',
	sideLock: 0,
	backLen: 0,
	bun: true,
	gown: '#9ccfd8',
	gownDark: '#4f8a96',
	crown: '#f6c177',
	glint: '#fff4cc',
	crown3: true,
	skin: SKIN
};

function buildRoyalLady(o: RoyalLook, view: View, p: Pose): Rect[] {
	const r: Rect[] = [];
	const add = (x: number, y: number, w: number, h: number, c: string): void => {
		r.push([x, y, w, h, c]);
	};
	const t = o.top;
	// Gown hem sways ±1px instead of leg detail; feet shuffle under the hem.
	const sw = p.moving ? (p.frame === 0 ? -0.5 : 0.5) : 0;
	const ft = p.moving ? (p.frame === 0 ? -0.5 : 0.5) : 0;

	const gown = (side: boolean): void => {
		const n = side ? 0.5 : 0; // side view is a touch narrower
		add(7 + n, t + 6.75, 4 - n, 1.25, o.gown);
		add(6.75 + n, t + 8, 4.5 - n, 12.25 - (t + 8), o.gown);
		add(6.25 + n + sw * 0.5, 12.25, 5.5 - n, 1.25, o.gown);
		add(5.75 + n + sw, 13.5, 6.5 - n, 1.5, o.gown);
		add(5.75 + n + sw, 14.25, 6.5 - n, 0.75, o.gownDark);
		add(8.75, t + 8, 0.5, 3, o.gownDark);
	};

	const crown = (cx: number): void => {
		if (o.crown3) {
			add(cx - 2.5, t + 1, 5, 1, o.crown);
			add(cx - 2.25, t + 0.25, 0.75, 0.75, o.crown);
			add(cx - 0.5, t - 0.5, 1, 1.5, o.crown);
			add(cx + 1.5, t + 0.25, 0.75, 0.75, o.crown);
			add(cx - 0.25, t + 1.25, 0.5, 0.5, o.glint);
		} else {
			add(cx - 2, t + 1, 4, 0.75, o.crown);
			add(cx - 0.5, t, 1, 1, o.crown);
			add(cx - 1.75, t + 0.5, 0.75, 0.5, o.crown);
			add(cx + 1, t + 0.5, 0.75, 0.5, o.crown);
			add(cx - 0.25, t + 0.25, 0.5, 0.5, o.glint);
		}
	};

	if (view === 'down') {
		gown(false);
		add(6.5, t + 7.5, 0.75, 1.25, o.skin); // hands
		add(10.75, t + 7.5, 0.75, 1.25, o.skin);
		add(7 + ft, 15, 1.5, 1, SHOE); // little feet under the hem
		add(9.5 - ft, 15, 1.5, 1, SHOE);
		add(7, t + 3.5, 4, 3.25, o.skin); // face
		add(5.75, t + 1.5, 6.5, 2, o.hair); // hair cap
		if (o.sideLock > 0) {
			add(5.75, t + 3, 1.5, o.sideLock + 1, o.hair); // locks framing the face
			add(10.75, t + 3, 1.5, o.sideLock + 1, o.hair);
		}
		if (p.blink) {
			add(7.5, t + 5, 1, 0.5, OUTLINE);
			add(9.5, t + 5, 1, 0.5, OUTLINE);
		} else {
			add(7.5, t + 4.5, 1, 1, OUTLINE);
			add(9.5, t + 4.5, 1, 1, OUTLINE);
		}
		add(7.25, t + 5.75, 0.5, 0.5, CHEEK);
		add(10.25, t + 5.75, 0.5, 0.5, CHEEK);
		add(8.5, t + 6, 1, 0.5, MOUTH);
		crown(9);
		add(7.25 + sw, 12.75, 0.5, 0.5, o.glint); // gown sequins
		add(10 + sw, 14, 0.5, 0.5, o.glint);
		return r;
	}

	if (view === 'up') {
		gown(false);
		add(6.5, t + 7.5, 0.75, 1.25, o.skin);
		add(10.75, t + 7.5, 0.75, 1.25, o.skin);
		add(7 + ft, 15.25, 1.5, 0.75, SHOE);
		add(9.5 - ft, 15.25, 1.5, 0.75, SHOE);
		if (o.bun) {
			add(8.25, t + 4.25, 1.5, 2.5, o.skin); // nape of the neck
		}
		add(5.75, t + 1.5, 6.5, 3, o.hair); // back of head
		if (o.bun) {
			add(7.75, t + 3.5, 2.5, 2.25, o.hair); // bun knob
			add(7.75, t + 5, 2.5, 0.5, o.gown); // matching scrunchie
		} else {
			add(6, t + 4.5, 6, o.backLen, o.hair); // hair falling down the back
			add(6.5, t + 4.5 + o.backLen, 5, 0.75, o.hair);
		}
		crown(9);
		return r;
	}

	// side view (authored facing right; mirrored for left)
	gown(true);
	add(9.25 - ft * 0.5, t + 7.75, 0.75, 1.5, o.skin); // swinging hand
	add(7.25 - ft, 15.25, 1.5, 0.75, SHOE); // back foot
	add(9 + ft, 15.25, 1.5, 0.75, SHOE); // front foot
	add(9.5, t + 5.5, 1, 1.25, o.skin); // neck
	add(6.25, t + 1.5, 5, 3.25, o.hair); // hair mass over top + back
	if (o.bun) {
		add(5.5, t + 2.5, 1.25, 1.75, o.hair); // bun at the back
		add(5.75, t + 4, 1, 0.5, o.gown);
	} else {
		add(6, t + 4.5, 1.75, o.sideLock, o.hair); // hair down the back
		add(6.25, t + 4.5 + o.sideLock, 1.25, 0.75, o.hair);
	}
	add(9.25, t + 3, 2, 2.5, o.skin); // face (fringe above stays hair)
	add(11.25, t + 3.75, 0.5, 0.75, o.skin); // button nose
	if (p.blink) {
		add(10.25, t + 4, 0.75, 0.5, OUTLINE);
	} else {
		add(10.25, t + 3.75, 0.75, 0.75, OUTLINE);
	}
	add(9.5, t + 4.75, 0.5, 0.5, CHEEK);
	add(11, t + 5, 0.5, 0.5, MOUTH);
	crown(8.75);
	add(9.5 + sw, 14, 0.5, 0.5, o.glint);
	return r;
}

/* ------------------------------------------------------------------ */
/* King Daddy — gold tunic, cape, tidy beard                           */
/* ------------------------------------------------------------------ */

const K_HAIR = '#3d2f24';
const K_TUNIC = '#f6c177';
const K_TRIM = '#b07b2e';
const K_CAPE = '#524f67';
const K_CAPE_DARK = '#403d58';
const K_BOOT = '#3d2f24';
const K_GLINT = '#fff4cc';

function buildKing(view: View, p: Pose): Rect[] {
	const r: Rect[] = [];
	const add = (x: number, y: number, w: number, h: number, c: string): void => {
		r.push([x, y, w, h, c]);
	};
	const t = 2.5;
	const ft = p.moving ? (p.frame === 0 ? -0.5 : 0.5) : 0;
	// Walk frames: legs alternate length, the lifted boot rises 1px.
	const liftL = p.moving && p.frame === 1;
	const liftR = p.moving && p.frame === 0;

	const crown = (cx: number): void => {
		add(cx - 2.5, t + 0.75, 5, 1, K_TUNIC);
		add(cx - 2.25, t, 0.75, 0.75, K_TUNIC);
		add(cx - 0.5, t - 0.5, 1, 1.5, K_TUNIC);
		add(cx + 1.5, t, 0.75, 0.75, K_TUNIC);
		add(cx - 0.25, t + 1, 0.5, 0.5, K_GLINT);
	};

	if (view === 'down') {
		add(5.75, t + 6.5, 1, 4.5, K_CAPE); // cape at his sides
		add(11.25, t + 6.5, 1, 4.5, K_CAPE);
		add(7, t + 3.25, 4, 3.25, SKIN); // face
		add(6, t + 1.5, 6, 2.25, K_HAIR); // short hair
		add(6.75, t + 3.5, 0.75, 1.75, K_HAIR); // sideburns
		add(10.5, t + 3.5, 0.75, 1.75, K_HAIR);
		if (p.blink) {
			add(7.75, t + 4.75, 1, 0.5, OUTLINE);
			add(9.25, t + 4.75, 1, 0.5, OUTLINE);
		} else {
			add(7.75, t + 4.25, 1, 1, OUTLINE);
			add(9.25, t + 4.25, 1, 1, OUTLINE);
		}
		add(6.75, t + 5.25, 4.5, 1.5, K_HAIR); // tidy beard
		add(8.25, t + 6.75, 1.5, 0.5, K_HAIR);
		add(8.5, t + 5.5, 1, 0.5, MOUTH);
		crown(9);
		add(6.75, t + 6.5, 4.5, 3.25, K_TUNIC); // gold tunic
		add(8.75, t + 6.5, 0.5, 2.5, K_TRIM);
		add(6.75, t + 9, 4.5, 0.75, K_TRIM); // belt
		add(8.5, t + 9, 1, 0.75, K_GLINT); // buckle
		add(6, t + 8.5, 0.75, 1.25, SKIN); // hands over the cape
		add(11.25, t + 8.5, 0.75, 1.25, SKIN);
		add(7.5, t + 9.75, 1.25, liftL ? 2.5 : 3, K_CAPE); // legs
		add(9.25, t + 9.75, 1.25, liftR ? 2.5 : 3, K_CAPE);
		add(7.25, liftL ? 14.75 : 15.25, 1.75, 0.75, K_BOOT);
		add(9, liftR ? 14.75 : 15.25, 1.75, 0.75, K_BOOT);
		return r;
	}

	if (view === 'up') {
		add(7.5, 14.25, 1.25, 1, K_CAPE); // legs peeking under the cape
		add(9.25, 14.25, 1.25, 1, K_CAPE);
		add(7.25, liftL ? 14.75 : 15.25, 1.75, 0.75, K_BOOT);
		add(9, liftR ? 14.75 : 15.25, 1.75, 0.75, K_BOOT);
		add(5.75, t + 5.5, 6.5, 14.25 - (t + 5.5), K_CAPE); // flowing cape
		add(8.75, t + 6.75, 0.5, 5, K_CAPE_DARK); // cape fold
		add(5.75, t + 5.5, 6.5, 0.75, K_TRIM); // gold collar
		add(6, t + 1.5, 6, 4, K_HAIR); // back of head
		crown(9);
		return r;
	}

	// side view (authored facing right)
	add(6, t + 6, 1.75, 6, K_CAPE); // cape trailing behind
	add(6.5, t + 7, 0.5, 4.5, K_CAPE_DARK);
	add(7.25 - ft, 12.25, 1.25, liftL ? 2.5 : 3, K_CAPE); // back leg
	add(9.5 + ft, 12.25, 1.25, liftR ? 2.5 : 3, K_CAPE); // front leg
	add(7 - ft, liftL ? 14.75 : 15.25, 1.75, 0.75, K_BOOT);
	add(9.25 + ft, liftR ? 14.75 : 15.25, 1.75, 0.75, K_BOOT);
	add(7.5, t + 6.5, 3.5, 2.5, K_TUNIC); // tunic
	add(7.25, t + 9.75, 3.75, 0.75, K_TUNIC); // tunic skirt over the legs
	add(7.5, t + 9, 3.5, 0.75, K_TRIM); // belt
	add(8.75, t + 9, 0.75, 0.75, K_GLINT);
	add(9.5, t + 5.25, 1, 1.25, SKIN); // neck
	add(6.5, t + 1.5, 5, 2.5, K_HAIR); // hair
	add(9.25, t + 3, 2.25, 2.25, SKIN); // face
	add(11.5, t + 3.75, 0.5, 0.75, SKIN); // nose
	if (p.blink) {
		add(10.25, t + 4, 0.75, 0.5, OUTLINE);
	} else {
		add(10.25, t + 3.75, 0.75, 0.75, OUTLINE);
	}
	add(8.75, t + 3.75, 0.75, 1.5, K_HAIR); // sideburn
	add(9.25, t + 5, 2.5, 1.25, K_HAIR); // beard along the jaw
	add(11, t + 4.75, 0.5, 0.5, MOUTH);
	crown(8.75);
	add(9 - ft * 0.5, t + 7, 1.25, 1.75, K_TUNIC); // swinging arm
	add(9 - ft * 0.5, t + 8.25, 1.25, 0.5, K_TRIM); // cuff
	add(9.25 - ft * 0.5, t + 8.75, 0.75, 1, SKIN); // hand
	return r;
}

/* ------------------------------------------------------------------ */
/* Prince Ollie — a miniature Australian Shepherd (quadruped!)         */
/* ------------------------------------------------------------------ */

const D_BODY = '#8a8fa3';
const D_PATCH = '#524f67';
const D_WHITE = '#e0def4';
const D_BAND = '#9ccfd8';
const D_EAR = '#d7a98c';
const D_TONGUE = '#eb6f92';

function buildDog(view: View, p: Pose): Rect[] {
	const r: Rect[] = [];
	const add = (x: number, y: number, w: number, h: number, c: string): void => {
		r.push([x, y, w, h, c]);
	};
	const ft = p.moving ? (p.frame === 0 ? -0.5 : 0.5) : 0;
	// The famous stub tail: always wagging, ~3 wags a second, 1px snaps.
	const wag = Math.sin(p.now / 110 + p.phase * 3) > 0 ? 0.5 : -0.5;

	if (view === 'down') {
		add(6.25, 6.75, 0.75, 0.75, D_PATCH); // ear tips
		add(11, 6.75, 0.75, 0.75, D_PATCH);
		add(6, 7.25, 1.5, 1.75, D_BODY); // perky ears
		add(10.5, 7.25, 1.5, 1.75, D_BODY);
		add(6.5, 7.75, 0.5, 1, D_EAR); // inner ears
		add(11, 7.75, 0.5, 1, D_EAR);
		add(6, 8.5, 6, 3.25, D_BODY); // head
		add(6, 8.5, 1.75, 1.5, D_PATCH); // blue-merle patches
		add(10.25, 8.75, 1.75, 1.25, D_PATCH);
		add(8.5, 8.5, 1, 2, D_WHITE); // white blaze
		if (p.blink) {
			add(7.25, 10.25, 1, 0.5, OUTLINE);
			add(9.75, 10.25, 1, 0.5, OUTLINE);
		} else {
			add(7.25, 9.75, 1, 1, OUTLINE);
			add(9.75, 9.75, 1, 1, OUTLINE);
		}
		add(7.75, 10.75, 2.5, 1, D_WHITE); // muzzle
		add(8.5, 10.75, 1, 0.75, OUTLINE); // nose
		add(6.5, 12.5, 5, 2.75, D_BODY); // chest + body
		add(8, 12.5, 2, 2.75, D_WHITE); // white chest
		add(6.5, 13.25, 1.25, 1.5, D_PATCH);
		add(6.5, 11.75, 5, 0.75, D_BAND); // foam-teal bandana
		add(7.75, 12.5, 2.5, 1, D_BAND);
		add(8.5, 13.5, 1, 0.5, D_BAND);
		if (p.moving) add(8.75, 11.75, 0.75, 1, D_TONGUE); // happy trot tongue
		add(6.75 + ft, 15.25, 1.5, 0.75, D_WHITE); // white paws
		add(9.75 - ft, 15.25, 1.5, 0.75, D_WHITE);
		return r;
	}

	if (view === 'up') {
		add(6.25, 6.75, 0.75, 0.75, D_PATCH);
		add(11, 6.75, 0.75, 0.75, D_PATCH);
		add(6, 7.25, 1.5, 1.75, D_BODY);
		add(10.5, 7.25, 1.5, 1.75, D_BODY);
		add(6, 8.5, 6, 3, D_BODY); // back of head
		add(9.25, 8.5, 2.25, 1.5, D_PATCH);
		add(6.5, 11.5, 5, 3.75, D_BODY); // back
		add(6.75, 12.25, 1.5, 1.25, D_PATCH);
		add(9.5, 13.5, 1.5, 1.25, D_PATCH);
		add(8, 11.5, 2, 0.75, D_BAND); // bandana knot
		add(8.5, 12.25, 1, 0.5, D_BAND);
		add(8.5 + wag, 14.75, 1, 1.25, D_BODY); // wagging stub tail
		add(8.75 + wag, 14.75, 0.5, 0.5, D_WHITE);
		add(6.75 + ft, 15.25, 1.25, 0.75, D_WHITE); // hind paws
		add(10 - ft, 15.25, 1.25, 0.75, D_WHITE);
		return r;
	}

	// side view (authored facing right) — a proper trotting quadruped.
	const trotA = p.moving && p.frame === 0; // diagonal pair A lifted
	const trotB = p.moving && p.frame === 1; // diagonal pair B lifted
	const leg = (x: number, lifted: boolean): void => {
		add(x, 14, 1, lifted ? 0.75 : 1.25, D_BODY);
		add(x - 0.25, lifted ? 14.75 : 15.25, 1.5, 0.75, D_WHITE);
	};
	add(4.75, 10.5 + wag, 1.25, 1, D_BODY); // wagging stub tail
	add(4.75, 10.5 + wag, 0.5, 0.5, D_WHITE);
	add(5.5, 10.75, 8, 3.25, D_BODY); // body
	add(6.25, 11, 2, 1.5, D_PATCH); // merle patches
	add(9, 12.25, 1.75, 1.25, D_PATCH);
	add(12, 11.5, 1.5, 2, D_WHITE); // white chest
	leg(6, trotB); // back-rear + front-front move together…
	leg(7.75, trotA); // …against back-front + front-rear (a trot!)
	leg(10.25, trotA);
	leg(12, trotB);
	add(10.75, 7, 1, 1.25, D_PATCH); // far ear
	add(10.5, 8, 2.75, 2.75, D_BODY); // head
	add(12, 6.75, 1, 1.5, D_BODY); // near ear, perky
	add(12.25, 6.5, 0.5, 0.5, D_PATCH);
	add(10.5, 8, 1.25, 1, D_PATCH); // patch over the ear
	add(12.5, 8, 0.75, 1.5, D_WHITE); // blaze
	add(13.25, 8.75, 1.25, 1, D_WHITE); // snout
	add(14.25, 8.75, 0.5, 0.75, OUTLINE); // nose
	if (p.blink) {
		add(12, 9.25, 0.75, 0.5, OUTLINE);
	} else {
		add(12, 8.75, 0.75, 0.75, OUTLINE);
	}
	add(10.25, 9.75, 1, 1.5, D_BAND); // bandana
	add(10, 11.25, 1.75, 1.25, D_BAND);
	add(10.5, 12.5, 0.75, 0.5, D_BAND);
	if (p.moving) add(14, 9.75, 0.5, 1, D_TONGUE); // tongue out while trotting
	return r;
}
