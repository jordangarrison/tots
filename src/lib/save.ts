// Save a canvas as an image, preferring the OS Pictures folder on desktop
// and the share sheet (e.g. iOS "Save Image" -> Photos) on mobile, with a
// plain anchor download as the final fallback.

export interface SaveImageOptions {
	/** Suggested file name without extension. */
	baseName: string;
	/** Image MIME type. Defaults to image/png. */
	mimeType?: string;
	/** File extension without the dot. Defaults to png. */
	extension?: string;
}

type FileSystemWritableFileStreamLike = {
	write: (data: Blob) => Promise<void>;
	close: () => Promise<void>;
};

type FileSystemFileHandleLike = {
	createWritable: () => Promise<FileSystemWritableFileStreamLike>;
};

type ShowSaveFilePickerLike = (options: {
	suggestedName: string;
	startIn?: 'pictures' | 'downloads' | 'documents' | 'desktop' | 'music' | 'videos';
	types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}) => Promise<FileSystemFileHandleLike>;

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string) =>
	new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType));

const wasUserCancel = (err: unknown) =>
	err instanceof DOMException && (err.name === 'AbortError' || err.name === 'NotAllowedError');

export const saveImage = async (
	canvas: HTMLCanvasElement,
	{ baseName, mimeType = 'image/png', extension = 'png' }: SaveImageOptions
): Promise<void> => {
	const blob = await canvasToBlob(canvas, mimeType);
	if (!blob) return;

	const fileName = `${baseName}.${extension}`;

	const picker = (window as unknown as { showSaveFilePicker?: ShowSaveFilePickerLike })
		.showSaveFilePicker;
	if (typeof picker === 'function') {
		try {
			const handle = await picker({
				suggestedName: fileName,
				startIn: 'pictures',
				types: [
					{
						description: `${extension.toUpperCase()} image`,
						accept: { [mimeType]: [`.${extension}`] }
					}
				]
			});
			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
			return;
		} catch (err) {
			if (wasUserCancel(err)) return;
			// Permissions or unsupported start location — fall through.
		}
	}

	const file = new File([blob], fileName, { type: mimeType });
	const nav = navigator as Navigator & {
		canShare?: (data: { files: File[] }) => boolean;
	};
	if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
		try {
			await nav.share({ files: [file], title: baseName });
			return;
		} catch (err) {
			if (wasUserCancel(err)) return;
			// Share unavailable for this content — fall through.
		}
	}

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
};
