/** Helpers for saleman mock list rows (real SALE_Order list shape). */

/** BE uses DefaultIfEmpty(0); JSON may also send a single number. */
export function shipmentIdsOf(order: { ShipmentIds?: number[] | number | null }): number[] {
	const raw = order?.ShipmentIds;
	const list = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
	return list.map((s) => Number(s)).filter((s) => !!s && !Number.isNaN(s));
}

export function hasShipment(order: { ShipmentIds?: number[] | number | null }): boolean {
	return shipmentIdsOf(order).length > 0;
}

export function customerNameOf(order: {
	CustomerName?: string;
	_Customer?: { Name?: string } | null;
}): string {
	return order?._Customer?.Name || order?.CustomerName || '';
}

export function customerAddressOf(order: {
	AddressLine1?: string;
	_Customer?: { Address?: { AddressLine1?: string } | null } | null;
}): string {
	return order?._Customer?.Address?.AddressLine1 || order?.AddressLine1 || '';
}

export function customerPhoneOf(order: {
	WorkPhone?: string;
	_Customer?: { WorkPhone?: string } | null;
}): string {
	return order?._Customer?.WorkPhone || order?.WorkPhone || '';
}

/** Same money pick as sale-order list cell. */
export function orderTotalOf(order: {
	TotalAfterTax?: number | null;
	OriginalTotalAfterTax?: number | null;
}): number {
	const t = order?.TotalAfterTax;
	if (t != null && t !== 0) return Number(t);
	return Number(order?.OriginalTotalAfterTax || 0);
}

/** Map form child rights → toolbar canSubmit (same as sale-order / sale-order2). */
export function resolveSaleOrderCanSubmit(pageConfig: {
	canSubmitOrdersForApproval?: boolean;
	canSubmitSalesmanOrdersForApproval?: boolean;
	canSubmit?: boolean;
}): boolean {
	return !!(
		pageConfig?.canSubmit ||
		pageConfig?.canSubmitOrdersForApproval ||
		pageConfig?.canSubmitSalesmanOrdersForApproval
	);
}

export type So3PickerFrom = 'add' | 'category' | 'cart';

/** Keep draft lines when re-picking customer from catalog/cart; clear only on fresh Add. */
export function keepCartOnCustomerRepick(from: So3PickerFrom): boolean {
	return from !== 'add';
}
