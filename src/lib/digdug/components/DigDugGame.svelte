<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { characters } from '$lib/characters';
	import type { Character, CharacterId } from '$lib/characters';
	import type { Enemy, Facing, GameState } from '../types';
	import { GRID_H, GRID_W, isOpen, tileAt, tileIndex } from '../types';
	import { makeLevel, rockSupportedAt } from '../level';
	import { draw, gridPixelSize } from '../render';

	export let characterId: CharacterId;
	export let onExit: () => void;

	const HARPOON_MAX = 2; // cells of reach
	const HARPOON_EXTEND_MS = 110;
	const HARPOON_RETRACT_MS = 90;
	const PUMP_INTERVAL_MS = 220;
	const POP_AT_LEVEL = 4;
	const DEFLATE_AFTER_MS = 700; // after disconnect, start deflating
	const DEFLATE_STEP_MS = 600;
	const ROCK_WOBBLE_MS = 700;
	const ROCK_FALL_CELLS_PER_SEC = 9;
	const FYGAR_FIRE_COOLDOWN_MS = 4500;
	const FYGAR_FIRE_DURATION_MS = 900;
	const FYGAR_FIRE_RANGE = 2;
	const GHOST_STUCK_MS = 1800;

	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let raf = 0;

	$: character = characters[characterId] as Character;
	$: canvasSize = gridPixelSize();

	let state: GameState;
	state = makeLevel(characterId, 1, 0, 3, 0);

	const heldDirs = new Set<Facing>();
	let lastDir: Facing | null = null;
	let firingHeld = false;
	let lastPumpAt = 0;
	// Tracks when each enemy last had a successful movement, used to flip
	// stuck enemies into ghost mode.
	const enemyLastMoveAt: Record<string, number> = {};

	const KEY_TO_DIR: Record<string, Facing> = {
		ArrowUp: 'up',
		ArrowDown: 'down',
		ArrowLeft: 'left',
		ArrowRight: 'right',
		w: 'up',
		W: 'up',
		s: 'down',
		S: 'down',
		a: 'left',
		A: 'left',
		d: 'right',
		D: 'right'
	};

	function dirDelta(d: Facing): { dx: number; dy: number } {
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

	function inBounds(x: number, y: number): boolean {
		return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
	}

	function playerIsMoving(now: number): boolean {
		return now - state.playerMoveStartedAt < state.playerMoveMs;
	}

	function enemyAtCell(x: number, y: number): Enemy | null {
		return (
			state.enemies.find(
				(e) => e.state !== 'popping' && e.cellX === x && e.cellY === y
			) ?? null
		);
	}

	function rockAtCell(x: number, y: number) {
		return state.rocks.find(
			(r) => r.state !== 'broken' && Math.floor(r.cellY) === y && r.cellX === x
		);
	}

	function tryStartPlayerMove(dir: Facing, now: number) {
		if (state.status !== 'playing') return;
		if (state.harpoon) return; // can't move while harpoon is out
		if (playerIsMoving(now)) return;

		state.playerFacing = dir;
		const { dx, dy } = dirDelta(dir);
		const tx = state.playerCellX + dx;
		const ty = state.playerCellY + dy;
		if (!inBounds(tx, ty)) return;
		// Don't walk into a rock cell.
		if (rockAtCell(tx, ty)) return;

		// Dig dirt by moving into it. After this move the cell is a tunnel.
		const target = tileAt(state.grid, tx, ty);
		if (target === null) return;
		state.grid[tileIndex(tx, ty)] = target === 'sky' ? 'sky' : 'tunnel';

		state.playerFromX = state.playerCellX;
		state.playerFromY = state.playerCellY;
		state.playerCellX = tx;
		state.playerCellY = ty;
		state.playerMoveStartedAt = now;
		state = state;
	}

	function startFire(now: number) {
		if (state.status !== 'playing') return;
		if (state.harpoon) return;
		if (playerIsMoving(now)) return;

		const { dx, dy } = dirDelta(state.playerFacing);
		// Harpoon needs an open cell directly in front to start (player can't
		// shoot through dirt or rocks).
		const fx = state.playerCellX + dx;
		const fy = state.playerCellY + dy;
		if (!inBounds(fx, fy)) return;
		if (!isOpen(tileAt(state.grid, fx, fy))) return;
		if (rockAtCell(fx, fy)) return;

		state.harpoon = {
			originX: state.playerCellX,
			originY: state.playerCellY,
			dir: state.playerFacing,
			length: 0,
			animProgress: 0,
			animStartedAt: now,
			animFromLength: 0,
			animToLength: 1,
			connectedEnemyId: null,
			retracting: false,
			lastPumpAt: 0
		};
		state = state;
	}

	function retractHarpoon(now: number) {
		if (!state.harpoon) return;
		// Disconnect any pumping enemy — they'll deflate.
		if (state.harpoon.connectedEnemyId) {
			const e = state.enemies.find((x) => x.id === state.harpoon!.connectedEnemyId);
			if (e && e.state === 'inflated' && e.inflateLevel < POP_AT_LEVEL) {
				e.inflateUntilDeflate = now + DEFLATE_AFTER_MS;
			}
		}
		state.harpoon.retracting = true;
		state.harpoon.animFromLength = state.harpoon.length;
		state.harpoon.animToLength = 0;
		state.harpoon.animStartedAt = now;
		state.harpoon.animProgress = 0;
		state.harpoon.connectedEnemyId = null;
		state = state;
	}

	function tickHarpoon(now: number) {
		if (!state.harpoon) return;
		const h = state.harpoon;
		const dur = h.retracting ? HARPOON_RETRACT_MS : HARPOON_EXTEND_MS;
		h.animProgress = Math.min(1, (now - h.animStartedAt) / dur);

		if (h.animProgress >= 1) {
			h.length = h.animToLength;

			if (h.retracting) {
				if (h.length <= 0) {
					state.harpoon = null;
					state = state;
					return;
				}
				// Next retract step (no, we retract all the way in one go).
				h.animFromLength = h.length;
				h.animToLength = 0;
				h.animStartedAt = now;
				h.animProgress = 0;
			} else if (h.connectedEnemyId === null) {
				// Probe next cell.
				const { dx, dy } = dirDelta(h.dir);
				const tx = h.originX + dx * h.length;
				const ty = h.originY + dy * h.length;
				const probedEnemy = enemyAtCell(tx, ty);
				if (probedEnemy && probedEnemy.state !== 'ghost') {
					h.connectedEnemyId = probedEnemy.id;
					probedEnemy.state = 'inflated';
					probedEnemy.inflateLevel = Math.max(1, probedEnemy.inflateLevel);
					probedEnemy.inflateUntilDeflate = now + DEFLATE_AFTER_MS;
					lastPumpAt = now;
					state = state;
				} else if (h.length >= HARPOON_MAX) {
					retractHarpoon(now);
				} else {
					// Check the cell we're about to extend into.
					const nx = h.originX + dx * (h.length + 1);
					const ny = h.originY + dy * (h.length + 1);
					if (!inBounds(nx, ny) || !isOpen(tileAt(state.grid, nx, ny)) || rockAtCell(nx, ny)) {
						retractHarpoon(now);
					} else {
						h.animFromLength = h.length;
						h.animToLength = h.length + 1;
						h.animStartedAt = now;
						h.animProgress = 0;
					}
				}
			}
		}
		state = state;
	}

	function pumpConnected(now: number) {
		if (!state.harpoon || !state.harpoon.connectedEnemyId) return;
		if (now - lastPumpAt < PUMP_INTERVAL_MS) return;
		const e = state.enemies.find((x) => x.id === state.harpoon!.connectedEnemyId);
		if (!e) {
			retractHarpoon(now);
			return;
		}
		e.inflateLevel = Math.min(POP_AT_LEVEL, e.inflateLevel + 1);
		e.inflateUntilDeflate = now + DEFLATE_AFTER_MS;
		lastPumpAt = now;
		if (e.inflateLevel >= POP_AT_LEVEL) {
			e.state = 'popping';
			e.inflateUntilDeflate = now;
			state.score += e.points;
			retractHarpoon(now);
		}
		state = state;
	}

	function tickEnemies(now: number) {
		for (const e of state.enemies) {
			if (e.state === 'popping') {
				// Remove after the pop animation.
				if (now - e.inflateUntilDeflate > 260) {
					state.enemies = state.enemies.filter((x) => x !== e);
					state = state;
				}
				continue;
			}

			// Inflated enemies don't move; they deflate after a grace period.
			if (e.state === 'inflated') {
				const connected = state.harpoon?.connectedEnemyId === e.id;
				if (!connected && now - e.inflateUntilDeflate > DEFLATE_STEP_MS) {
					e.inflateLevel -= 1;
					e.inflateUntilDeflate = now;
					if (e.inflateLevel <= 0) {
						e.state = 'roaming';
						e.moveStartedAt = now;
						e.moveFromX = e.cellX;
						e.moveFromY = e.cellY;
					}
				}
				continue;
			}

			// Movement timing.
			const elapsed = now - e.moveStartedAt;
			if (elapsed < e.moveMs) continue;

			// Decide next cell.
			const open = openNeighbors(e.cellX, e.cellY);
			let nextDir: Facing | null = null;

			if (e.state === 'ghost') {
				// Move directly toward player, ignoring tiles.
				nextDir = stepTowardPlayer(e);
				const { dx, dy } = dirDelta(nextDir);
				const tx = e.cellX + dx;
				const ty = e.cellY + dy;
				if (!inBounds(tx, ty)) {
					nextDir = null;
				} else {
					// If we step onto a tunnel/sky cell, materialize back to roaming.
					if (isOpen(tileAt(state.grid, tx, ty)) && !rockAtCell(tx, ty)) {
						e.state = 'roaming';
					}
					moveEnemyTo(e, tx, ty, now);
					enemyLastMoveAt[e.id] = now;
					continue;
				}
			}

			// Roaming: prefer direction toward player among open neighbors.
			const ordered = preferredDirs(e);
			for (const d of ordered) {
				if (open.has(d)) {
					nextDir = d;
					break;
				}
			}
			// If totally stuck, pick any open. If still none, consider going ghost.
			if (!nextDir) {
				const any = [...open][0];
				if (any) {
					nextDir = any;
				} else {
					const stuckSince = enemyLastMoveAt[e.id] ?? e.moveStartedAt;
					if (now - stuckSince > GHOST_STUCK_MS) {
						e.state = 'ghost';
						e.moveStartedAt = now;
					}
					continue;
				}
			}

			const { dx, dy } = dirDelta(nextDir);
			const tx = e.cellX + dx;
			const ty = e.cellY + dy;
			if (!inBounds(tx, ty)) continue;
			// Avoid stepping onto a rock or another enemy.
			if (rockAtCell(tx, ty)) continue;
			if (enemyAtCell(tx, ty)) continue;
			moveEnemyTo(e, tx, ty, now);
			enemyLastMoveAt[e.id] = now;

			// Fygar fire breath check after move.
			if (e.kind === 'fygar' && now - e.fireAt > FYGAR_FIRE_COOLDOWN_MS) {
				if (sameRowFacingPlayer(e)) {
					breatheFire(e, now);
				}
			}
		}
	}

	function moveEnemyTo(e: Enemy, tx: number, ty: number, now: number) {
		e.moveFromX = e.cellX;
		e.moveFromY = e.cellY;
		e.cellX = tx;
		e.cellY = ty;
		e.moveStartedAt = now;
		// Facing follows movement.
		if (tx > e.moveFromX) e.facing = 'right';
		else if (tx < e.moveFromX) e.facing = 'left';
		else if (ty > e.moveFromY) e.facing = 'down';
		else if (ty < e.moveFromY) e.facing = 'up';
		state = state;
	}

	function openNeighbors(x: number, y: number): Set<Facing> {
		const dirs: Facing[] = ['up', 'down', 'left', 'right'];
		const out = new Set<Facing>();
		for (const d of dirs) {
			const { dx, dy } = dirDelta(d);
			const nx = x + dx;
			const ny = y + dy;
			if (!inBounds(nx, ny)) continue;
			if (!isOpen(tileAt(state.grid, nx, ny))) continue;
			if (rockAtCell(nx, ny)) continue;
			if (enemyAtCell(nx, ny)) continue;
			out.add(d);
		}
		return out;
	}

	function preferredDirs(e: Enemy): Facing[] {
		const dxToPlayer = state.playerCellX - e.cellX;
		const dyToPlayer = state.playerCellY - e.cellY;
		const horiz: Facing = dxToPlayer >= 0 ? 'right' : 'left';
		const vert: Facing = dyToPlayer >= 0 ? 'down' : 'up';
		const horizOpp: Facing = horiz === 'right' ? 'left' : 'right';
		const vertOpp: Facing = vert === 'down' ? 'up' : 'down';
		// Prefer the larger-axis distance first.
		if (Math.abs(dxToPlayer) >= Math.abs(dyToPlayer)) {
			return [horiz, vert, vertOpp, horizOpp];
		}
		return [vert, horiz, horizOpp, vertOpp];
	}

	function stepTowardPlayer(e: Enemy): Facing {
		const dxToPlayer = state.playerCellX - e.cellX;
		const dyToPlayer = state.playerCellY - e.cellY;
		if (Math.abs(dxToPlayer) >= Math.abs(dyToPlayer)) {
			return dxToPlayer >= 0 ? 'right' : 'left';
		}
		return dyToPlayer >= 0 ? 'down' : 'up';
	}

	function sameRowFacingPlayer(e: Enemy): boolean {
		if (e.cellY !== state.playerCellY) return false;
		const dx = state.playerCellX - e.cellX;
		if (dx === 0) return false;
		const dir: Facing = dx > 0 ? 'right' : 'left';
		if (Math.abs(dx) > FYGAR_FIRE_RANGE) return false;
		// Check no dirt/rock blocks the line of sight.
		const step = dx > 0 ? 1 : -1;
		for (let x = e.cellX + step; x !== state.playerCellX; x += step) {
			if (!isOpen(tileAt(state.grid, x, e.cellY))) return false;
			if (rockAtCell(x, e.cellY)) return false;
		}
		e.facing = dir;
		return true;
	}

	function breatheFire(e: Enemy, now: number) {
		e.fireAt = now;
		e.fireFromCellX = e.cellX;
		e.fireFromCellY = e.cellY;
		e.fireFacing = e.facing;
		state.fire = {
			cellX: e.cellX,
			cellY: e.cellY,
			dir: e.facing,
			cells: FYGAR_FIRE_RANGE,
			startedAt: now,
			durationMs: FYGAR_FIRE_DURATION_MS
		};
		state = state;
	}

	function tickFire(now: number) {
		if (!state.fire) return;
		const f = state.fire;
		if (now - f.startedAt > f.durationMs) {
			state.fire = null;
			state = state;
			return;
		}
		// Check if any of the fire cells overlap the player.
		const { dx, dy } = dirDelta(f.dir);
		for (let i = 1; i <= f.cells; i++) {
			const cx = f.cellX + dx * i;
			const cy = f.cellY + dy * i;
			if (cx === state.playerCellX && cy === state.playerCellY) {
				killPlayer(now);
				return;
			}
		}
	}

	function tickRocks(now: number) {
		for (const rock of state.rocks) {
			if (rock.state === 'broken') continue;
			if (rock.state === 'resting') {
				// Begin wobbling if dirt directly below is gone.
				if (!rockSupportedAt(state.grid, rock.cellX, Math.floor(rock.cellY))) {
					rock.state = 'wobble';
					rock.stateStartedAt = now;
				}
				continue;
			}
			if (rock.state === 'wobble') {
				// Still unsupported after wobble window → fall.
				if (!rockSupportedAt(state.grid, rock.cellX, Math.floor(rock.cellY))) {
					if (now - rock.stateStartedAt >= ROCK_WOBBLE_MS) {
						rock.state = 'falling';
						rock.stateStartedAt = now;
					}
				} else {
					// Got re-supported somehow (e.g. another rock landed below). Rest.
					rock.state = 'resting';
				}
				continue;
			}
			if (rock.state === 'falling') {
				// Advance fall.
				const dt = 1 / 60;
				rock.cellY += ROCK_FALL_CELLS_PER_SEC * dt;
				const cy = Math.floor(rock.cellY);

				// Crush anything we pass through.
				for (const e of state.enemies) {
					if (e.state === 'popping') continue;
					if (rock.crushed.has(e.id)) continue;
					if (e.cellX === rock.cellX && e.cellY === cy) {
						rock.crushed.add(e.id);
						e.state = 'popping';
						e.inflateUntilDeflate = now;
						// Crush bonus scales with stack of crushed enemies.
						const bonusTable = [1000, 2500, 4000, 6000];
						const tier = Math.min(rock.crushed.size - 1, bonusTable.length - 1);
						state.score += bonusTable[tier];
					}
				}
				// Crush the player.
				if (rock.cellX === state.playerCellX && cy === state.playerCellY) {
					killPlayer(now);
				}

				// Stop when next cell down is dirt (off-grid, or solid).
				const below = tileAt(state.grid, rock.cellX, cy + 1);
				if (cy >= GRID_H - 1 || below === 'dirt' || below === null) {
					rock.cellY = cy; // snap
					rock.state = 'broken';
					rock.stateStartedAt = now;
				}
			}
		}
	}

	function killPlayer(now: number) {
		if (state.status !== 'playing') return;
		state.status = 'dying';
		state.statusStartedAt = now;
		state.harpoon = null;
		state.fire = null;
		state = state;
	}

	function checkLevelClear(now: number) {
		if (state.status !== 'playing') return;
		if (state.enemies.length === 0) {
			// Award a small completion bonus.
			state.score += 1000 + state.level * 500;
			state.status = 'level-clear';
			state.statusStartedAt = now;
			state.banner = {
				text: `LEVEL ${state.level} CLEARED!`,
				accent: 'var(--rp-gold)',
				expiresAt: now + 1800
			};
			state = state;
		}
	}

	function nextLevel(now: number) {
		const nextL = state.level + 1;
		state = makeLevel(state.characterId, nextL, state.score, state.lives, now);
	}

	function respawnPlayer(now: number) {
		state.lives -= 1;
		if (state.lives <= 0) {
			state.status = 'game-over';
			state.statusStartedAt = now;
			state.banner = {
				text: 'GAME OVER',
				accent: 'var(--rp-love)',
				expiresAt: now + 10_000
			};
			state = state;
			return;
		}
		// Reset player to a safe starting spot in the top tunnels.
		state.playerCellX = 7;
		state.playerCellY = 1;
		state.playerFromX = 7;
		state.playerFromY = 1;
		state.playerFacing = 'down';
		state.playerMoveStartedAt = now;
		// Make sure that tile is open.
		state.grid[tileIndex(7, 1)] = 'tunnel';
		// Push back any enemy that happens to be on the player spawn.
		for (const e of state.enemies) {
			if (e.cellX === 7 && e.cellY === 1) {
				e.cellY = 2;
				e.moveFromY = 2;
			}
		}
		state.status = 'playing';
		state.banner = null;
		state = state;
	}

	function tick() {
		raf = requestAnimationFrame(tick);
		const now = performance.now();

		if (state.banner && now >= state.banner.expiresAt) {
			state.banner = null;
		}

		if (state.status === 'playing') {
			// Player held movement.
			if (!state.harpoon && !playerIsMoving(now) && (lastDir || heldDirs.size > 0)) {
				const dir = lastDir && heldDirs.has(lastDir) ? lastDir : [...heldDirs][0];
				if (dir) tryStartPlayerMove(dir, now);
			}

			// Harpoon physics & pumping.
			tickHarpoon(now);
			if (state.harpoon && state.harpoon.connectedEnemyId && firingHeld) {
				pumpConnected(now);
			}
			// If the player let go after a connection, auto-retract.
			if (state.harpoon && state.harpoon.connectedEnemyId && !firingHeld) {
				retractHarpoon(now);
			}

			tickEnemies(now);

			// Player vs enemy collision (any enemy on same cell = death).
			for (const e of state.enemies) {
				if (e.state === 'popping') continue;
				if (e.state === 'inflated') continue;
				if (e.cellX === state.playerCellX && e.cellY === state.playerCellY) {
					killPlayer(now);
					break;
				}
			}

			tickRocks(now);
			tickFire(now);
			checkLevelClear(now);
		} else if (state.status === 'dying') {
			if (now - state.statusStartedAt > 1400) {
				respawnPlayer(now);
			}
		} else if (state.status === 'level-clear') {
			if (now - state.statusStartedAt > 1800) {
				nextLevel(now);
			}
		}

		if (ctx) draw(ctx, state, character, now);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.repeat) return;
		const dir = KEY_TO_DIR[e.key];
		if (dir) {
			e.preventDefault();
			heldDirs.add(dir);
			lastDir = dir;
			return;
		}
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			firingHeld = true;
			if (state.status === 'game-over') {
				restartGame();
				return;
			}
			startFire(performance.now());
			return;
		}
		if (e.key === 'r' || e.key === 'R') {
			if (state.status === 'game-over') {
				e.preventDefault();
				restartGame();
			}
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		const dir = KEY_TO_DIR[e.key];
		if (dir) {
			heldDirs.delete(dir);
			if (lastDir === dir) lastDir = null;
		}
		if (e.key === ' ' || e.key === 'Enter') {
			firingHeld = false;
		}
	}

	function pressDir(d: Facing) {
		heldDirs.add(d);
		lastDir = d;
	}
	function releaseDir(d: Facing) {
		heldDirs.delete(d);
		if (lastDir === d) lastDir = null;
	}
	function pressFire() {
		firingHeld = true;
		if (state.status === 'game-over') {
			restartGame();
			return;
		}
		startFire(performance.now());
	}
	function releaseFire() {
		firingHeld = false;
	}

	function restartGame() {
		state = makeLevel(characterId, 1, 0, 3, performance.now());
		heldDirs.clear();
		lastDir = null;
		firingHeld = false;
	}

	onMount(() => {
		ctx = canvasEl.getContext('2d');
		if (ctx) ctx.imageSmoothingEnabled = false;
		state.statusStartedAt = performance.now();
		state.playerMoveStartedAt = performance.now();
		state.banner = {
			text: `LEVEL ${state.level}`,
			accent: 'var(--rp-gold)',
			expiresAt: performance.now() + 1600
		};
		for (const e of state.enemies) {
			e.moveStartedAt = performance.now();
			enemyLastMoveAt[e.id] = performance.now();
		}
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		raf = requestAnimationFrame(tick);
	});

	onDestroy(() => {
		if (raf) cancelAnimationFrame(raf);
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);
	});
