import { applyWarehouseNames, balanceRequestQuery, hasInStock, isOutOfStock, showsSearchSpinner, warehouseCatalogId, withDefaultInStock } from './inventory-balance.util';

describe('inventory balance', () => {
	it('treats zero and negative quantities as out of stock', () => {
		expect(isOutOfStock(0)).toBe(true);
		expect(isOutOfStock(-3)).toBe(true);
		expect(isOutOfStock(2)).toBe(false);
	});

	it('fills the warehouse name from the shared list', () => {
		const rows = applyWarehouseNames(
			[
				{
					ItemId: 9,
					Warehouses: [
						{ IDBranch: 104, CloseQuantity: -3 },
						{ IDBranch: 105, CloseQuantity: 4 },
					],
				},
			],
			[
				{ Id: 104, Name: 'Kho Long Thành' },
				{ Id: 105, Name: 'Kho Xuân Lộc' },
			]
		);

		expect(rows[0].Warehouses.map((warehouse) => warehouse.BranchName)).toEqual(['Kho Long Thành', 'Kho Xuân Lộc']);
		expect(rows[0].Warehouses.map((warehouse) => warehouse.CloseQuantity)).toEqual([-3, 4]);
	});

	it('keeps an item when one warehouse still has stock', () => {
		expect(hasInStock({ Warehouses: [{ CloseQuantity: -1, UoMs: [] }, { CloseQuantity: 4, UoMs: [{ Quantity: 4 }] }] })).toBe(true);
		expect(hasInStock({ Warehouses: [{ CloseQuantity: -3, UoMs: [] }] })).toBe(false);
		expect(hasInStock({ Warehouses: [{ CloseQuantity: 0, UoMs: [{ Quantity: 0 }] }] })).toBe(false);
	});

	it('turns the in-stock filter on when the query has no choice yet', () => {
		const query = withDefaultInStock({ Keyword: '', Take: 200, Skip: 0 });
		expect(query.inStockOnly).toBe(true);
		expect(balanceRequestQuery(query).InStock).toBe(true);

		const cleared = withDefaultInStock({ Skip: 0, inStockOnly: null });
		expect(cleared.inStockOnly).toBeNull();
		expect(withDefaultInStock({ inStockOnly: true }).inStockOnly).toBe(true);
	});

	it('sends InStock only while query.inStockOnly is on', () => {
		const on = balanceRequestQuery({ Skip: 0, inStockOnly: true });
		expect(on.InStock).toBe(true);
		expect(on.inStockOnly).toBeUndefined();
		expect(on.Skip).toBe(0);

		const off = balanceRequestQuery({ Skip: 0, inStockOnly: null });
		expect(off.InStock).toBeUndefined();
		expect(off.inStockOnly).toBeUndefined();
		expect(balanceRequestQuery({ Skip: 0 }).InStock).toBeUndefined();
	});

	it('shows the table spinner when the list is searched again', () => {
		expect(showsSearchSpinner(null)).toBe(true);
		expect(showsSearchSpinner('search')).toBe(true);
		expect(showsSearchSpinner({ target: {} })).toBe(false);
	});

	it('reads the warehouse id from Id', () => {
		expect(warehouseCatalogId({ Id: 104, Name: 'Kho A' })).toBe(104);
		expect(warehouseCatalogId(null)).toBeNull();
	});

	it('keeps a name already present on the stock row', () => {
		const rows = applyWarehouseNames([{ ItemId: 9, Warehouses: [{ IDBranch: 104, BranchName: 'Kho A', CloseQuantity: 2 }] }]);

		expect(rows[0].Warehouses[0].BranchName).toBe('Kho A');
	});
});
