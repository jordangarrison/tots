<script lang="ts">
	export let text: string;
	export let accent = 'var(--rp-gold)';
</script>

<!-- TODO #9: replace text-only bubble with recorded audio playback. -->
<div class="bubble" style="--accent: {accent};">
	<span class="quote">"</span>
	<p>{text}</p>
	<span class="quote close">"</span>
</div>

<style>
	.bubble {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 1rem;
		background: var(--rp-surface);
		border: 2px solid var(--accent);
		border-radius: 4px;
		padding: 0.6rem 1.25rem;
		max-width: min(36ch, 90%);
		color: var(--rp-text);
		font-family: 'VT323', monospace;
		font-size: 1.15rem;
		line-height: 1.2;
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 14px var(--accent);
		text-align: center;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.quote {
		color: var(--accent);
		font-family: 'Press Start 2P', cursive;
		font-size: 1rem;
		text-shadow: 0 0 4px var(--accent);
	}

	p {
		margin: 0;
	}
</style>
