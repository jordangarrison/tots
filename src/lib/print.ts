const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
	new Promise((resolve) => {
		try {
			canvas.toBlob((blob) => resolve(blob), 'image/png');
		} catch {
			resolve(null);
		}
	});

export const printCanvas = async (source: HTMLCanvasElement, title = 'Drawing') => {
	const blob = await canvasToBlob(source);
	if (!blob) return;
	const url = URL.createObjectURL(blob);

	const iframe = document.createElement('iframe');
	iframe.setAttribute('aria-hidden', 'true');
	iframe.style.cssText = [
		'position:fixed',
		'top:0',
		'left:0',
		'width:100%',
		'height:100%',
		'border:0',
		'opacity:0',
		'pointer-events:none',
		'z-index:-1'
	].join(';');
	document.body.appendChild(iframe);

	let cleaned = false;
	const cleanup = () => {
		if (cleaned) return;
		cleaned = true;
		URL.revokeObjectURL(url);
		if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
	};

	const doc = iframe.contentDocument;
	if (!doc) {
		cleanup();
		return;
	}

	const safeTitle = title.replace(/[<>&"']/g, '');

	doc.open();
	doc.write(`<!doctype html>
<html>
<head>
<title>${safeTitle}</title>
<style>
	@page { margin: 0.4in; }
	html, body { margin: 0; padding: 0; background: #ffffff; height: 100%; }
	body {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	img {
		max-width: 100%;
		max-height: 100vh;
		display: block;
		object-fit: contain;
	}
	@media print {
		html, body { height: auto; }
		body { display: block; }
		img { width: 100%; height: auto; max-height: none; }
	}
</style>
</head>
<body><img alt="${safeTitle}" /></body>
</html>`);
	doc.close();

	const win = iframe.contentWindow;
	const img = doc.querySelector('img') as HTMLImageElement | null;
	if (!win || !img) {
		cleanup();
		return;
	}

	win.addEventListener('afterprint', () => setTimeout(cleanup, 500));
	img.addEventListener('error', cleanup);

	let printed = false;
	const triggerPrint = () => {
		if (printed) return;
		printed = true;
		try {
			win.focus();
			win.print();
		} catch {
			cleanup();
		}
	};

	img.addEventListener('load', triggerPrint, { once: true });
	img.src = url;
	if (typeof img.decode === 'function') {
		img.decode().then(triggerPrint).catch(() => {
			// fall back to load event listener (already attached)
		});
	}
};
