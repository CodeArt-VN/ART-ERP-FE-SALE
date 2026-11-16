/** Cached device geolocation for customer-picker distance sort. */

export interface GeoCoords {
	lat: number;
	lng: number;
	ts: number;
}

export const GEO_CACHE_KEY = 'sale-order3.customerPicker.geo';
/** 10 minutes */
export const GEO_CACHE_TTL_MS = 10 * 60 * 1000;
/** Cap how long we wait for the browser permission / GPS fix */
export const GEO_PROMPT_TIMEOUT_MS = 2500;

function storage(): Storage | null {
	try {
		return typeof localStorage !== 'undefined' ? localStorage : null;
	} catch {
		return null;
	}
}

export function readCachedGeo(now = Date.now(), ttlMs = GEO_CACHE_TTL_MS): GeoCoords | null {
	try {
		const store = storage();
		if (!store) return null;
		const raw = store.getItem(GEO_CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as GeoCoords;
		if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number' || typeof parsed?.ts !== 'number') return null;
		if (now - parsed.ts > ttlMs) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function writeCachedGeo(lat: number, lng: number, ts = Date.now()): GeoCoords {
	const coords: GeoCoords = { lat, lng, ts };
	try {
		storage()?.setItem(GEO_CACHE_KEY, JSON.stringify(coords));
	} catch {
		/* ignore quota */
	}
	return coords;
}

export function clearCachedGeo(): void {
	try {
		storage()?.removeItem(GEO_CACHE_KEY);
	} catch {
		/* ignore */
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('geo-timeout')), ms);
		promise.then(
			(v) => {
				clearTimeout(timer);
				resolve(v);
			},
			(err) => {
				clearTimeout(timer);
				reject(err);
			}
		);
	});
}

function getBrowserPosition(forceRefresh: boolean): Promise<{ lat: number; lng: number }> {
	return new Promise((resolve, reject) => {
		if (typeof navigator === 'undefined' || !navigator.geolocation) {
			reject(new Error('no-geo'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
			(err) => reject(err),
			{
				enableHighAccuracy: false,
				timeout: GEO_PROMPT_TIMEOUT_MS,
				maximumAge: forceRefresh ? 0 : GEO_CACHE_TTL_MS,
			}
		);
	});
}

/**
 * Resolve coords.
 * forceRefresh=false → cache only (never opens the browser permission dialog).
 * forceRefresh=true → prompt GPS with a hard timeout so UI never hangs on the dialog.
 */
export function resolveGeo(
	forceRefresh = false,
	getPosition?: () => Promise<{ lat: number; lng: number }>,
	promptTimeoutMs = GEO_PROMPT_TIMEOUT_MS
): Promise<GeoCoords | null> {
	const cached = readCachedGeo() || readCachedGeo(Date.now(), Number.MAX_SAFE_INTEGER);
	if (!forceRefresh) return Promise.resolve(cached);

	const fetchPos = getPosition || (() => getBrowserPosition(true));

	return withTimeout(fetchPos(), promptTimeoutMs)
		.then((p) => writeCachedGeo(p.lat, p.lng))
		.catch(() => cached);
}
