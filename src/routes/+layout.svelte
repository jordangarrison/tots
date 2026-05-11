<script lang="ts">
	export const prerender = true;
</script>

<div class="app-wrapper">
	<header>
		<div class="marquee">
			<h1 class="title">
				<span class="letter love">T</span><span class="letter gold">O</span><span class="letter foam">T</span><span class="letter iris">S</span>
			</h1>
			<span class="subtitle">★ ARCADE ★</span>
		</div>
	</header>
	<main><slot /></main>
	<footer>
		<p>
			<span class="footer-text">© {new Date().getFullYear()} TOTS ARCADE</span>
			<span class="footer-sep">▰▰▰</span>
			<span class="footer-text">JORDANGARRISON.DEV</span>
		</p>
	</footer>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Schoolbell&family=VT323&display=swap');

	:global(:root) {
		--rp-base: #191724;
		--rp-surface: #1f1d2e;
		--rp-overlay: #26233a;
		--rp-muted: #6e6a86;
		--rp-subtle: #908caa;
		--rp-text: #e0def4;
		--rp-love: #eb6f92;
		--rp-gold: #f6c177;
		--rp-rose: #ebbcba;
		--rp-pine: #31748f;
		--rp-foam: #9ccfd8;
		--rp-iris: #c4a7e7;
		--rp-hl-low: #21202e;
		--rp-hl-med: #403d52;
		--rp-hl-high: #524f67;
	}

	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(html, body) {
		height: 100%;
		overflow: hidden;
	}

	:global(body) {
		background-color: var(--rp-base);
		background-image:
			linear-gradient(var(--rp-overlay) 1px, transparent 1px),
			linear-gradient(90deg, var(--rp-overlay) 1px, transparent 1px);
		background-size: 32px 32px;
		color: var(--rp-text);
		font-family: 'VT323', monospace;
		image-rendering: pixelated;
	}

	.app-wrapper {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.app-wrapper::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			0deg,
			rgba(0, 0, 0, 0.18) 0px,
			rgba(0, 0, 0, 0.18) 1px,
			transparent 1px,
			transparent 3px
		);
		z-index: 9999;
	}

	header {
		text-align: center;
		padding: 0.4rem 0.5rem;
		background: var(--rp-surface);
		border-bottom: 3px solid var(--rp-iris);
		box-shadow:
			0 0 10px var(--rp-iris),
			inset 0 0 24px rgba(196, 167, 231, 0.15);
	}

	.marquee {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.title {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.5rem;
		display: flex;
		gap: 0.25rem;
		margin: 0;
		letter-spacing: 0.1em;
	}

	.letter {
		display: inline-block;
		animation: bounce 0.8s ease-in-out infinite;
	}

	.letter.love { color: var(--rp-love); text-shadow: 0 0 8px var(--rp-love), 3px 3px 0 var(--rp-hl-low); }
	.letter.gold { color: var(--rp-gold); text-shadow: 0 0 8px var(--rp-gold), 3px 3px 0 var(--rp-hl-low); }
	.letter.foam { color: var(--rp-foam); text-shadow: 0 0 8px var(--rp-foam), 3px 3px 0 var(--rp-hl-low); }
	.letter.iris { color: var(--rp-iris); text-shadow: 0 0 8px var(--rp-iris), 3px 3px 0 var(--rp-hl-low); }

	.letter:nth-child(1) { animation-delay: 0s; }
	.letter:nth-child(2) { animation-delay: 0.1s; }
	.letter:nth-child(3) { animation-delay: 0.2s; }
	.letter:nth-child(4) { animation-delay: 0.3s; }

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-6px); }
	}

	.subtitle {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.75rem;
		color: var(--rp-gold);
		text-shadow: 0 0 6px var(--rp-gold);
		letter-spacing: 0.2em;
		animation: flicker 2s infinite;
	}

	@keyframes flicker {
		0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
		20%, 22%, 24%, 55% { opacity: 0.5; }
	}

	main {
		flex: 1;
		padding: 0.25rem 0.5rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	footer {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		background: var(--rp-surface);
		color: var(--rp-subtle);
		border-top: 3px solid var(--rp-pine);
		box-shadow: 0 0 10px var(--rp-pine);
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.35rem;
		letter-spacing: 0.1em;
	}

	footer p {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.footer-sep {
		color: var(--rp-pine);
		text-shadow: 0 0 4px var(--rp-pine);
	}
</style>
