import type { AreaDef, Critter, CritterKind, TileKind } from './types';

// Ambient critter simulation: butterflies, bees, drifting petals, dragonflies
// and the occasional bird flying over. Everything here is per-session eye candy
// — nothing persists. Coordinates are tile-space floats in the same convention
// as the player (integer coords = a tile), and all motion is dt-scaled.

/** Target population for each kind in an area that lists it. */
const POPULATION: Record<CritterKind, { min: number; max: number }> = {
	butterfly: { min: 2, max: 4 },
	bee: { min: 1, max: 3 },
	petal: { min: 3, max: 5 },
	dragonfly: { min: 1, max: 2 },
	bird: { min: 0, max: 2 }
};

/** Average seconds between bird fly-overs (memoryless, lands around 8-15s). */
const BIRD_EVERY_S = 11;
/** Average seconds before a missing critter (e.g. a caught butterfly) is replaced. */
const RESPAWN_EVERY_S = 3;

const FLOWERY: readonly TileKind[] = [
	'grass',
	'flower-bed',
	'lavender',
	'bluebonnet',
	'rose-plot',
	'berry-bush',
	'dune-grass'
];
const BEE_FLOWERS: readonly TileKind[] = ['lavender', 'bluebonnet', 'flower-bed'];
const WATERY: readonly TileKind[] = ['water'];

interface Point {
	x: number;
	y: number;
}

function rand(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
	return min + Math.floor(Math.random() * (max - min + 1));
}

function clamp(n: number, min: number, max: number): number {
	return n < min ? min : n > max ? max : n;
}

function frac(n: number): number {
	return n - Math.floor(n);
}

function finite(n: number, fallback: number): number {
	return Number.isFinite(n) ? n : fallback;
}

// --- Tile anchors ---------------------------------------------------------
// Critters wander between "anchor" tiles (flowers for butterflies, water for
// dragonflies…). Anchor lists are static per area, so cache them.

const anchorCache = new Map<string, Point[]>();

function anchorsFor(area: AreaDef, label: string, kinds: readonly TileKind[]): Point[] {
	const key = `${area.id}:${label}`;
	const cached = anchorCache.get(key);
	if (cached) return cached;
	let points = collectTiles(area, kinds);
	if (points.length === 0) points = collectTiles(area, FLOWERY);
	if (points.length === 0) points = [{ x: area.width / 2, y: area.height / 2 }];
	anchorCache.set(key, points);
	return points;
}

function collectTiles(area: AreaDef, kinds: readonly TileKind[]): Point[] {
	const points: Point[] = [];
	for (let y = 0; y < area.height; y++) {
		for (let x = 0; x < area.width; x++) {
			if (kinds.includes(area.tiles[y * area.width + x])) points.push({ x, y });
		}
	}
	return points;
}

/** Stable per-critter waypoint that hops to a new anchor every `periodMs`. */
function waypoint(anchors: Point[], phase: number, now: number, periodMs: number): Point {
	const idx = Math.floor(phase * 37 + now / periodMs) % anchors.length;
	return anchors[idx];
}

// --- Motion helpers -------------------------------------------------------

/** Softly turn the velocity toward a target point. Never snaps. */
function steer(
	vx: number,
	vy: number,
	dx: number,
	dy: number,
	speed: number,
	turn: number,
	dt: number
): [number, number] {
	const len = Math.hypot(dx, dy);
	if (len > 1e-4) {
		const t = Math.min(1, turn * dt);
		vx += ((dx / len) * speed - vx) * t;
		vy += ((dy / len) * speed - vy) * t;
	}
	return [vx, vy];
}

/** Gentle push back toward the map when drifting near an edge. */
function edgeNudge(
	x: number,
	y: number,
	area: AreaDef,
	vx: number,
	vy: number,
	dt: number
): [number, number] {
	const m = 1;
	if (x < m) vx += (m - x) * 3 * dt;
	if (x > area.width - 1 - m) vx -= (x - (area.width - 1 - m)) * 3 * dt;
	if (y < m) vy += (m - y) * 3 * dt;
	if (y > area.height - 1 - m) vy -= (y - (area.height - 1 - m)) * 3 * dt;
	return [vx, vy];
}

