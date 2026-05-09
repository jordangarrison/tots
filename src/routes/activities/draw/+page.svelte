<script lang="ts">
	import P5 from 'p5-svelte';
	import type { Sketch } from 'p5-svelte';

	export const prerender = true;

	// Canvas container reference
	let canvasContainer: HTMLElement;

	// Shape size controls
	let shapeSize = 80;

	// Rose Pine palette for the canvas
	const rainbowColors = [
		[235, 111, 146], // Love
		[246, 193, 119], // Gold
		[235, 188, 186], // Rose
		[49, 116, 143],  // Pine
		[156, 207, 216], // Foam
		[196, 167, 231], // Iris
	];

	// Rose Pine surface — drawing canvas background
	const canvasBg: [number, number, number] = [31, 29, 46];

	// Shape types
	const shapeTypes = ['circle', 'star', 'heart', 'triangle', 'square', 'diamond'];

	// Particle system for celebrations
	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		color: number[];
		size: number;
		life: number;
		maxLife: number;
		rotation: number;
		rotationSpeed: number;
		shape: string;
	}

	// Drawn shapes storage
	interface DrawnShape {
		x: number;
		y: number;
		size: number;
		color: number[];
		type: string;
		wobble: number;
		wobbleSpeed: number;
	}

	// Trail point
	interface TrailPoint {
		x: number;
		y: number;
		age: number;
		color: number[];
	}

	let particles: Particle[] = [];
	let shapes: DrawnShape[] = [];
	let trail: TrailPoint[] = [];
	let colorIndex = 0;

	// Calculate canvas size based on container
	const getCanvasSize = () => {
		if (canvasContainer) {
			const rect = canvasContainer.getBoundingClientRect();
			return {
				width: Math.floor(rect.width) - 8,
				height: Math.floor(rect.height) - 8
			};
		}
		return { width: 800, height: 600 };
	};

	const sketch: Sketch = (p5) => {
		p5.setup = () => {
			const size = getCanvasSize();
			p5.createCanvas(size.width, size.height);
			p5.background(canvasBg[0], canvasBg[1], canvasBg[2]);
			p5.noStroke();
		};

		// Create confetti burst at position
		const createConfetti = (x: number, y: number, count: number = 30) => {
			for (let i = 0; i < count; i++) {
				const angle = (i / count) * p5.TWO_PI + p5.random(-0.3, 0.3);
				const speed = p5.random(3, 12);
				const particleShapes = ['circle', 'star', 'square'];
				particles.push({
					x,
					y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed - 2,
					color: rainbowColors[Math.floor(p5.random(rainbowColors.length))],
					size: p5.random(8, 20),
					life: 1,
					maxLife: p5.random(40, 80),
					rotation: p5.random(p5.TWO_PI),
					rotationSpeed: p5.random(-0.2, 0.2),
					shape: particleShapes[Math.floor(p5.random(particleShapes.length))]
				});
			}
		};

		// Draw a star shape
		const drawStar = (x: number, y: number, radius1: number, radius2: number, npoints: number) => {
			const angle = p5.TWO_PI / npoints;
			const halfAngle = angle / 2.0;
			p5.beginShape();
			for (let a = -p5.HALF_PI; a < p5.TWO_PI - p5.HALF_PI; a += angle) {
				let sx = x + Math.cos(a) * radius2;
				let sy = y + Math.sin(a) * radius2;
				p5.vertex(sx, sy);
				sx = x + Math.cos(a + halfAngle) * radius1;
				sy = y + Math.sin(a + halfAngle) * radius1;
				p5.vertex(sx, sy);
			}
			p5.endShape(p5.CLOSE);
		};

		// Draw a heart shape
		const drawHeart = (x: number, y: number, size: number) => {
			p5.beginShape();
			for (let a = 0; a < p5.TWO_PI; a += 0.1) {
				const r = size / 3;
				const heartX = x + r * 16 * Math.pow(Math.sin(a), 3) / 16;
				const heartY = y - r * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16;
				p5.vertex(heartX, heartY);
			}
			p5.endShape(p5.CLOSE);
		};

		// Draw any shape by type
		const drawShapeByType = (type: string, x: number, y: number, size: number) => {
			switch (type) {
				case 'circle':
					p5.ellipse(x, y, size, size);
					break;
				case 'star':
					drawStar(x, y, size / 4, size / 2, 5);
					break;
				case 'heart':
					drawHeart(x, y, size);
					break;
				case 'triangle':
					p5.triangle(
						x, y - size / 2,
						x - size / 2, y + size / 2,
						x + size / 2, y + size / 2
					);
					break;
				case 'square':
					p5.rectMode(p5.CENTER);
					p5.rect(x, y, size, size, 10);
					break;
				case 'diamond':
					p5.quad(x, y - size / 2, x + size / 2, y, x, y + size / 2, x - size / 2, y);
					break;
			}
		};

		p5.keyPressed = () => {
			let keyIndex = -1;
			if (p5.key >= 'a' && p5.key <= 'z') {
				keyIndex = p5.key.charCodeAt(0) - 'a'.charCodeAt(0);
			} else if (p5.key >= 'A' && p5.key <= 'Z') {
				keyIndex = p5.key.charCodeAt(0) - 'A'.charCodeAt(0);
			}

			// Arrow keys change shape size
			if (p5.keyCode === p5.UP_ARROW) {
				shapeSize = Math.min(shapeSize + 10, 200);
				return false;
			} else if (p5.keyCode === p5.DOWN_ARROW) {
				shapeSize = Math.max(shapeSize - 10, 20);
				return false;
			} else if (p5.keyCode === p5.LEFT_ARROW || p5.keyCode === p5.RIGHT_ARROW) {
				// Change color palette direction
				colorIndex = (colorIndex + (p5.keyCode === p5.RIGHT_ARROW ? 1 : -1) + rainbowColors.length) % rainbowColors.length;
				return false;
			}

			// Space bar = mega confetti celebration!
			if (p5.key === ' ') {
				for (let i = 0; i < 5; i++) {
					createConfetti(p5.random(p5.width), p5.random(p5.height), 40);
				}
				return false;
			}

			// Escape or backspace clears with a fun effect
			if (p5.keyCode === p5.ESCAPE || p5.keyCode === p5.BACKSPACE) {
				// Create confetti for each shape before clearing
				shapes.forEach(s => createConfetti(s.x, s.y, 10));
				shapes = [];
				p5.background(canvasBg[0], canvasBg[1], canvasBg[2]);
				return false;
			}

			// Letter keys draw fun shapes!
			if (keyIndex !== -1) {
				// Pick color based on key (creates rainbow effect across keyboard)
				const color = rainbowColors[(keyIndex + colorIndex) % rainbowColors.length];

				// Random position with some influence from key
				const x = p5.map(keyIndex, 0, 25, p5.width * 0.1, p5.width * 0.9) + p5.random(-50, 50);
				const y = p5.random(p5.height * 0.1, p5.height * 0.9);

				// Pick shape type based on key row
				const shapeType = shapeTypes[keyIndex % shapeTypes.length];

				// Store the shape
				const newShape: DrawnShape = {
					x,
					y,
					size: shapeSize + p5.random(-10, 10),
					color,
					type: shapeType,
					wobble: 0,
					wobbleSpeed: p5.random(0.05, 0.1)
				};
				shapes.push(newShape);

				// Draw it with a glow effect
				p5.noStroke();

				// Outer glow
				for (let i = 3; i > 0; i--) {
					p5.fill(color[0], color[1], color[2], 50);
					drawShapeByType(shapeType, x, y, newShape.size + i * 10);
				}

				// Main shape
				p5.fill(color[0], color[1], color[2]);
				drawShapeByType(shapeType, x, y, newShape.size);

				// Inner highlight
				p5.fill(255, 255, 255, 100);
				drawShapeByType(shapeType, x - newShape.size * 0.1, y - newShape.size * 0.1, newShape.size * 0.3);

				// Celebration confetti!
				createConfetti(x, y, 15);
			}

			return false;
		};

		// Mouse click also draws!
		p5.mousePressed = () => {
			if (p5.mouseX > 0 && p5.mouseX < p5.width && p5.mouseY > 0 && p5.mouseY < p5.height) {
				const color = rainbowColors[Math.floor(p5.random(rainbowColors.length))];
				const shapeType = shapeTypes[Math.floor(p5.random(shapeTypes.length))];

				const newShape: DrawnShape = {
					x: p5.mouseX,
					y: p5.mouseY,
					size: shapeSize + p5.random(-10, 10),
					color,
					type: shapeType,
					wobble: 0,
					wobbleSpeed: p5.random(0.05, 0.1)
				};
				shapes.push(newShape);

				// Draw with glow
				p5.noStroke();
				for (let i = 3; i > 0; i--) {
					p5.fill(color[0], color[1], color[2], 50);
					drawShapeByType(shapeType, p5.mouseX, p5.mouseY, newShape.size + i * 10);
				}
				p5.fill(color[0], color[1], color[2]);
				drawShapeByType(shapeType, p5.mouseX, p5.mouseY, newShape.size);
				p5.fill(255, 255, 255, 100);
				drawShapeByType(shapeType, p5.mouseX - newShape.size * 0.1, p5.mouseY - newShape.size * 0.1, newShape.size * 0.3);

				createConfetti(p5.mouseX, p5.mouseY, 20);
			}
		};

		p5.draw = () => {
			// Add point to rainbow trail
			if (p5.mouseX > 0 && p5.mouseX < p5.width && p5.mouseY > 0 && p5.mouseY < p5.height) {
				const trailColor = rainbowColors[Math.floor(p5.frameCount / 5) % rainbowColors.length];
				trail.push({
					x: p5.mouseX,
					y: p5.mouseY,
					age: 0,
					color: trailColor
				});
			}

			// Draw and update rainbow trail
			trail = trail.filter(point => {
				point.age++;
				if (point.age > 30) return false;

				const alpha = p5.map(point.age, 0, 30, 200, 0);
				const size = p5.map(point.age, 0, 30, 20, 5);

				p5.noStroke();
				p5.fill(point.color[0], point.color[1], point.color[2], alpha);
				p5.ellipse(point.x, point.y, size, size);

				return true;
			});

			// Update and draw particles
			particles = particles.filter(particle => {
				particle.x += particle.vx;
				particle.y += particle.vy;
				particle.vy += 0.2; // gravity
				particle.vx *= 0.99; // friction
				particle.rotation += particle.rotationSpeed;
				particle.life -= 1 / particle.maxLife;

				if (particle.life <= 0) return false;

				const alpha = particle.life * 255;
				p5.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
				p5.noStroke();

				p5.push();
				p5.translate(particle.x, particle.y);
				p5.rotate(particle.rotation);

				if (particle.shape === 'star') {
					drawStar(0, 0, particle.size / 4, particle.size / 2, 5);
				} else if (particle.shape === 'square') {
					p5.rectMode(p5.CENTER);
					p5.rect(0, 0, particle.size, particle.size);
				} else {
					p5.ellipse(0, 0, particle.size, particle.size);
				}

				p5.pop();

				return true;
			});

			// Animate shapes on hover with wobble
			shapes.forEach(shape => {
				if (
					p5.mouseX > shape.x - shape.size / 2 &&
					p5.mouseX < shape.x + shape.size / 2 &&
					p5.mouseY > shape.y - shape.size / 2 &&
					p5.mouseY < shape.y + shape.size / 2
				) {
					shape.wobble += shape.wobbleSpeed;
					const wobbleSize = shape.size + Math.sin(shape.wobble) * 5;

					p5.fill(shape.color[0], shape.color[1], shape.color[2]);
					p5.noStroke();
					drawShapeByType(shape.type, shape.x, shape.y, wobbleSize);

					// Sparkle effect on hover
					if (p5.frameCount % 10 === 0) {
						particles.push({
							x: shape.x + p5.random(-shape.size / 2, shape.size / 2),
							y: shape.y + p5.random(-shape.size / 2, shape.size / 2),
							vx: p5.random(-1, 1),
							vy: p5.random(-2, 0),
							color: [246, 193, 119],
							size: p5.random(5, 10),
							life: 1,
							maxLife: 30,
							rotation: 0,
							rotationSpeed: 0.1,
							shape: 'star'
						});
					}
				}
			});
		};

		p5.windowResized = () => {
			const size = getCanvasSize();
			p5.resizeCanvas(size.width, size.height);
		};
	};
