import { GEO_CACHE_KEY, clearCachedGeo, readCachedGeo, resolveGeo, writeCachedGeo } from './new-order-modal.geo';

describe('new-order-modal.geo', () => {
	beforeEach(() => {
		clearCachedGeo();
	});

	afterEach(() => {
		clearCachedGeo();
	});

	it('write/read cache within TTL', () => {
		writeCachedGeo(10.1, 106.2, 1_000);
		expect(readCachedGeo(1_000 + 60_000)).toEqual({ lat: 10.1, lng: 106.2, ts: 1_000 });
		expect(readCachedGeo(1_000 + 11 * 60_000)).toBeNull();
	});

	it('resolveGeo uses cache only when not forcing (no GPS call)', async () => {
		writeCachedGeo(1, 2, Date.now());
		const cached = await resolveGeo(false, () => Promise.reject(new Error('should-not-call')));
		expect(cached?.lat).toBe(1);

		clearCachedGeo();
		const empty = await resolveGeo(false, () => Promise.resolve({ lat: 9, lng: 9 }));
		expect(empty).toBeNull();

		const fresh = await resolveGeo(true, () => Promise.resolve({ lat: 3, lng: 4 }));
		expect(fresh).toEqual(jasmine.objectContaining({ lat: 3, lng: 4 }));
		expect(localStorage.getItem(GEO_CACHE_KEY)).toContain('"lat":3');
	});

	it('resolveGeo falls back to cache on GPS failure', async () => {
		writeCachedGeo(9, 8, Date.now());
		const geo = await resolveGeo(true, () => Promise.reject(new Error('denied')));
		expect(geo?.lat).toBe(9);
	});
});
