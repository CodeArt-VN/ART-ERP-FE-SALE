import { parseSo3CatalogCache, parseSo3Draft } from './sale-order3-offline.service';

describe('SaleOrder3OfflineService parsers', () => {
	it('parseSo3Draft keeps valid cart lines and outlet', () => {
		const draft = parseSo3Draft({
			outlet: { Id: 1, Name: 'A', Address: 'x' },
			cart: [
				{ ItemId: 9, Name: 'Milk', Price: 1, UoM: 'Lon', Qty: 2 },
				{ ItemId: 10, Name: 'Bad', Price: 1, UoM: 'Lon', Qty: 0 },
			],
			orderMeta: { Name: 'Nội dung', IsSampleOrder: true, IsUrgentOrders: 1 },
			updatedAt: 100,
		});
		expect(draft?.outlet?.Id).toBe(1);
		expect(draft?.cart.length).toBe(1);
		expect(draft?.cart[0].ItemId).toBe(9);
		expect(draft?.orderMeta.Name).toBe('Nội dung');
		expect(draft?.orderMeta.IsSampleOrder).toBe(true);
		expect(draft?.orderMeta.IsUrgentOrders).toBe(true);
		expect(draft?.orderMeta.IsWholeSale).toBe(false);
		expect(draft?.updatedAt).toBe(100);
	});

	it('parseSo3Draft defaults orderMeta when missing', () => {
		const draft = parseSo3Draft({
			outlet: { Id: 1, Name: 'A', Address: 'x' },
			cart: [],
		});
		expect(draft?.orderMeta.Name).toBe('');
		expect(draft?.orderMeta.IsInvoiceRequired).toBe(false);
	});

	it('parseSo3Draft returns null for junk', () => {
		expect(parseSo3Draft(null)).toBeNull();
		expect(parseSo3Draft('x')).toBeNull();
	});

	it('parseSo3CatalogCache requires categories and products', () => {
		expect(parseSo3CatalogCache({ categories: [], products: [{ Id: 1 }] })).toBeNull();
		const ok = parseSo3CatalogCache({
			categories: [{ Id: 'a', Name: 'A', Icon: 'star', Color: 'primary' }],
			products: [{ Id: 1, Name: 'P', Price: 1, UoM: 'Thùng', ImageColor: '#fff' }],
			updatedAt: 5,
		});
		expect(ok?.categories.length).toBe(1);
		expect(ok?.products.length).toBe(1);
		expect(ok?.updatedAt).toBe(5);
	});
});
