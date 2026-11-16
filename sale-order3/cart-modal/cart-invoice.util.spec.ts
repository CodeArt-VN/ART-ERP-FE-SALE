import { emptyOrderMeta } from '../demo-data';
import { clearInvoiceMeta, invoiceMetaFromSelection } from './cart-invoice.util';

describe('clearInvoiceMeta', () => {
	it('clears tax/invoice fields and keeps notes/flags', () => {
		const base = {
			...emptyOrderMeta(),
			Name: 'Nội dung',
			Remark: 'Ghi chú',
			IsSampleOrder: true,
			IsUrgentOrders: true,
			IsWholeSale: true,
			IsShipBySaleMan: true,
			IsInvoiceRequired: true,
			IDTaxInfo: 9,
			TaxCode: '01',
			InvoiceLabel: 'Old Co',
		};
		const next = clearInvoiceMeta(base);
		expect(next.IsInvoiceRequired).toBe(false);
		expect(next.IDTaxInfo).toBeNull();
		expect(next.TaxCode).toBeNull();
		expect(next.InvoiceLabel).toBe('');
		expect(next.Name).toBe('Nội dung');
		expect(next.Remark).toBe('Ghi chú');
		expect(next.IsSampleOrder).toBe(true);
		expect(next.IsUrgentOrders).toBe(true);
		expect(next.IsWholeSale).toBe(true);
		expect(next.IsShipBySaleMan).toBe(true);
	});
});

describe('invoiceMetaFromSelection', () => {
	const base = {
		...emptyOrderMeta(),
		IsInvoiceRequired: true,
		IDTaxInfo: 9,
		TaxCode: '01',
		InvoiceLabel: 'Old Co',
	};

	it('treats Default tax info (null) as clear', () => {
		const next = invoiceMetaFromSelection(base, { IDTaxInfo: null, TaxCode: null });
		expect(next.IsInvoiceRequired).toBe(false);
		expect(next.IDTaxInfo).toBeNull();
		expect(next.TaxCode).toBeNull();
		expect(next.InvoiceLabel).toBe('');
	});

	it('sets walk-in label for IDTaxInfo -1', () => {
		const next = invoiceMetaFromSelection(base, { IDTaxInfo: -1, TaxCode: null });
		expect(next.IsInvoiceRequired).toBe(true);
		expect(next.IDTaxInfo).toBe(-1);
		expect(next.InvoiceLabel).toBe('Walk-in customer');
	});

	it('uses tax address company name for real tax info', () => {
		const next = invoiceMetaFromSelection(base, {
			IDTaxInfo: 12,
			TaxCode: '0312',
			TaxAddresses: [{ CompanyName: 'ART Co', Name: 'ART' }],
		});
		expect(next.IsInvoiceRequired).toBe(true);
		expect(next.IDTaxInfo).toBe(12);
		expect(next.TaxCode).toBe('0312');
		expect(next.InvoiceLabel).toBe('ART Co');
	});
});