/** Integrate one step. `mx/my` is the visible motion; `vx/vy` is what we store. */
function move(
	c: Critter,
	vx: number,
	vy: number,
	mx: number,
	my: number,
	area: AreaDef,
	dt: number
): Critter {
	return {
		...c,
		x: clamp(finite(c.x + mx * dt, c.x), -2, area.width + 2),
		y: clamp(finite(c.y + my * dt, c.y), -2, area.height + 2),
		vx: finite(vx, 0),
		vy: finite(vy, 0)
	};
}

// --- Per-kind behaviors ---------------------------------------------------

function stepButterfly(c: Critter, area: AreaDef, now: number, dt: number): Critter {
	const target = waypoint(anchorsFor(area, 'flowery', FLOWERY), c.phase, now, 5200);
	const speed = 0.55 + frac(c.phase * 0.137) * 0.4; // 0.55..0.95 tiles/s, stable per critter
	let [vx, vy] = steer(c.vx, c.vy, target.x - c.x, target.y - c.y, speed, 1.4, dt);
	[vx, vy] = edgeNudge(c.x, c.y, area, vx, vy, dt);
	const bob = Math.sin(now / 260 + c.phase) * 0.35; // fluttery vertical wobble
	return move(c, vx, vy, vx, vy + bob, area, dt);
}

function stepBee(c: Critter, area: AreaDef, now: number, dt: number): Critter {
	const target = waypoint(anchorsFor(area, 'bee', BEE_FLOWERS), c.phase, now, 2400);
	const speed = 1.1 + frac(c.phase * 0.211) * 0.5;
	let [vx, vy] = steer(c.vx, c.vy, target.x - c.x, target.y - c.y, speed, 3, dt);
	[vx, vy] = edgeNudge(c.x, c.y, area, vx, vy, dt);
	// Little orbit pauses: throttle down periodically instead of stopping dead.
	const pulse = 0.25 + 0.75 * Math.abs(Math.sin(now / 850 + c.phase));
	const zigX = Math.sin(now / 110 + c.phase) * 0.5;
	const zigY = Math.cos(now / 140 + c.phase) * 0.5;
	return move(c, vx, vy, vx * pulse + zigX, vy * pulse + zigY, area, dt);
}

function stepPetal(c: Critter, area: AreaDef, now: number, dt: number): Critter {
	// Reached the bottom: recycle back to the tree-line up top.
	if (c.y > area.height - 0.5) return makePetal(area, now, true);
	const vy = 0.3 + frac(c.phase * 0.071) * 0.25; // lazy fall
	const vx = Math.sin(now / 1100 + c.phase) * 0.35; // sideways sway
	return move(c, vx, vy, vx, vy, area, dt);
}

function stepDragonfly(c: Critter, area: AreaDef, now: number, dt: number): Critter {
	const cycle = (now / 1000 + frac(c.phase) * 7) % 3.2;
	const darting = cycle < 1.1;
	let vx = c.vx;
	let vy = c.vy;
	if (darting) {
		const target = waypoint(anchorsFor(area, 'water', WATERY), c.phase, now, 3200);
		[vx, vy] = steer(vx, vy, target.x - c.x, target.y - c.y, 2.6, 5, dt);
		return move(c, vx, vy, vx, vy, area, dt);
	}
	// Hover: bleed off speed quickly, keep a tiny shimmer.
	const damp = Math.min(1, 6 * dt);
	vx += (0 - vx) * damp;
	vy += (0 - vy) * damp;
	const hovX = Math.sin(now / 90 + c.phase) * 0.12;
	const hovY = Math.cos(now / 120 + c.phase) * 0.12;
	return move(c, vx, vy, vx + hovX, vy + hovY, area, dt);
}

function stepBird(c: Critter, area: AreaDef, dt: number): Critter | null {
	const x = c.x + c.vx * dt;
	const y = c.y + c.vy * dt;
	// Fully past the map edge: gone.
	if (x < -1.9 || x > area.width + 1.9 || y < -1.9 || y > area.height + 1.9) return null;
	return { ...c, x, y };
}