</script>

<div class="game" style="--accent: var(--rp-gold);">
	<header class="hud">
		<button class="exit" type="button" on:click={onExit} aria-label="Back to game picker">
			◄ EXIT
		</button>
		<div class="stats">
			<span class="stat score">SCORE {state.score.toString().padStart(6, '0')}</span>
			<span class="stat level">LV {state.level}</span>
			<span class="stat lives">
				LIVES
				{#each Array(Math.max(0, state.lives)) as _, i (i)}
					<span class="life">{character.emoji}</span>
				{/each}
			</span>
		</div>
	</header>

	<div class="stage">
		<canvas
			bind:this={canvasEl}
			width={canvasSize.w}
			height={canvasSize.h}
			tabindex="0"
			aria-label="Dig Dug game canvas"
		/>

		{#if state.banner}
			<div class="banner" style="--banner-accent: {state.banner.accent};">
				{state.banner.text}
				{#if state.status === 'game-over'}
					<span class="restart">PRESS [SPACE] OR R TO RESTART</span>
				{/if}
			</div>
		{/if}
	</div>

	<div class="touch-controls" aria-hidden="true">
		<div class="dpad">
			<button
				class="db up"
				type="button"
				on:pointerdown={() => pressDir('up')}
				on:pointerup={() => releaseDir('up')}
				on:pointerleave={() => releaseDir('up')}
				on:pointercancel={() => releaseDir('up')}>▲</button
			>
			<button
				class="db left"
				type="button"
				on:pointerdown={() => pressDir('left')}
				on:pointerup={() => releaseDir('left')}
				on:pointerleave={() => releaseDir('left')}
				on:pointercancel={() => releaseDir('left')}>◀</button
			>
			<button
				class="db right"
				type="button"
				on:pointerdown={() => pressDir('right')}
				on:pointerup={() => releaseDir('right')}
				on:pointerleave={() => releaseDir('right')}
				on:pointercancel={() => releaseDir('right')}>▶</button
			>
			<button
				class="db down"
				type="button"
				on:pointerdown={() => pressDir('down')}
				on:pointerup={() => releaseDir('down')}
				on:pointerleave={() => releaseDir('down')}
				on:pointercancel={() => releaseDir('down')}>▼</button
			>
		</div>
		<button
			class="action"
			type="button"
			on:pointerdown={pressFire}
			on:pointerup={releaseFire}
			on:pointerleave={releaseFire}
			on:pointercancel={releaseFire}
		>
			PUMP
		</button>
	</div>

	<p class="legend">
		<span>MOVE: Arrows / WASD</span>
		<span>·</span>
		<span>PUMP: hold [SPACE]</span>
		<span>·</span>
		<span>Dig dirt to make tunnels. Drop rocks on enemies!</span>
	</p>
</div>

<style>
	.game {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 720px;
		gap: 0.5rem;
	}

	.exit {
		background: transparent;
		border: 2px solid var(--rp-muted);
		color: var(--rp-subtle);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.2em;
		padding: 0.4rem 0.7rem;
		cursor: pointer;
	}

	.exit:hover,
	.exit:focus-visible {
		color: var(--rp-text);
		border-color: var(--rp-text);
		outline: none;
	}

	.stats {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.stat {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.6rem;
		letter-spacing: 0.18em;
		padding: 0.35rem 0.55rem;
		border: 2px solid var(--rp-muted);
		background: var(--rp-surface);
		color: var(--rp-text);
	}

	.stat.score {
		color: var(--rp-gold);
		border-color: var(--rp-gold);
		box-shadow: 0 0 6px var(--rp-gold);
	}

	.stat.level {
		color: var(--rp-foam);
		border-color: var(--rp-foam);
		box-shadow: 0 0 6px var(--rp-foam);
	}

	.stat.lives {
		color: var(--rp-love);
		border-color: var(--rp-love);
		box-shadow: 0 0 6px var(--rp-love);
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.life {
		font-family: sans-serif;
		font-size: 1rem;
	}

	.stage {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		max-width: 100%;
	}

	canvas {
		display: block;
		image-rendering: pixelated;
		max-width: 100%;
		max-height: 60vh;
		border: 3px solid var(--accent);
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 20px var(--accent);
	}

	canvas:focus-visible {
		outline: 2px solid var(--rp-foam);
		outline-offset: 2px;
	}

	.banner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: 'Press Start 2P', cursive;
		font-size: 1.3rem;
		color: var(--banner-accent);
		background: rgba(25, 23, 36, 0.85);
		border: 3px solid var(--banner-accent);
		padding: 0.9rem 1.4rem;
		letter-spacing: 0.18em;
		text-shadow: 0 0 10px var(--banner-accent);
		box-shadow: 0 0 20px var(--banner-accent);
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.restart {
		font-size: 0.55rem;
		color: var(--rp-text);
		letter-spacing: 0.2em;
		text-shadow: none;
		opacity: 0.85;
	}

	.legend {
		margin: 0;
		font-family: 'VT323', monospace;
		font-size: 1rem;
		color: var(--rp-subtle);
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		justify-content: center;
		text-align: center;
		max-width: 720px;
	}

	.touch-controls {
		display: flex;
		justify-content: space-between;
		width: 100%;
		max-width: 720px;
		padding: 0 0.5rem;
		align-items: flex-end;
		user-select: none;
	}

	.dpad {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.db {
		position: absolute;
		width: 40px;
		height: 40px;
		background: var(--rp-surface);
		border: 2px solid var(--rp-iris);
		color: var(--rp-text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 0 6px var(--rp-iris);
		touch-action: none;
	}

	.db:active {
		background: var(--rp-iris);
		color: var(--rp-base);
	}

	.db.up {
		left: 40px;
		top: 0;
	}
	.db.down {
		left: 40px;
		top: 80px;
	}
	.db.left {
		left: 0;
		top: 40px;
	}
	.db.right {
		left: 80px;
		top: 40px;
	}

	.action {
		width: 84px;
		height: 64px;
		border-radius: 14px;
		background: var(--rp-surface);
		border: 3px solid var(--rp-love);
		color: var(--rp-love);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.85rem;
		letter-spacing: 0.15em;
		cursor: pointer;
		box-shadow: 0 0 10px var(--rp-love);
		touch-action: none;
	}

	.action:active {
		background: var(--rp-love);
		color: var(--rp-base);
	}

	@media (min-width: 720px) and (pointer: fine) {
		.touch-controls {
			display: none;
		}
	}
</style>
