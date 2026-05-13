<script lang="ts">
	import { FINGERS } from './fingerMap';
	import type { Finger } from './types';

	export let activeFingerId: string | null = null;
	/** Optional second finger to highlight (used to show Shift). */
	export let secondaryFingerId: string | null = null;

	// Palm-down view, as a kid sees their own hands on the keyboard.
	// Left hand: pinky on the left, thumb on the right (toward the middle).
	// Right hand: mirrored. We hand-author both SVGs for clarity.
	const L = FINGERS;

	// Reactive predicate — function declarations alone don't trigger template
	// re-evaluation when their captured variables change.
	$: isActive = (f: Finger) =>
		activeFingerId === f.id || (secondaryFingerId !== null && secondaryFingerId === f.id);
</script>

<div class="hands-wrap">
	<!-- LEFT HAND -->
	<svg
		class="hand"
		viewBox="0 0 220 240"
		preserveAspectRatio="xMidYMax meet"
		role="img"
		aria-label="Left hand"
	>
		<!-- Palm (drawn first, fingers overlap on top) -->
		<rect class="palm" x="20" y="130" width="160" height="100" rx="36" ry="36" />

		<!-- Thumb pokes out to the right and angles upward, like a thumb-down view -->
		<rect
			class="finger thumb"
			class:active={isActive(L.leftThumb)}
			style="--c: {L.leftThumb.color};"
			x="-14"
			y="-38"
			width="28"
			height="76"
			rx="14"
			ry="14"
			transform="translate(178 168) rotate(55)"
		/>

		<!-- Fingers from outside to inside: pinky, ring, middle, index -->
		<rect
			class="finger"
			class:active={isActive(L.leftPinky)}
			style="--c: {L.leftPinky.color};"
			x="34"
			y="60"
			width="26"
			height="82"
			rx="13"
		/>
		<rect
			class="finger"
			class:active={isActive(L.leftRing)}
			style="--c: {L.leftRing.color};"
			x="66"
			y="28"
			width="28"
			height="114"
			rx="14"
		/>
		<rect
			class="finger"
			class:active={isActive(L.leftMiddle)}
			style="--c: {L.leftMiddle.color};"
			x="100"
			y="14"
			width="30"
			height="128"
			rx="15"
		/>
		<rect
			class="finger"
			class:active={isActive(L.leftIndex)}
			style="--c: {L.leftIndex.color};"
			x="136"
			y="34"
			width="28"
			height="108"
			rx="14"
		/>

		<text class="label" x="100" y="200" text-anchor="middle">LEFT</text>
	</svg>

	<!-- RIGHT HAND (mirrored layout) -->
	<svg
		class="hand"
		viewBox="0 0 220 240"
		preserveAspectRatio="xMidYMax meet"
		role="img"
		aria-label="Right hand"
	>
		<rect class="palm" x="40" y="130" width="160" height="100" rx="36" ry="36" />

		<!-- Thumb pokes out to the LEFT for the right hand -->
		<rect
			class="finger thumb"
			class:active={isActive(L.rightThumb)}
			style="--c: {L.rightThumb.color};"
			x="-14"
			y="-38"
			width="28"
			height="76"
			rx="14"
			ry="14"
			transform="translate(42 168) rotate(-55)"
		/>

		<!-- Fingers inside to outside: index, middle, ring, pinky -->
		<rect
			class="finger"
			class:active={isActive(L.rightIndex)}
			style="--c: {L.rightIndex.color};"
			x="56"
			y="34"
			width="28"
			height="108"
			rx="14"
		/>
		<rect
			class="finger"
			class:active={isActive(L.rightMiddle)}
			style="--c: {L.rightMiddle.color};"
			x="90"
			y="14"
			width="30"
			height="128"
			rx="15"
		/>
		<rect
			class="finger"
			class:active={isActive(L.rightRing)}
			style="--c: {L.rightRing.color};"
			x="126"
			y="28"
			width="28"
			height="114"
			rx="14"
		/>
		<rect
			class="finger"
			class:active={isActive(L.rightPinky)}
			style="--c: {L.rightPinky.color};"
			x="160"
			y="60"
			width="26"
			height="82"
			rx="13"
		/>

		<text class="label" x="120" y="200" text-anchor="middle">RIGHT</text>
	</svg>
</div>

<style>
	.hands-wrap {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 0.4rem;
		padding: 0.3rem 0.25rem 0;
	}

	.hand {
		width: 140px;
		max-width: 36vw;
		height: auto;
		filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.25));
	}

	.palm {
		fill: var(--rp-hl-med);
		stroke: rgba(0, 0, 0, 0.35);
		stroke-width: 2.5;
	}

	.finger {
		--c: var(--rp-iris);
		fill: var(--c);
		stroke: rgba(0, 0, 0, 0.35);
		stroke-width: 2.5;
		opacity: 0.42;
		filter: saturate(0.7) brightness(0.85);
		transition: opacity 0.2s ease, filter 0.18s ease, transform 0.18s ease;
		transform-box: fill-box;
		transform-origin: center 95%;
	}

	.finger.active {
		opacity: 1;
		filter: saturate(1) brightness(1) drop-shadow(0 0 6px var(--c)) drop-shadow(0 0 14px var(--c));
		animation: wiggle 0.9s ease-in-out infinite;
	}

	@keyframes wiggle {
		0%,
		100% {
			transform: translateY(-3px) scale(1.03);
		}
		50% {
			transform: translateY(-6px) scale(1.05) rotate(-1deg);
		}
	}

	.label {
		fill: var(--rp-text);
		font-family: 'Press Start 2P', cursive;
		font-size: 14px;
		letter-spacing: 0.15em;
		opacity: 0.7;
	}
</style>
