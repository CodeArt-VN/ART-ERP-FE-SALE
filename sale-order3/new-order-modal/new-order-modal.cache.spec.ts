import { clearCachedList, listCacheScope, readCachedList, writeCachedList } from './new-order-modal.cache';

describe('new-order-modal.cache', () => {
	beforeEach(() => clearCachedList());
	afterEach(() => clearCachedList());

	it('listCacheScope joins branch and staff', () => {
		expect(listCacheScope(3, 9)).toBe('3:9');
		expect(listCacheScope(null, undefined)).toBe('0:0');
	});

	it('write/read within TTL and scope', () => {
		const scope = '1:2';
		writeCachedList(scope, [{ Id: 7, TrackId: '7-0', Name: 'A', Address: '', DayRank: 7, Sort: 0, McpDays: [], Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false }], 1000);
		expect(readCachedList(scope, 1000 + 60_000)?.[0].Id).toBe(7);
		expect(readCachedList('9:9', 1000 + 60_000)).toBeNull();
		expect(readCachedList(scope, 1000 + 6 * 60_000)).toBeNull();
	});
});
