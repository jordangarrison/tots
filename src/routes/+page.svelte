<script lang="ts">
	export const prerender = true;
	import P5 from 'p5-svelte';
	import type { Sketch } from 'p5-svelte';
	let width = 55;
	let height = 55;

	const sketch: Sketch = (p5) => {
		p5.setup = () => {
			// create canvas the size of the browser
			p5.createCanvas(p5.windowWidth - 50, p5.windowHeight - 130);
		};

		p5.keyPressed = () => {
			let keyIndex = -1;
			if (p5.key >= 'a' && p5.key <= 'z') {
				keyIndex = p5.key.charCodeAt(0) - 'a'.charCodeAt(0);
			}

			// if key is an arrow key, change the width and height of the rectangle
			if (p5.keyCode === p5.UP_ARROW) {
				height += 5;
				width += 5;
			} else if (p5.keyCode === p5.DOWN_ARROW) {
				height -= 5;
				width -= 5;
			} else if (p5.keyCode === p5.LEFT_ARROW) {
				height -= 5;
				width += 5;
			} else if (p5.keyCode === p5.RIGHT_ARROW) {
				height += 5;
				width -= 5;
			} else if (keyIndex === -1) {
				// not not a letter key, clear the screen
				p5.background(255);
			} else {
				// if it is a letter key, fill the screen with a rectangle
				const randFill_r = Math.floor(Math.random() * 255 + 1);
				const randFill_g = Math.floor(Math.random() * 255 + 1);
				const randFill_b = Math.floor(Math.random() * 255 + 1);
				p5.fill(randFill_r, randFill_g, randFill_b);
				let x = p5.map(keyIndex, p5.width, 0, 0, Math.floor(Math.random() * p5.width + 1));
				let y = p5.map(keyIndex, 0, p5.height, Math.floor(Math.random() * p5.height + 1), 0);
				p5.rect(x, y, width, height);
			}
		};

		p5.draw = () => {};
	};
</script>

<P5 {sketch} />
