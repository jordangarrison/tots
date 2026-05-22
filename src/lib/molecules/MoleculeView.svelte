<script lang="ts">
	import { ELEMENT_BY_SYMBOL } from './elements';
	import type { Molecule } from './types';

	export let molecule: Molecule;
	export let animate = true;

	const ATOM_R = 1.05;
	const BOND_WIDTH = 0.22;
	const BOND_GAP = 0.55;
	const PAD = 1.6;

	$: bounds = (() => {
		const xs = molecule.atoms.map((a) => a.x);
		const ys = molecule.atoms.map((a) => a.y);
		const minX = Math.min(...xs) - ATOM_R - PAD;
		const maxX = Math.max(...xs) + ATOM_R + PAD;
		const minY = Math.min(...ys) - ATOM_R - PAD;
		const maxY = Math.max(...ys) + ATOM_R + PAD;
		const w = maxX - minX;
		const h = maxY - minY;
		// Keep a square-ish viewbox so the molecule stays centered.
		const size = Math.max(w, h);
		const cx = (minX + maxX) / 2;
		const cy = (minY + maxY) / 2;
		return { x: cx - size / 2, y: cy - size / 2, size };
	})();

	function bondLines(from: { x: number; y: number }, to: { x: number; y: number }, order: 1 | 2 | 3) {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const len = Math.hypot(dx, dy) || 1;
		// Perpendicular unit vector for offsetting multi-bonds.
		const px = -dy / len;
		const py = dx / len;
		const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
		if (order === 1) {
			lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
		} else if (order === 2) {
			const o = BOND_GAP / 2;
			lines.push({
				x1: from.x + px * o,
				y1: from.y + py * o,
				x2: to.x + px * o,
				y2: to.y + py * o
			});
			lines.push({
				x1: from.x - px * o,
				y1: from.y - py * o,
				x2: to.x - px * o,
				y2: to.y - py * o
			});
		} else {
			const o = BOND_GAP;
			lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
			lines.push({
				x1: from.x + px * o,
				y1: from.y + py * o,
				x2: to.x + px * o,
				y2: to.y + py * o
			});
			lines.push({
				x1: from.x - px * o,
				y1: from.y - py * o,
				x2: to.x - px * o,
				y2: to.y - py * o
			});
		}
		return lines;
	}
</script>

<svg
	class="molecule"
	class:animate
	viewBox="{bounds.x} {bounds.y} {bounds.size} {bounds.size}"
	role="img"
	aria-label="Structural diagram of {molecule.name}"
>
	<g class="bonds">
		{#each molecule.bonds as bond, i (i)}
			{#each bondLines(molecule.atoms[bond.from], molecule.atoms[bond.to], bond.order) as line, j (j)}
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
		{#each molecule.atoms as atom, i (i)}
			{@const el = ELEMENT_BY_SYMBOL[atom.el]}
			<g transform="translate({atom.x} {atom.y})">
				<g class="atom" style="--delay: {i * 60}ms">
					<circle r={ATOM_R} fill={el?.fill ?? '#888'} stroke="#191724" stroke-width="0.15" />
					<text
						y="0.05"
						text-anchor="middle"
						dominant-baseline="central"
						font-size={atom.el.length > 1 ? 0.95 : 1.15}
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
