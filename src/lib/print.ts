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

	const safeTitle = title.replace(/[<>&"']/g, '');

	const container = document.createElement('div');
	container.className = 'tots-print-area';

	const img = document.createElement('img');
	img.alt = safeTitle;
	img.draggable = false;
	container.appendChild(img);

	const style = document.createElement('style');
	style.textContent = `
.tots-print-area { display: none; }
@media print {
	html, body {
		overflow: visible !important;
		height: auto !important;
		background: #ffffff !important;
	}
	body > *:not(.tots-print-area) { display: none !important; }
	.tots-print-area {
		display: block !important;
		background: #ffffff;
		margin: 0;
		padding: 0;
	}
	.tots-print-area img {
		display: block;
		width: 100%;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}
	@page { margin: 0.4in; }
}`;

	document.head.appendChild(style);
	document.body.appendChild(container);

	let cleaned = false;
	let onAfterPrint: (() => void) | null = null;

	const cleanup = () => {
		if (cleaned) return;
		cleaned = true;
		URL.revokeObjectURL(url);
		if (container.parentNode) container.parentNode.removeChild(container);
		if (style.parentNode) style.parentNode.removeChild(style);
		if (onAfterPrint) {
			window.removeEventListener('afterprint', onAfterPrint);
			onAfterPrint = null;
		}
	};

	let printed = false;
	const triggerPrint = () => {
		if (printed) return;
		printed = true;

		onAfterPrint = () => setTimeout(cleanup, 300);
		window.addEventListener('afterprint', onAfterPrint);

		const originalTitle = document.title;
		document.title = safeTitle;
		try {
			window.print();
		} catch {
			cleanup();
		}
		document.title = originalTitle;
	};

	img.addEventListener('error', cleanup, { once: true });
	img.addEventListener('load', triggerPrint, { once: true });
	img.src = url;
	if (typeof img.decode === 'function') {
		img.decode().then(triggerPrint).catch(() => {
			// load event listener will fire as fallback
		});
	}
};