</script>

<div class="game-container">
	<div class="controls-hint">
		<a href="/" class="back-link" aria-label="Back to game picker">◄ EXIT</a>
		<span class="sep">|</span>
		<span class="hint"><kbd>A-Z</kbd> draw</span>
		<span class="hint"><kbd>↑↓</kbd> size</span>
		<span class="hint"><kbd>←→</kbd> color</span>
		<span class="hint"><kbd>SPC</kbd> blast</span>
		<span class="hint"><kbd>CLK</kbd> shape</span>
	</div>
	<div class="canvas-wrapper" bind:this={canvasContainer}>
		<P5 {sketch} />
	</div>
</div>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.canvas-wrapper {
		flex: 1;
		min-height: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.controls-hint {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		padding: 0.35rem 0.85rem;
		background: var(--rp-surface);
		border: 2px solid var(--rp-iris);
		border-radius: 4px;
		margin: 0 auto 0.35rem;
		max-width: fit-content;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 12px var(--rp-iris);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		letter-spacing: 0.15em;
	}

	.hint {
		color: var(--rp-subtle);
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.sep {
		color: var(--rp-hl-high);
	}

	.back-link {
		color: var(--rp-gold);
		text-decoration: none;
		text-shadow: 0 0 6px var(--rp-gold);
		padding: 0.25rem 0.5rem;
		border: 2px solid var(--rp-gold);
		border-radius: 3px;
		transition: background 0.15s, color 0.15s;
	}

	.back-link:hover,
	.back-link:focus-visible {
		background: var(--rp-gold);
		color: var(--rp-base);
		text-shadow: none;
		outline: none;
	}

	kbd {
		background: var(--rp-overlay);
		color: var(--rp-foam);
		text-shadow: 0 0 4px var(--rp-foam);
		border: 1px solid var(--rp-foam);
		border-radius: 2px;
		padding: 0.15rem 0.4rem;
		font-family: inherit;
		font-weight: normal;
	}

	:global(canvas) {
		border: 3px solid var(--rp-pine);
		border-radius: 4px;
		box-shadow:
			0 0 0 2px var(--rp-base),
			0 0 18px var(--rp-pine);
		display: block;
		margin: 0 auto;
	}
</style>
