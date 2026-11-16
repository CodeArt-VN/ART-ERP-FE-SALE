import { MOCK_CATALOG_L1, MOCK_CATALOG_PRODUCTS, MOCK_STOCK_SAMPLE, SUGGEST_L1_ID } from './product-category-modal.mock';
import {
	activeL1FromSectionTops,
	buildCatalogVirtualRows,
	filterCatalogProducts,
	firstRowIdForL1,
	formatCatalogPrice,
	formatStockSplits,
} from './product-category-modal.util';

describe('product-category-modal.util', () => {
	it('buildCatalogVirtualRows emits suggest sections then L1/L2 product rows', () => {
		const rows = buildCatalogVirtualRows(MOCK_CATALOG_L1, MOCK_CATALOG_PRODUCTS, { endSpacerPx: 200 });
		expect(rows[0].Kind).toBe('section');
		expect(rows[0].L1Id).toBe(SUGGEST_L1_ID);
		expect(rows.some((r) => r.Kind === 'products' && r.L1Id === SUGGEST_L1_ID)).toBe(true);
		expect(rows.some((r) => r.L1Id === 'dairy' && r.Kind === 'section' && r.Title === 'Sữa & yogurt')).toBe(true);
		expect(rows.some((r) => r.L1Id === 'noodle' && r.L2Id === 'noodle-hao')).toBe(true);
		expect(firstRowIdForL1(rows, 'drink')).toContain('drink');
		expect(rows[rows.length - 1].Kind).toBe('end-spacer');
		expect(rows[rows.length - 1].SpacerPx).toBe(200);
		expect(firstRowIdForL1(rows, rows[rows.length - 1].L1Id)).not.toBe('end-spacer');
	});

	it('activeL1FromSectionTops follows topmost section past sticky offset', () => {
		expect(activeL1FromSectionTops(
			[
				{ L1Id: 'suggest', top: 0 },
				{ L1Id: 'noodle', top: 200 },
				{ L1Id: 'drink', top: 400 },
			],
			0,
			72
		)).toBe('suggest');
		expect(activeL1FromSectionTops(
			[
				{ L1Id: 'suggest', top: -50 },
				{ L1Id: 'noodle', top: 40 },
				{ L1Id: 'drink', top: 240 },
			],
			0,
			72
		)).toBe('noodle');
		expect(activeL1FromSectionTops(
			[
				{ L1Id: 'suggest', top: -300 },
				{ L1Id: 'noodle', top: -100 },
				{ L1Id: 'drink', top: 50 },
			],
			0,
			72
		)).toBe('drink');
		// Unordered window: pick highest top still under sticky
		expect(activeL1FromSectionTops(
			[
				{ L1Id: 'drink', top: 90 },
				{ L1Id: 'noodle', top: 20 },
				{ L1Id: 'suggest', top: -40 },
			],
			0,
			72
		)).toBe('noodle');
		expect(activeL1FromSectionTops([], 0)).toBeNull();
	});

	it('formatCatalogPrice', () => {
		expect(formatCatalogPrice(185000)).toContain('185');
		expect(formatCatalogPrice(null as any)).toBe('');
	});

	it('formatStockSplits matches sample warehouses', () => {
		expect(formatStockSplits(MOCK_STOCK_SAMPLE[0])).toBe('39 Thùng 6 Hộp');
		expect(formatStockSplits(MOCK_STOCK_SAMPLE[1])).toBe('3 Thùng 17 Hộp');
		expect(MOCK_CATALOG_PRODUCTS[0].Stock?.[0].WarehouseName).toBe('Kho hàng Long Thành');
	});

	it('filterCatalogProducts narrows by name', () => {
		const hit = filterCatalogProducts(MOCK_CATALOG_PRODUCTS, 'hảo hảo');
		expect(hit.length).toBeGreaterThan(0);
		expect(hit.every((p) => /hảo hảo/i.test(p.Name))).toBe(true);
		expect(filterCatalogProducts(MOCK_CATALOG_PRODUCTS, '').length).toBe(MOCK_CATALOG_PRODUCTS.length);
		expect(filterCatalogProducts(MOCK_CATALOG_PRODUCTS, 'zzzz-none').length).toBe(0);
	});
});
