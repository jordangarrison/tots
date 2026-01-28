<script lang="ts">
	export const prerender = true;
</script>

<div class="app-wrapper">
	<header>
		<h1 class="title">
			<span class="letter" style="color: #ff6b6b;">T</span><span class="letter" style="color: #feca57;">o</span><span class="letter" style="color: #1dd1a1;">t</span><span class="letter" style="color: #54a0ff;">s</span>
			<span class="subtitle">Game Center</span>
		</h1>
	</header>
	<main><slot /></main>
	<footer>
		<p>
			Tots Game Center &copy; {new Date().getFullYear()}
			<em>jordangarrison.dev</em>
		</p>
	</footer>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Londrina+Sketch&family=Fredoka+One&display=swap');

	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
		overflow-x: hidden;
	}

	.app-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		text-align: center;
		padding: 0.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.title {
		font-family: 'Fredoka One', cursive;
		font-size: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		margin: 0;
	}

	.letter {
		display: inline-block;
		text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.2);
		animation: bounce 0.6s ease-in-out infinite;
	}

	.letter:nth-child(1) { animation-delay: 0s; }
	.letter:nth-child(2) { animation-delay: 0.1s; }
	.letter:nth-child(3) { animation-delay: 0.2s; }
	.letter:nth-child(4) { animation-delay: 0.3s; }

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-5px); }
	}

	.subtitle {
		font-family: 'Londrina Sketch', cursive;
		font-size: 1.2rem;
		color: white;
		margin-left: 1rem;
		opacity: 0.9;
	}

	main {
		flex: 1;
		padding: 0.5rem;
	}

	footer {
		font-family: 'Londrina Sketch', sans-serif;
		font-size: 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
	}

	footer p {
		margin: 0;
	}

	footer em {
		font-style: normal;
		opacity: 0.8;
	}
</style>
