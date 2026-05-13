<script lang="ts">
	import { KEYBOARD_ROWS, baseChar, needsShift, shiftKeyIdFor } from './fingerMap';

	export let targetChar: string | null = null;
	/** Last key the user actually pressed, for the brief glow animation. */
	export let lastPressed: { char: string; correct: boolean; nonce: number } | null = null;
	/** When true, dim keys that aren't the current target — focuses attention. */
	export let focusTarget = true;

	// The physical key under the (possibly shifted) target character.
	$: targetKey = targetChar !== null ? baseChar(targetChar) : null;
	$: shiftSide = targetChar !== null && needsShift(targetChar) ? shiftKeyIdFor(targetChar) : null;
	// Reactive predicates so the template re-renders when their inputs change.
	// (Plain `function isTarget(key)` does NOT re-evaluate when `target` changes —
	// Svelte tracks variables in template expressions, not function bodies.)
	$: isTarget = (char: string) => char === targetKey || (shiftSide !== null && char === shiftSide);
	$: isDimmed = (char: string) => focusTarget && targetKey !== null && !isTarget(char);
	$: lastNonce = lastPressed?.nonce ?? 0;
</script>

<div class="keyboard" aria-hidden="true">
	{#each KEYBOARD_ROWS as row, rIdx (rIdx)}
		<div class="row" data-row={row[0]?.row ?? rIdx}>
			{#each row as key (key.char)}
				{@const pressed = lastPressed && lastPressed.char === key.char ? lastPressed : null}
				{@const t = isTarget(key.char)}
				<div
					class="key"
					class:target={t}
					class:dim={isDimmed(key.char)}
					class:correct={pressed && pressed.correct}
					class:oops={pressed && !pressed.correct}
					class:wide={key.isWide}
					class:anchor={key.homeAnchor}
					class:modifier={key.isModifier}
					data-nonce={pressed ? lastNonce : ''}
					style="--finger-color: {key.finger.color};"
				>
					<span class="cap">{key.label}</span>
					{#if key.homeAnchor}
						<span class="bump" aria-hidden="true" />
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.keyboard {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		align-items: center;
		padding: 0.5rem 0.6rem;
		background: var(--rp-overlay);
		border: 3px solid var(--rp-hl-med);
		border-radius: 6px;
		box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.5);
	}

	.row {
		display: flex;
		gap: 0.3rem;
	}

	/* Real-keyboard stagger using the semantic row index (0..4). */
	.row[data-row='1'] {
		padding-left: 1rem;
	}
	.row[data-row='2'] {
		padding-left: 1.5rem;
	}
	.row[data-row='3'] {
		padding-left: 0;
	}
	.row[data-row='4'] {
		width: 100%;
		justify-content: center;
	}

	.key {
		--finger-color: var(--rp-iris);
		position: relative;
		min-width: 2rem;
		height: 2.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--rp-surface);
		border: 2px solid var(--finger-color);
		border-radius: 4px;
		color: var(--rp-text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		box-shadow: 0 2px 0 var(--rp-hl-low), inset 0 0 6px rgba(255, 255, 255, 0.04);
		transition: transform 0.08s ease, box-shadow 0.12s ease, opacity 0.2s ease;
	}

	.key.modifier {
		min-width: 3rem;
		font-size: 1rem;
		opacity: 0.55;
	}
	.key.modifier.target {
		opacity: 1;
	}

	.key.wide {
		min-width: 12rem;
		height: 1.4rem;
		font-size: 0.55rem;
		letter-spacing: 0.3em;
	}

	.cap {
		text-shadow: 1px 1px 0 var(--rp-hl-low);
	}

	.key.dim {
		opacity: 0.3;
	}

	.key.target {
		background: var(--finger-color);
		color: var(--rp-base);
		box-shadow: 0 0 12px var(--finger-color), 0 0 24px var(--finger-color),
			inset 0 0 8px rgba(255, 255, 255, 0.5);
		animation: target-pulse 1.2s ease-in-out infinite;
		z-index: 2;
	}

	.key.target .cap {
		text-shadow: none;
	}

	.key.correct {
		animation: pop-correct 0.4s ease-out;
	}

	.key.oops {
		animation: shake 0.35s ease-in-out;
		border-color: var(--rp-love);
	}

	.bump {
		position: absolute;
		bottom: 4px;
		width: 8px;
		height: 2px;
		background: currentColor;
		border-radius: 2px;
		opacity: 0.55;
	}

	@keyframes target-pulse {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-2px) scale(1.06);
		}
	}

	@keyframes pop-correct {
		0% {
			transform: scale(1);
		}
		35% {
			transform: scale(1.18);
			box-shadow: 0 0 20px var(--rp-foam);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-3px);
		}
		50% {
			transform: translateX(3px);
		}
		75% {
			transform: translateX(-2px);
		}
	}
</style>
