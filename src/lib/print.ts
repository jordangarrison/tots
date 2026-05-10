export const printCanvas = (source: HTMLCanvasElement, title = 'Drawing') => {
	const dataUrl = source.toDataURL('image/png');

	const iframe = document.createElement('iframe');
	iframe.setAttribute('aria-hidden', 'true');
	iframe.style.position = 'fixed';
	iframe.style.right = '0';
	iframe.style.bottom = '0';
	iframe.style.width = '0';
	iframe.style.height = '0';
	iframe.style.border = '0';
	iframe.style.opacity = '0';
	document.body.appendChild(iframe);

	const cleanup = () => {
		if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
	};

	const onAfterPrint = () => {
		setTimeout(cleanup, 250);
	};

	const doc = iframe.contentDocument;
	if (!doc) {
		cleanup();
		return;
	}

	doc.open();
	doc.write(`<!doctype html>
<html>
<head>
<title>${title}</title>
<style>
	@page { margin: 0.4in; }
	html, body { margin: 0; padding: 0; background: #ffffff; }
	body {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}
	img {
		max-width: 100%;
		max-height: 100vh;
		display: block;
	}
	@media print {
		body { min-height: auto; }
	}
</style>
</head>
<body>
<img alt="${title}" />
</body>
</html>`);
	doc.close();

	const win = iframe.contentWindow;
	const img = doc.querySelector('img');
	if (!win || !img) {
		cleanup();
		return;
	}

	win.addEventListener('afterprint', onAfterPrint);

	img.addEventListener('load', () => {
		try {
			win.focus();
			win.print();
		} catch {
			cleanup();
		}
	});

	img.addEventListener('error', cleanup);

	img.src = dataUrl;
};
