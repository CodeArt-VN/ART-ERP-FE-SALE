import { Capacitor } from '@capacitor/core';

export type ShareInvoicePayload = {
	title: string;
	text: string;
	url: string;
};

export type ShareInvoiceResult = 'shared' | 'cancelled' | 'unavailable';

/** True when native Share plugin or Web Share API can open a system sheet. */
export function canShareInvoiceLink(): boolean {
	if (Capacitor.isNativePlatform()) return true;
	const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: unknown }) : null;
	return !!nav?.share;
}

/** Opens native share sheet (Capacitor Share / Web Share API). Clipboard is not used. */
export async function shareInvoiceLink(payload: ShareInvoicePayload): Promise<ShareInvoiceResult> {
	if (!payload?.url) return 'unavailable';

	if (Capacitor.isNativePlatform()) {
		try {
			const { Share } = await import('@capacitor/share');
			await Share.share({
				title: payload.title,
				text: payload.text,
				url: payload.url,
				dialogTitle: payload.title,
			});
			return 'shared';
		} catch (e: any) {
			if (e?.message === 'Share canceled' || e?.code === 'ABORT_ERR') return 'cancelled';
			// fall through to Web Share
		}
	}

	const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : null;
	if (nav?.share) {
		try {
			await nav.share({ title: payload.title, text: payload.text, url: payload.url });
			return 'shared';
		} catch (e: any) {
			if (e?.name === 'AbortError') return 'cancelled';
			throw e;
		}
	}

	return 'unavailable';
}
