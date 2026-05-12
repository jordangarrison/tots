<script lang="ts">
	import { FINGERS } from './fingerMap';
	import type { Finger } from './types';

	export let activeFingerId: string | null = null;

	// Order fingers as they appear from left to right when looking down at
	// your hands on the keyboard, palms down: left pinky → right pinky.
	const leftHand: Finger[] = [
		FINGERS.leftPinky,
		FINGERS.leftRing,
		FINGERS.leftMiddle,
		FINGERS.leftIndex
	];
	const rightHand: Finger[] = [
		FINGERS.rightIndex,
		FINGERS.rightMiddle,
		FINGERS.rightRing,
		FINGERS.rightPinky
	];

	$: activeFinger = activeFingerId;

	function isActive(f: Finger): boolean {
		return activeFinger === f.id;
	}

	// Stagger the finger heights to look hand-shaped: pinky shortest,
	// middle tallest. Heights are in em, indexed by FingerIndex order
	// (1 index, 2 middle, 3 ring, 4 pinky).
	function fingerHeight(f: Finger): string {
		const heights: Record<number, string> = { 1: '3.6em', 2: '4.2em', 3: '3.8em', 4: '3em' };
		return heights[f.index] ?? '3em';
	}
</script>

<div class="hands-wrap">
	<!-- LEFT HAND -->
	<div class="hand left" class:any-active={activeFinger?.startsWith('L')}>
		<div class="fingers">
			{#each leftHand as f (f.id)}
				<div
					class="finger"
					class:active={isActive(f)}
					style="--c: {f.color}; height: {fingerHeight(f)};"
				>
					<span class="tip" />
				</div>
			{/each}
		</div>
		<div class="palm">
			<span class="label">LEFT</span>
			<div
				class="thumb"
				class:active={isActive(FINGERS.leftThumb)}
				style="--c: {FINGERS.leftThumb.color};"
			/>
		</div>
	</div>

	<!-- RIGHT HAND -->
	<div class="hand right" class:any-active={activeFinger?.startsWith('R')}>
		<div class="fingers">
			{#each rightHand as f (f.id)}
				<div
					class="finger"
					class:active={isActive(f)}
					style="--c: {f.color}; height: {fingerHeight(f)};"
				>
					<span class="tip" />
				</div>
			{/each}
		</div>
		<div class="palm">
			<span class="label">RIGHT</span>
			<div
				class="thumb"
				class:active={isActive(FINGERS.rightThumb)}
				style="--c: {FINGERS.rightThumb.color};"
			/>
		</div>
	</div>
</div>

<style>
	.hands-wrap {
		display: flex;
		justify-content: center;
		gap: 1.8rem;
		padding: 0.5rem 0.25rem 0;
	}

	.hand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		position: relative;
	}

	.fingers {
		display: flex;
		align-items: flex-end;
		gap: 0.35rem;
	}

	.finger {
		width: 0.9em;
		background: var(--c);
		border: 2px solid rgba(0, 0, 0, 0.35);
		border-radius: 999px 999px 4px 4px;
		opacity: 0.45;
		filter: saturate(0.7) brightness(0.85);
		transform-origin: bottom center;
		transition: opacity 0.2s ease, transform 0.18s ease, filter 0.18s ease;
		position: relative;
	}

	.finger.active {
		opacity: 1;
		filter: saturate(1) brightness(1);
		box-shadow: 0 0 12px var(--c), 0 0 24px var(--c);
		animation: finger-wiggle 0.9s ease-in-out infinite;
	}

	.tip {
		position: absolute;
		top: 6px;
		left: 50%;
		transform: translateX(-50%);
		width: 0.45em;
		height: 0.18em;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.6);
	}

	.palm {
		position: relative;
		width: 5em;
		height: 1.6em;
		background: var(--rp-hl-med);
		border: 2px solid rgba(0, 0, 0, 0.35);
		border-radius: 0.6em;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--rp-text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.45rem;
		letter-spacing: 0.2em;
	}

	.label {
		opacity: 0.85;
	}

	/* Thumb pokes out from the palm — to the right on the left hand, to the left on the right hand. */
	.thumb {
		position: absolute;
		top: 50%;
		width: 1.2em;
		height: 0.9em;
		background: var(--c);
		border: 2px solid rgba(0, 0, 0, 0.35);
		border-radius: 999px;
		opacity: 0.45;
		filter: saturate(0.7) brightness(0.85);
		transition: opacity 0.2s ease, transform 0.18s ease, filter 0.18s ease;
	}

	.thumb.active {
		opacity: 1;
		filter: saturate(1) brightness(1);
		box-shadow: 0 0 10px var(--c), 0 0 20px var(--c);
		animation: thumb-glow 0.9s ease-in-out infinite;
	}

	.hand.left .thumb {
		right: -0.7em;
		transform: translateY(-50%) rotate(25deg);
	}

	.hand.right .thumb {
		left: -0.7em;
		transform: translateY(-50%) rotate(-25deg);
	}

	@keyframes finger-wiggle {
		0%,
		100% {
			transform: translateY(-6px) scaleY(1.06) rotate(0deg);
		}
		50% {
			transform: translateY(-10px) scaleY(1.1) rotate(-3deg);
		}
	}

	@keyframes thumb-glow {
		0%,
		100% {
			box-shadow: 0 0 10px var(--c), 0 0 20px var(--c);
		}
		50% {
			box-shadow: 0 0 16px var(--c), 0 0 32px var(--c);
		}
	}
</style>
