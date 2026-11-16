import { DemoCartLine, DemoProduct } from './demo-data';
import {
	addToCart,
	buildCartSummary,
	cartDiscountTotal,
	cartLineAmount,
	cartMerchandiseTotal,
	cartTotal,
	lineHasAdjustedUnitPrice,
	lineListUnitPrice,
	parseQtyInput,
	patchCartLine,
	recalcCartLine,
	setCartQty,
} from './cart.util';

function baseLine(over: Partial<DemoCartLine> = {}): DemoCartLine {
	return {
		ItemId: 1,
		Name: 'Omachi',
		Price: 194537,
		UoM: 'Thùng',
		Qty: 1,
		IDUoM: 1,
		UoMs: [
			{ Id: 1, Name: 'Thùng' },
			{ Id: 2, Name: 'Hộp' },
		],
		UoMPrice: 194537,
		OriginalDiscount1: 0,
		OriginalDiscount2: 0,
		IsPromotionItem: false,
		OriginalDiscountFromSalesman: 0,
		SalesmanPrice: 194537,
		...over,
	};
}

describe('sale-order3 cart.util', () => {
	it('recalcCartLine matches sale-order-detail: SalesmanPrice = phải thu / qty', () => {
		const after = 2 * 194537 - 1500;
		const line = recalcCartLine(
			baseLine({ Qty: 2, OriginalDiscount1: 1000, OriginalDiscount2: 500, OriginalDiscountFromSalesman: 2000 })
		);
		expect(line.OriginalTotalAfterDiscount).toBe(after);
		expect(line.OriginalTotalAfterDiscountFromSalesman).toBe(after - 2000);
		expect(line.SalesmanPrice).toBe((after - 2000) / 2);
	});

	it('recalcCartLine zeroes amounts for promotion items', () => {
		const line = recalcCartLine(baseLine({ IsPromotionItem: true, OriginalDiscount1: 999 }));
		expect(line.OriginalDiscount1).toBe(0);
		expect(line.OriginalTotalAfterDiscount).toBe(0);
		expect(line.OriginalTotalAfterDiscountFromSalesman).toBe(0);
		expect(cartLineAmount(line)).toBe(0);
	});

	it('patchCartLine SalesmanPrice derives bù giá like changedSalesmanPrice', () => {
		const after = 2 * 100000;
		const next = patchCartLine([baseLine({ Qty: 2, UoMPrice: 100000, Price: 100000 })], 1, {
			SalesmanPrice: 90000,
		});
		expect(next[0].OriginalTotalAfterDiscountFromSalesman).toBe(180000);
		expect(next[0].OriginalDiscountFromSalesman).toBe(after - 180000);
		expect(next[0].SalesmanPrice).toBe(90000);
	});

	it('patchCartLine payables derives SalesmanPrice like mobile-detail', () => {
		const after = 2 * 194537;
		const next = patchCartLine([baseLine({ Qty: 2 })], 1, {
			OriginalTotalAfterDiscountFromSalesman: 380000,
		});
		expect(next[0].SalesmanPrice).toBe(380000 / 2);
		expect(next[0].OriginalDiscountFromSalesman).toBe(after - 380000);
		expect(next[0].OriginalTotalAfterDiscountFromSalesman).toBe(380000);
	});

	it('patchCartLine updates UoM name from IDUoM', () => {
		const next = patchCartLine([baseLine()], 1, { IDUoM: 2 });
		expect(next[0].UoM).toBe('Hộp');
	});

	it('cartMerchandiseTotal / cartDiscountTotal from gross vs payables', () => {
		const line = recalcCartLine(baseLine({ Qty: 2, OriginalDiscount1: 1000, OriginalDiscount2: 500 }));
		const lines = [line];
		expect(cartMerchandiseTotal(lines)).toBe(2 * 194537);
		expect(cartDiscountTotal(lines)).toBe(2 * 194537 - cartTotal(lines));
	});

	it('addToCart / setCartQty keep full-control fields', () => {
		const product: DemoProduct = {
			Id: 9,
			Name: 'SP',
			Price: 10000,
			UoM: 'Thùng',
			CategoryId: 1,
			ImageColor: '#ccc',
		};
		let cart = addToCart([], product, 1);
		expect(cart[0].UoMPrice).toBe(10000);
		expect(cart[0].OriginalTotalAfterDiscount).toBe(10000);
		expect(cart[0].SalesmanPrice).toBe(10000);
		cart = setCartQty(cart, 9, 3);
		expect(cart[0].Qty).toBe(3);
		expect(cartTotal(cart)).toBe(30000);
		expect(cart[0].SalesmanPrice).toBe(10000);
	});

	it('parseQtyInput skips empty mid-edit and clamps to >= 0', () => {
		expect(parseQtyInput('')).toBeNull();
		expect(parseQtyInput(null)).toBeNull();
		expect(parseQtyInput(undefined)).toBeNull();
		expect(parseQtyInput('12')).toBe(12);
		expect(parseQtyInput(3)).toBe(3);
		expect(parseQtyInput(-2)).toBe(0);
		expect(parseQtyInput('abc')).toBeNull();
	});

	it('lineHasAdjustedUnitPrice when SalesmanPrice differs from list price', () => {
		expect(lineListUnitPrice(baseLine({ UoMPrice: 100000 }))).toBe(100000);
		expect(lineHasAdjustedUnitPrice(baseLine({ UoMPrice: 100000, SalesmanPrice: 100000 }))).toBe(false);
		expect(lineHasAdjustedUnitPrice(baseLine({ UoMPrice: 100000, SalesmanPrice: 90000 }))).toBe(true);
		expect(lineHasAdjustedUnitPrice(baseLine({ IsPromotionItem: true, SalesmanPrice: 0 }))).toBe(false);
	});

	it('buildCartSummary matches before CK → NCC/NPP → VAT → after tax → bù giá', () => {
		const line = recalcCartLine(
			baseLine({
				Qty: 2,
				UoMPrice: 100000,
				Price: 100000,
				OriginalDiscount1: 5000,
				OriginalDiscount2: 3000,
				OriginalDiscountFromSalesman: 2000,
				TaxRate: 10,
			})
		);
		const s = buildCartSummary([line], { serviceCharge: 1000 });
		expect(s.beforeDiscount).toBe(200000);
		expect(s.vendorDiscount).toBe(5000);
		expect(s.distributorDiscount).toBe(3000);
		expect(s.afterDiscount).toBe(192000);
		expect(s.vendorDistributorDiscount).toBe(8000);
		expect(s.serviceCharge).toBe(1000);
		expect(s.vat).toBe(19200); // (200000-8000)*10%
		expect(s.taxRatePercent).toBe(10);
		expect(s.totalAfterTax).toBe(212200); // afterDisc + vat + service
		expect(s.priceCompensation).toBe(2000);
		expect(s.total).toBe(210200);
		expect(s.payable).toBe(210200);
		expect(s.amountDue).toBe(210200);
	});

	it('buildCartSummary amountDue subtracts received', () => {
		const line = recalcCartLine(baseLine({ Qty: 1, UoMPrice: 100000, Price: 100000 }));
		const s = buildCartSummary([line], { received: 40000 });
		expect(s.total).toBe(100000);
		expect(s.received).toBe(40000);
		expect(s.amountDue).toBe(60000);
	});
});
