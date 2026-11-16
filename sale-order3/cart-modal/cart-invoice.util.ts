import { DemoOrderMeta } from '../demo-data';

/** Drop customer-bound tax/invoice fields; keep notes and order flags. */
export function clearInvoiceMeta(meta: DemoOrderMeta): DemoOrderMeta {
	return {
		...meta,
		IsInvoiceRequired: false,
		IDTaxInfo: null,
		TaxCode: null,
		InvoiceLabel: '',
	};
}

/** Map POS invoice modal dismiss payload → cart orderMeta invoice fields. */
export function invoiceMetaFromSelection(
	meta: DemoOrderMeta,
	data: { IDTaxInfo?: any; TaxCode?: any; Name?: string; CompanyName?: string; TaxAddresses?: any[] } | null | undefined
): DemoOrderMeta {
	const idRaw = data?.IDTaxInfo;
	if (idRaw === null || idRaw === '' || idRaw === undefined) {
		return {
			...meta,
			IsInvoiceRequired: false,
			IDTaxInfo: null,
			TaxCode: null,
			InvoiceLabel: '',
		};
	}
	const id = Number(idRaw);
	if (id === -1) {
		return {
			...meta,
			IsInvoiceRequired: true,
			IDTaxInfo: -1,
			TaxCode: null,
			InvoiceLabel: 'Walk-in customer',
		};
	}
	const tax = Array.isArray(data?.TaxAddresses) ? data.TaxAddresses[0] : null;
	return {
		...meta,
		IsInvoiceRequired: true,
		IDTaxInfo: id,
		TaxCode: data?.TaxCode != null ? String(data.TaxCode) : null,
		InvoiceLabel: tax?.CompanyName || tax?.Name || data?.Name || data?.CompanyName || '',
	};
}
