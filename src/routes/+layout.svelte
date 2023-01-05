<script lang="ts">
	export const prerender = true;
</script>

<main><slot /></main>
<footer>
	<p>
		Tots type a picture &copy; {new Date().getFullYear()}
		<em>jordangarrison.dev</em>
	</p>
</footer>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Londrina+Sketch&display=swap');
	footer {
		font-family: 'Londrina Sketch', sans-serif;
		font-size: 2rem;
		background: #fafafa;
		border-top: 1px solid #eaeaea;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	footer em {
		font-style: normal;
	}
</style>
