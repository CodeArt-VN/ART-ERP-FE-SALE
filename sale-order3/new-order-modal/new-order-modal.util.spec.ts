import {
	customerPickKey,
	customerPickTypeIcon,
	distanceMeters,
	formatDistanceM,
	isSameCustomerPick,
	mapCustomerPickerRow,
	mapCustomerPickerRows,
	mcpDayRank,
	mcpDaysOf,
	pinSelectedCustomer,
	sortCustomerPickerRows,
} from './new-order-modal.util';

describe('new-order-modal.util', () => {
	it('mcpDaysOf lists active days', () => {
		expect(mcpDaysOf({ Thursday: true, Friday: true })).toEqual(['Thu', 'Fri']);
		expect(mcpDaysOf({})).toEqual([]);
	});

	it('mcpDayRank relative to Thursday', () => {
		// getDay(): Sun=0 … Sat=6; Thursday=4
		expect(mcpDayRank(4, { Thursday: true })).toBe(0);
		expect(mcpDayRank(4, { Friday: true })).toBe(1);
		expect(mcpDayRank(4, { Wednesday: true })).toBe(6);
		expect(mcpDayRank(4, {})).toBe(7);
	});

	it('mapCustomerPickerRow maps lean API row', () => {
		const row = mapCustomerPickerRow({
			Id: 88,
			Name: 'KH A',
			Phone: '0901',
			IsPersonal: true,
			IDAddress: 9,
			AddressLine1: '12 NT',
			Lat: 10.77,
			Long: 106.7,
			Thursday: true,
			Sort: 2,
		});
		expect(row).toEqual(
			jasmine.objectContaining({
				Id: 88,
				TrackId: '88-9',
				Name: 'KH A',
				Phone: '0901',
				IsPersonal: true,
				Address: '12 NT',
				IDAddress: 9,
				McpDays: ['Thu'],
				Sort: 2,
			})
		);
		expect(mapCustomerPickerRow({ Id: 0 })).toBeNull();
		expect(mapCustomerPickerRows(null)).toEqual([]);
		expect(customerPickTypeIcon({ IsPersonal: true })).toEqual({ name: 'person-outline', color: 'success' });
		expect(customerPickTypeIcon({ IsPersonal: false })).toEqual({ name: 'business-outline', color: 'warning' });
	});

	it('sortCustomerPickerRows distance then day', () => {
		const sorted = sortCustomerPickerRows(
			[
				{ Id: 1, TrackId: '1-0', Name: 'Far Thu', Address: '', IsPersonal: false, Lat: 10.8, Long: 106.8, DayRank: 0, Sort: 0, McpDays: ['Thu'], Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false, Saturday: false, Sunday: false },
				{ Id: 2, TrackId: '2-0', Name: 'Near Fri', Address: '', IsPersonal: false, Lat: 10.7705, Long: 106.7, DayRank: 0, Sort: 0, McpDays: ['Fri'], Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true, Saturday: false, Sunday: false },
				{ Id: 3, TrackId: '3-0', Name: 'Nearer Thu', Address: '', IsPersonal: true, Lat: 10.7701, Long: 106.7, DayRank: 0, Sort: 0, McpDays: ['Thu'], Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false, Saturday: false, Sunday: false },
			],
			10.77,
			106.7,
			new Date('2026-11-12T12:00:00') // Thursday
		);
		expect(sorted.map((r) => r.Id)).toEqual([3, 2, 1]);
	});

	it('distanceMeters and formatDistanceM', () => {
		const m = distanceMeters(10.77, 106.7, 10.771, 106.7);
		expect(m).toBeGreaterThan(50);
		expect(m).toBeLessThan(200);
		expect(formatDistanceM(850)).toBe('850m');
		expect(formatDistanceM(1500)).toBe('1.5km');
		expect(formatDistanceM(null)).toBe('');
	});

	it('pinSelectedCustomer moves match to top', () => {
		const rows = [
			{ Id: 1, TrackId: '1-0', Name: 'A', Address: '', IsPersonal: false, DayRank: 0, Sort: 0, McpDays: [] as any, Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false },
			{ Id: 2, TrackId: '2-9', Name: 'B', Address: '', IsPersonal: true, IDAddress: 9, DayRank: 0, Sort: 0, McpDays: [] as any, Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false },
			{ Id: 3, TrackId: '3-0', Name: 'C', Address: '', IsPersonal: false, DayRank: 0, Sort: 0, McpDays: [] as any, Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false },
		];
		expect(pinSelectedCustomer(rows, { Id: 2, IDAddress: 9 }).map((r) => r.Id)).toEqual([2, 1, 3]);
		expect(pinSelectedCustomer(rows, { TrackId: '3-0' }).map((r) => r.Id)).toEqual([3, 1, 2]);
		expect(pinSelectedCustomer(rows, null).map((r) => r.Id)).toEqual([1, 2, 3]);
		expect(pinSelectedCustomer(rows, { Id: 99 }).map((r) => r.Id)).toEqual([1, 2, 3]);
		expect(isSameCustomerPick({ Id: 2, IDAddress: 9 }, { TrackId: '2-9' })).toBe(true);
		expect(customerPickKey({ Id: 5 })).toBe('5-0');
	});
});