function stepCritter(c: Critter, area: AreaDef, now: number, dt: number): Critter | null {
	switch (c.kind) {
		case 'butterfly':
			return stepButterfly(c, area, now, dt);
		case 'bee':
			return stepBee(c, area, now, dt);
		case 'petal':
			return stepPetal(c, area, now, dt);
		case 'dragonfly':
			return stepDragonfly(c, area, now, dt);
		case 'bird':
			return stepBird(c, area, dt);
	}
}

// --- Spawning -------------------------------------------------------------

function makePetal(area: AreaDef, now: number, atTop: boolean): Critter {
	return {
		kind: 'petal',
		x: rand(1, area.width - 2),
		y: atTop ? rand(-1, 0.3) : rand(0.5, area.height - 2),
		vx: 0,
		vy: 0.35,
		phase: Math.random() * 1000,
		spawnedAt: now
	};
}

function makeBird(area: AreaDef, now: number): Critter {
	const fromLeft = Math.random() < 0.5;
	const speed = rand(2.2, 3.2);
	return {
		kind: 'bird',
		x: fromLeft ? -1.5 : area.width + 0.5,
		y: rand(1, area.height - 2),
		vx: fromLeft ? speed : -speed,
		vy: rand(-0.35, 0.35),
		phase: Math.random() * 1000,
		spawnedAt: now
	};
}

function makeCritter(kind: CritterKind, area: AreaDef, now: number): Critter {
	if (kind === 'petal') return makePetal(area, now, false);
	if (kind === 'bird') return makeBird(area, now);
	const anchors =
		kind === 'dragonfly'
			? anchorsFor(area, 'water', WATERY)
			: kind === 'bee'
			? anchorsFor(area, 'bee', BEE_FLOWERS)
			: anchorsFor(area, 'flowery', FLOWERY);
	const home = anchors[Math.floor(Math.random() * anchors.length)];
	return {
		kind,
		x: clamp(home.x + rand(-0.8, 0.8), 0, area.width - 1),
		y: clamp(home.y + rand(-0.8, 0.8), 0, area.height - 1),
		vx: rand(-0.3, 0.3),
		vy: rand(-0.3, 0.3),
		phase: Math.random() * 1000,
		spawnedAt: now
	};
}

/** Initial population when entering an area. Birds fly in later on their own. */
export function spawnCritters(area: AreaDef, now: number): Critter[] {
	const out: Critter[] = [];
	for (const kind of area.critters ?? []) {
		if (kind === 'bird') continue;
		const pop = POPULATION[kind];
		const n = randInt(pop.min, pop.max);
		for (let i = 0; i < n; i++) out.push(makeCritter(kind, area, now));
	}
	return out;
}

/** Advance one frame. Pure: returns a new array (may add/remove critters). */
export function updateCritters(
	critters: Critter[],
	area: AreaDef,
	now: number,
	dtMs: number
): Critter[] {
	// Clamp dt so a backgrounded tab doesn't fling everything off-map.
	const dt = clamp(dtMs, 0, 100) / 1000;
	const out: Critter[] = [];
	for (const c of critters) {
		const next = stepCritter(c, area, now, dt);
		if (next) out.push(next);
	}
	// Keep populations topped up — gradually, at most one newcomer per kind
	// per frame, on a memoryless timer so respawns feel unscripted.
	for (const kind of area.critters ?? []) {
		const pop = POPULATION[kind];
		let n = 0;
		for (const c of out) if (c.kind === kind) n++;
		if (kind === 'bird') {
			if (n < pop.max && Math.random() < dt / BIRD_EVERY_S) out.push(makeBird(area, now));
		} else if (n < pop.min && Math.random() < dt / RESPAWN_EVERY_S) {
			out.push(makeCritter(kind, area, now));
		}
	}
	return out;
}

/** Catchable butterfly at/near tile (x,y), if any (within ~0.6 tiles). */
export function butterflyAt(critters: Critter[], x: number, y: number): Critter | null {
	let best: Critter | null = null;
	let bestDist = Infinity;
	for (const c of critters) {
		if (c.kind !== 'butterfly') continue;
		const dx = c.x - x;
		const dy = c.y - y;
		if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6) continue;
		const dist = dx * dx + dy * dy;
		if (dist < bestDist) {
			bestDist = dist;
			best = c;
		}
	}
	return best;
}
