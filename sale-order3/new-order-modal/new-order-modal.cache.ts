import { CustomerPickRow, customerPickTrackId } from './new-order-modal.util';

export const LIST_CACHE_KEY = 'sale-order3.customerPicker.list';
/** 5 minutes */
export const LIST_CACHE_TTL_MS = 5 * 60 * 1000;

export interface CustomerPickerListCache {
	rows: CustomerPickRow[];
	ts: number;
	scope: string;
}

let memory: CustomerPickerListCache | null = null;

function storage(): Storage | null {
	try {
		return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
	} catch {
		return null;
	}
}

export function listCacheScope(branchId: number | string | null | undefined, staffId: number | string | null | undefined): string {
	return `${branchId ?? 0}:${staffId ?? 0}`;
}

export function readCachedList(scope: string, now = Date.now(), ttlMs = LIST_CACHE_TTL_MS): CustomerPickRow[] | null {
	const fromMem = memory && memory.scope === scope && now - memory.ts <= ttlMs ? memory.rows : null;
	if (fromMem) return fromMem;

	try {
		const raw = storage()?.getItem(LIST_CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CustomerPickerListCache;
		if (!parsed || parsed.scope !== scope || !Array.isArray(parsed.rows)) return null;
		if (now - parsed.ts > ttlMs) return null;
		const rows = (parsed.rows || []).map((r) => (r?.TrackId ? r : { ...r, TrackId: customerPickTrackId(r) }));
		memory = { ...parsed, rows };
		return rows;
	} catch {
		return null;
	}
}

export function writeCachedList(scope: string, rows: CustomerPickRow[], ts = Date.now()): void {
	const payload: CustomerPickerListCache = { scope, rows: rows || [], ts };
	memory = payload;
	try {
		storage()?.setItem(LIST_CACHE_KEY, JSON.stringify(payload));
	} catch {
		/* ignore quota */
	}
}

export function clearCachedList(): void {
	memory = null;
	try {
		storage()?.removeItem(LIST_CACHE_KEY);
	} catch {
		/* ignore */
	}
}
