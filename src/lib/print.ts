const escapeAttr = (s: string) => s.replace(/[<>&"']/g, '');

export const printCanvas = (source: HTMLCanvasElement, title = 'Drawing') => {
	let dataUrl: string;
	try {
		dataUrl = source.toDataURL('image/png');
	} catch {
		alert('Could not prepare this drawing for printing.');
		return;
	}

	const safeTitle = escapeAttr(title);

	const win = window.open('', '_blank', 'width=900,height=700');
	if (!win) {
		alert('To print, please allow pop-ups for this site, then click PRINT again.');
		return;
	}

	const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
	@page { margin: 0.4in; }
	html, body {
		margin: 0;
		padding: 0;
		background: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}
	.bar {
		position: sticky;
		top: 0;
		display: flex;
		gap: 8px;
		justify-content: center;
		padding: 10px;
		background: #f4f4f5;
		border-bottom: 1px solid #d4d4d8;
	}
	.bar button {
		padding: 8px 16px;
		font: inherit;
		font-size: 14px;
		background: #ffffff;
		border: 1px solid #d4d4d8;
		border-radius: 6px;
		cursor: pointer;
	}
	.bar button:hover { background: #fafafa; }
	.stage {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		min-height: calc(100vh - 60px);
		box-sizing: border-box;
	}
	img {
		display: block;
		max-width: 100%;
		max-height: calc(100vh - 100px);
		height: auto;
		width: auto;
	}
	@media print {
		.bar { display: none; }
		.stage { padding: 0; min-height: auto; }
		img {
			max-width: 100%;
			max-height: 100vh;
			page-break-inside: avoid;
			break-inside: avoid;
		}
	}
</style>
</head>
<body>
<div class="bar">
	<button id="print-btn" type="button">Print</button>
	<button id="close-btn" type="button">Close</button>
</div>
<div class="stage">
	<img src="${dataUrl}" alt="${safeTitle}" />
</div>
<script>
	(function () {
		var img = document.querySelector('img');
		var printBtn = document.getElementById('print-btn');
		var closeBtn = document.getElementById('close-btn');
		printBtn.addEventListener('click', function () { window.print(); });
		closeBtn.addEventListener('click', function () { window.close(); });
		function go() {
			try { window.focus(); window.print(); } catch (e) {}
		}
		if (img.complete) {
			setTimeout(go, 100);
		} else {
			img.addEventListener('load', function () { setTimeout(go, 100); });
		}
	})();
</script>
</body>
</html>`;

	win.document.open();
	win.document.write(html);
	win.document.close();
};

const PAGE_W = 2200;
const PAGE_H = 1700;

const drawFit = (
	ctx: CanvasRenderingContext2D,
	src: HTMLCanvasElement,
	dx: number,
	dy: number,
	dw: number,
	dh: number
) => {
	const scale = Math.min(dw / src.width, dh / src.height);
	const w = src.width * scale;
	const h = src.height * scale;
	const x = dx + (dw - w) / 2;
	const y = dy + (dh - h) / 2;
	ctx.drawImage(src, x, y, w, h);
};

const drawBackCoverSignature = (
	ctx: CanvasRenderingContext2D,
	signature: string,
	dx: number,
	dy: number,
	dw: number,
	dh: number
) => {
	if (!signature.trim()) return;
	ctx.save();
	ctx.fillStyle = '#666';
	ctx.font = "32px 'Patrick Hand', 'Comic Sans MS', cursive";
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(`made with ♥ by ${signature}`, dx + dw / 2, dy + dh - 120);
	ctx.restore();
};

const drawFoldGuide = (ctx: CanvasRenderingContext2D, x: number, height: number) => {
	ctx.save();
	ctx.strokeStyle = 'rgba(0,0,0,0.18)';
	ctx.lineWidth = 1.5;
	ctx.setLineDash([12, 10]);
	ctx.beginPath();
	ctx.moveTo(x, 30);
	ctx.lineTo(x, height - 30);
	ctx.stroke();
	ctx.restore();
};

export const printCardFold = (
	frontCanvas: HTMLCanvasElement,
	insideCanvas: HTMLCanvasElement,
	signature: string,
	title = 'Card'
) => {
	const page1 = document.createElement('canvas');
	page1.width = PAGE_W;
	page1.height = PAGE_H;
	const ctx1 = page1.getContext('2d');
	if (!ctx1) return;
	ctx1.fillStyle = '#ffffff';
	ctx1.fillRect(0, 0, PAGE_W, PAGE_H);

	const halfW = PAGE_W / 2;
	drawFit(ctx1, frontCanvas, 0, 0, halfW, PAGE_H);
	drawBackCoverSignature(ctx1, signature, halfW, 0, halfW, PAGE_H);
	drawFoldGuide(ctx1, halfW, PAGE_H);

	const page2 = document.createElement('canvas');
	page2.width = PAGE_W;
	page2.height = PAGE_H;
	const ctx2 = page2.getContext('2d');
	if (!ctx2) return;
	ctx2.fillStyle = '#ffffff';
	ctx2.fillRect(0, 0, PAGE_W, PAGE_H);
	drawFit(ctx2, insideCanvas, 0, 0, PAGE_W, PAGE_H);
	drawFoldGuide(ctx2, halfW, PAGE_H);

	let page1Url: string;
	let page2Url: string;
	try {
		page1Url = page1.toDataURL('image/png');
		page2Url = page2.toDataURL('image/png');
	} catch {
		alert('Could not prepare this card for printing.');
		return;
	}

	const safeTitle = escapeAttr(title);

	const win = window.open('', '_blank', 'width=1000,height=800');
	if (!win) {
		alert('To print, please allow pop-ups for this site, then click PRINT again.');
		return;
	}

	const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
	@page { size: letter landscape; margin: 0; }
	html, body {
		margin: 0;
		padding: 0;
		background: #f4f4f5;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}
	.bar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		gap: 12px;
		justify-content: center;
		align-items: center;
		padding: 12px;
		background: #ffffff;
		border-bottom: 1px solid #d4d4d8;
		flex-wrap: wrap;
	}
	.bar button {
		padding: 10px 18px;
		font: inherit;
		font-size: 14px;
		background: #f6c177;
		border: 1px solid #ca8a04;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
	}
	.bar button.secondary {
		background: #ffffff;
		border-color: #d4d4d8;
		font-weight: 400;
	}
	.bar button:hover { filter: brightness(0.95); }
	.steps {
		max-width: 900px;
		margin: 16px auto;
		padding: 16px 20px;
		background: #fff7ed;
		border: 1px solid #fdba74;
		border-radius: 8px;
		color: #7c2d12;
		font-size: 14px;
		line-height: 1.5;
	}
	.steps h2 { margin: 0 0 8px; font-size: 16px; color: #9a3412; }
	.steps ol { margin: 0; padding-left: 20px; }
	.steps li { margin: 4px 0; }
	.pages {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 16px;
	}
	.page {
		background: #ffffff;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		max-width: 100%;
	}
	.page img {
		display: block;
		width: 100%;
		height: auto;
		max-width: 1100px;
	}
	.page-label {
		max-width: 1100px;
		margin: 0 auto;
		padding: 4px 8px;
		font-size: 12px;
		color: #52525b;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	@media print {
		.bar, .steps, .page-label { display: none; }
		body { background: #ffffff; }
		.pages { padding: 0; gap: 0; }
		.page {
			box-shadow: none;
			page-break-after: always;
			break-after: page;
			width: 100%;
			height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.page:last-child {
			page-break-after: auto;
			break-after: auto;
		}
		.page img {
			width: 100%;
			height: 100%;
			max-width: none;
			object-fit: contain;
		}
	}
</style>
</head>
<body>
<div class="bar">
	<button id="print-btn" type="button">Print</button>
	<button id="close-btn" class="secondary" type="button">Close</button>
</div>
<div class="steps">
	<h2>How to print your card</h2>
	<ol>
		<li><strong>Easiest:</strong> Print both pages on separate sheets, then glue or tape them back-to-back with the printed sides facing out. Fold in half along the dotted line.</li>
		<li><strong>Double-sided printer:</strong> In your print dialog choose <em>Print on both sides</em> with <em>Flip on short edge</em>. Then fold in half along the dotted line.</li>
		<li>The cover is on the left of Page 1. Fold so the cover ends up on top.</li>
	</ol>
</div>
<div class="pages">
	<div>
		<div class="page-label">Page 1 — Outside (cover &amp; back)</div>
		<div class="page"><img src="${page1Url}" alt="Card outside" /></div>
	</div>
	<div>
		<div class="page-label">Page 2 — Inside</div>
		<div class="page"><img src="${page2Url}" alt="Card inside" /></div>
	</div>
</div>
<script>
	(function () {
		var printBtn = document.getElementById('print-btn');
		var closeBtn = document.getElementById('close-btn');
		printBtn.addEventListener('click', function () { window.print(); });
		closeBtn.addEventListener('click', function () { window.close(); });
	})();
</script>
</body>
</html>`;

	win.document.open();
	win.document.write(html);
	win.document.close();
};
