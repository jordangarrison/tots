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
