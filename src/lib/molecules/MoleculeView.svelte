<script lang="ts">
	import { ELEMENT_BY_SYMBOL } from './elements';
	import type { Molecule, MoleculeAtom } from './types';

	export let molecule: Molecule;
	export let animate = true;

	const ATOM_R = 0.7;
	const BOND_WIDTH = 0.15;
	const BOND_GAP = 0.32;
	const PAD = 1;
	// Normalize layouts so the shortest bond is at least this long. Anything
	// authored tighter than this gets uniformly scaled up so atoms don't sit on
	// top of each other and bonds stay visible.
	const MIN_BOND_TARGET = 2.6;

	$: scaledAtoms = (() => {
		if (!molecule.bonds.length) return molecule.atoms;
		let minD = Infinity;
		for (const b of molecule.bonds) {
			const a1 = molecule.atoms[b.from];
			const a2 = molecule.atoms[b.to];
			const d = Math.hypot(a1.x - a2.x, a1.y - a2.y);
			if (d > 0 && d < minD) minD = d;
		}
		if (!isFinite(minD) || minD === 0 || minD >= MIN_BOND_TARGET) return molecule.atoms;
		const k = MIN_BOND_TARGET / minD;
		return molecule.atoms.map((a) => ({ ...a, x: a.x * k, y: a.y * k }));
	})();

	$: bounds = (() => {
		const xs = scaledAtoms.map((a) => a.x);
		const ys = scaledAtoms.map((a) => a.y);
		const minX = Math.min(...xs) - ATOM_R - PAD;
		const maxX = Math.max(...xs) + ATOM_R + PAD;
		const minY = Math.min(...ys) - ATOM_R - PAD;
		const maxY = Math.max(...ys) + ATOM_R + PAD;
		const w = maxX - minX;
		const h = maxY - minY;
		const size = Math.max(w, h);
		const cx = (minX + maxX) / 2;
		const cy = (minY + maxY) / 2;
		return { x: cx - size / 2, y: cy - size / 2, size };
	})();

	function bondLines(
		from: MoleculeAtom,
		to: MoleculeAtom,
		order: 1 | 2 | 3
	) {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const len = Math.hypot(dx, dy) || 1;
		// Pull bond endpoints back so lines don't poke out from under atoms.
		const ux = dx / len;
		const uy = dy / len;
		const trim = ATOM_R * 0.85;
		const fx = from.x + ux * trim;
		const fy = from.y + uy * trim;
		const tx = to.x - ux * trim;
		const ty = to.y - uy * trim;
		// Perpendicular unit vector for offsetting multi-bonds.
		const px = -uy;
		const py = ux;
		const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
		if (order === 1) {
			lines.push({ x1: fx, y1: fy, x2: tx, y2: ty });
		} else if (order === 2) {
			const o = BOND_GAP / 2;
			lines.push({
				x1: fx + px * o,
				y1: fy + py * o,
				x2: tx + px * o,
				y2: ty + py * o
			});
			lines.push({
				x1: fx - px * o,
				y1: fy - py * o,
				x2: tx - px * o,
				y2: ty - py * o
			});
		} else {
			const o = BOND_GAP;
			lines.push({ x1: fx, y1: fy, x2: tx, y2: ty });
			lines.push({
				x1: fx + px * o,
				y1: fy + py * o,
				x2: tx + px * o,
				y2: ty + py * o
			});
			lines.push({
				x1: fx - px * o,
				y1: fy - py * o,
				x2: tx - px * o,
				y2: ty - py * o
			});
		}
		return lines;
	}
</script>

<svg
	class="molecule"
	class:animate
	viewBox="{bounds.x} {bounds.y} {bounds.size} {bounds.size}"
	preserveAspectRatio="xMidYMid meet"
	role="img"
	aria-label="Structural diagram of {molecule.name}"
>
	<g class="bonds">
		{#each molecule.bonds as bond, i (i)}
			{#each bondLines(scaledAtoms[bond.from], scaledAtoms[bond.to], bond.order) as line, j (j)}
				<line
					x1={line.x1}
					y1={line.y1}
					x2={line.x2}
					y2={line.y2}
					stroke="#e0def4"
					stroke-width={BOND_WIDTH}
					stroke-linecap="round"
				/>
			{/each}
		{/each}
	</g>
	<g class="atoms">
		{#each scaledAtoms as atom, i (i)}
			{@const el = ELEMENT_BY_SYMBOL[atom.el]}
			<g transform="translate({atom.x} {atom.y})">
				<g class="atom" style="--delay: {i * 50}ms">
					<circle r={ATOM_R} fill={el?.fill ?? '#888'} stroke="#191724" stroke-width="0.08" />
					<text
						y="0.05"
						text-anchor="middle"
						dominant-baseline="central"
						font-size={atom.el.length > 1 ? 0.55 : 0.75}
						font-family="'Press Start 2P', monospace"
						fill={el?.text ?? '#000'}
					>
						{atom.el}
					</text>
				</g>
			</g>
		{/each}
	</g>
</svg>

<style>
	.molecule {
		width: 100%;
		height: 100%;
		display: block;
	}

	.atom {
		transform-origin: center;
		transform-box: fill-box;
	}

	.molecule.animate .atom {
		animation: pop 0.45s var(--delay, 0ms) cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	.molecule.animate .bonds line {
		animation: draw 0.55s 200ms ease-out both;
	}

	@keyframes pop {
		0% {
			opacity: 0;
			transform: scale(0.2);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes draw {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
</style>
