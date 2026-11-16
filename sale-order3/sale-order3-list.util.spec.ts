import {
	customerAddressOf,
	customerNameOf,
	customerPhoneOf,
	hasShipment,
	keepCartOnCustomerRepick,
	orderTotalOf,
	resolveSaleOrderCanSubmit,
	shipmentIdsOf,
} from './sale-order3-list.util';

describe('sale-order3-list.util', () => {
	it('shipmentIdsOf drops empty / zero ids and normalizes scalar', () => {
		expect(shipmentIdsOf({ ShipmentIds: [0, 12, null as any, 0, 99] })).toEqual([12, 99]);
		expect(shipmentIdsOf({ ShipmentIds: 77 as any })).toEqual([77]);
		expect(shipmentIdsOf({})).toEqual([]);
		expect(shipmentIdsOf({ ShipmentIds: null })).toEqual([]);
	});

	it('hasShipment is true only when a real shipment id exists', () => {
		expect(hasShipment({ ShipmentIds: [0] })).toBeFalse();
		expect(hasShipment({ ShipmentIds: [55] })).toBeTrue();
	});

	it('customer helpers prefer _Customer over flat mock fields', () => {
		const row = {
			CustomerName: 'Mock',
			AddressLine1: 'Mock addr',
			WorkPhone: '000',
			_Customer: {
				Name: 'Live KH',
				WorkPhone: '0901',
				Address: { AddressLine1: '12 Nguyễn Trãi' },
			},
		};
		expect(customerNameOf(row)).toBe('Live KH');
		expect(customerAddressOf(row)).toBe('12 Nguyễn Trãi');
		expect(customerPhoneOf(row)).toBe('0901');
	});

	it('customer helpers fall back to flat fields', () => {
		const row = { CustomerName: 'Mock', AddressLine1: 'A1', WorkPhone: '1' };
		expect(customerNameOf(row)).toBe('Mock');
		expect(customerAddressOf(row)).toBe('A1');
		expect(customerPhoneOf(row)).toBe('1');
	});

	it('orderTotalOf prefers TotalAfterTax when set', () => {
		expect(orderTotalOf({ TotalAfterTax: 100, OriginalTotalAfterTax: 200 })).toBe(100);
		expect(orderTotalOf({ TotalAfterTax: 0, OriginalTotalAfterTax: 200 })).toBe(200);
		expect(orderTotalOf({ OriginalTotalAfterTax: 50 })).toBe(50);
	});

	it('resolveSaleOrderCanSubmit from form child rights', () => {
		expect(resolveSaleOrderCanSubmit({})).toBe(false);
		expect(resolveSaleOrderCanSubmit({ canSubmitSalesmanOrdersForApproval: true })).toBe(true);
		expect(resolveSaleOrderCanSubmit({ canSubmitOrdersForApproval: true })).toBe(true);
		expect(resolveSaleOrderCanSubmit({ canSubmit: true })).toBe(true);
	});

	it('keepCartOnCustomerRepick only clears on fresh Add', () => {
		expect(keepCartOnCustomerRepick('add')).toBe(false);
		expect(keepCartOnCustomerRepick('category')).toBe(true);
		expect(keepCartOnCustomerRepick('cart')).toBe(true);
	});
});
