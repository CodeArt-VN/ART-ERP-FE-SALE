import { DemoCartLine, DemoProduct } from './demo-data';

export function cartQty(lines: DemoCartLine[], itemId: number): number {
	const line = lines.find((l) => l.ItemId === itemId);
	return line ? line.Qty : 0;
}

export function cartLineCount(lines: DemoCartLine[]): number {
	return lines.reduce((sum, l) => sum + l.Qty, 0);
}

export function cartLineAmount(line: DemoCartLine): number {
	if (line?.OriginalTotalAfterDiscountFromSalesman != null && isFinite(line.OriginalTotalAfterDiscountFromSalesman)) {
		return line.OriginalTotalAfterDiscountFromSalesman;
	}
	if (line?.OriginalTotalAfterDiscount != null && isFinite(line.OriginalTotalAfterDiscount)) {
		return line.OriginalTotalAfterDiscount;
	}
	const price = line.UoMPrice != null ? line.UoMPrice : line.Price;
	return (price || 0) * (line.Qty || 0);
}

export function cartTotal(lines: DemoCartLine[]): number {
	return (lines || []).reduce((sum, l) => sum + cartLineAmount(l), 0);
}

/** Gross before line discounts (UoMPrice × Qty). */
export function cartMerchandiseTotal(lines: DemoCartLine[]): number {
	return buildCartSummary(lines).beforeDiscount;
}

export function cartDiscountTotal(lines: DemoCartLine[]): number {
	const s = buildCartSummary(lines);
	return Math.max(0, s.beforeDiscount - s.payable);
}

export type CartSummary = {
	beforeDiscount: number;
	vendorDiscount: number;
	distributorDiscount: number;
	afterDiscount: number;
	/** @deprecated use vendorDiscount + distributorDiscount */
	vendorDistributorDiscount: number;
	serviceCharge: number;
	vat: number;
	/** Effective VAT % for label “VAT (x%)”. */
	taxRatePercent: number;
	totalAfterTax: number;
	priceCompensation: number;
	/** Tổng tiền after tax − bù giá. */
	total: number;
	received: number;
	amountDue: number;
	/** Alias of total (footer Total). */
	payable: number;
};

/** Order money summary for cart footer expand. */
export function buildCartSummary(
	lines: DemoCartLine[],
	opts?: { serviceCharge?: number; received?: number }
): CartSummary {
	let beforeDiscount = 0;
	let vendorDiscount = 0;
	let distributorDiscount = 0;
	let vat = 0;
	let afterTax = 0;
	let priceCompensation = 0;

	for (const line of lines || []) {
		if (line?.IsPromotionItem) continue;
		const qty = Number(line.Qty) || 0;
		const price = lineListUnitPrice(line);
		const lineBefore = price * qty;
		const d1 = Number(line.OriginalDiscount1) || 0;
		const d2 = Number(line.OriginalDiscount2) || 0;
		const disc = d1 + d2;
		const lineAfterDisc = Math.max(0, lineBefore - disc);
		const rate = Number(line.TaxRate) || 0;
		const lineTax =
			line.OriginalTax != null && isFinite(Number(line.OriginalTax))
				? Number(line.OriginalTax)
				: lineAfterDisc * (rate / 100);
		const lineAfterTax =
			line.OriginalTotalAfterTax != null && isFinite(Number(line.OriginalTotalAfterTax))
				? Number(line.OriginalTotalAfterTax)
				: lineAfterDisc + lineTax;
		const bu = Number(line.OriginalDiscountFromSalesman) || 0;

		beforeDiscount += lineBefore;
		vendorDiscount += d1;
		distributorDiscount += d2;
		vat += lineTax;
		afterTax += lineAfterTax;
		priceCompensation += bu;
	}

	const afterDiscount = Math.max(0, beforeDiscount - vendorDiscount - distributorDiscount);
	const serviceCharge = Math.max(0, Number(opts?.serviceCharge) || 0);
	const totalAfterTax = afterTax + serviceCharge;
	const total = Math.max(0, totalAfterTax - priceCompensation);
	const received = Math.max(0, Number(opts?.received) || 0);
	const amountDue = Math.max(0, total - received);
	const taxRatePercent =
		afterDiscount > 0 && vat > 0 ? Math.round((vat / afterDiscount) * 1000) / 10 : 0;

	return {
		beforeDiscount,
		vendorDiscount,
		distributorDiscount,
		afterDiscount,
		vendorDistributorDiscount: vendorDiscount + distributorDiscount,
		serviceCharge,
		vat,
		taxRatePercent,
		totalAfterTax,
		priceCompensation,
		total,
		received,
		amountDue,
		payable: total,
	};
}

/** After vendor/distributor discount (mock has no tax → same as OriginalTotalAfterTax). */
export function lineListUnitPrice(line: DemoCartLine): number {
	return line.UoMPrice != null ? Number(line.UoMPrice) : Number(line.Price) || 0;
}

/** True when đơn giá sau bù (SalesmanPrice) differs from đơn giá bán. */
export function lineHasAdjustedUnitPrice(line: DemoCartLine | null | undefined): boolean {
	if (!line || line.IsPromotionItem) return false;
	const list = lineListUnitPrice(line);
	const after = Number(line.SalesmanPrice);
	if (!isFinite(after)) return false;
	return Math.round(after) !== Math.round(list);
}

export function lineAmountAfterItemDiscount(line: DemoCartLine): number {
	const qty = Number(line.Qty) || 0;
	const price = lineListUnitPrice(line);
	const d1 = Number(line.OriginalDiscount1) || 0;
	const d2 = Number(line.OriginalDiscount2) || 0;
	return Math.max(0, price * qty - d1 - d2);
}

/**
 * Recalc like sale-order-detail / sale-order-mobile-detail:
 * Sau thuế = Sau CK + VAT; Phải thu = Sau thuế − Bù giá; SalesmanPrice = Phải thu / Qty.
 */
export function recalcCartLine(line: DemoCartLine): DemoCartLine {
	const next = { ...line };
	const qty = Number(next.Qty) || 0;
	const price = next.UoMPrice != null ? Number(next.UoMPrice) : Number(next.Price) || 0;
	next.UoMPrice = price;
	next.Price = price;
	if (next.UoMs?.length && next.IDUoM != null) {
		const u = next.UoMs.find((x) => x.Id === Number(next.IDUoM));
		if (u) next.UoM = u.Name;
	}
	if (next.IsPromotionItem) {
		next.OriginalDiscount1 = 0;
		next.OriginalDiscount2 = 0;
		next.OriginalDiscountFromSalesman = 0;
		next.OriginalTotalAfterDiscount = 0;
		next.OriginalTax = 0;
		next.OriginalTotalAfterTax = 0;
		next.SalesmanPrice = 0;
		next.OriginalTotalAfterDiscountFromSalesman = 0;
		return next;
	}
	const afterDisc = lineAmountAfterItemDiscount(next);
	next.OriginalTotalAfterDiscount = afterDisc;
	const rate = Number(next.TaxRate) || 0;
	next.OriginalTax = afterDisc * (rate / 100);
	next.OriginalTotalAfterTax = afterDisc + next.OriginalTax;
	const salesmanDisc = Number(next.OriginalDiscountFromSalesman) || 0;
	const payable = Math.max(0, next.OriginalTotalAfterTax - salesmanDisc);
	next.OriginalTotalAfterDiscountFromSalesman = payable;
	next.SalesmanPrice = qty > 0 ? payable / qty : 0;
	return next;
}

function newLineFromProduct(product: DemoProduct, qty: number): DemoCartLine {
	const uomName = product.UoM || 'Thùng';
	const line: DemoCartLine = {
		ItemId: product.Id,
		Name: product.Name,
		Price: product.Price,
		UoM: uomName,
		Qty: qty,
		IDUoM: 1,
		UoMs: [
			{ Id: 1, Name: uomName },
			{ Id: 2, Name: uomName === 'Hộp' ? 'Thùng' : 'Hộp' },
		],
		UoMPrice: product.Price,
		OriginalDiscount1: 0,
		OriginalDiscount2: 0,
		IsPromotionItem: false,
		OriginalDiscountFromSalesman: 0,
		SalesmanPrice: product.Price,
	};
	return recalcCartLine(line);
}

export function addToCart(lines: DemoCartLine[], product: DemoProduct, delta = 1): DemoCartLine[] {
	const next = lines.map((l) => ({ ...l }));
	const idx = next.findIndex((l) => l.ItemId === product.Id);
	if (idx >= 0) {
		const qty = next[idx].Qty + delta;
		if (qty <= 0) {
			next.splice(idx, 1);
		} else {
			next[idx] = recalcCartLine({ ...next[idx], Qty: qty });
		}
		return next;
	}
	if (delta > 0) {
		next.push(newLineFromProduct(product, delta));
	}
	return next;
}

/** Mid-edit empty → null (skip); otherwise qty ≥ 0. Blur should force Number(raw)||0. */
export function parseQtyInput(raw: string | number | null | undefined): number | null {
	if (raw === '' || raw === null || raw === undefined) return null;
	const n = Number(raw);
	if (!isFinite(n)) return null;
	return Math.max(0, n);
}

export function setCartQty(lines: DemoCartLine[], itemId: number, qty: number): DemoCartLine[] {
	const next = lines.map((l) => ({ ...l }));
	const idx = next.findIndex((l) => l.ItemId === itemId);
	if (qty <= 0) {
		if (idx >= 0) next.splice(idx, 1);
		return next;
	}
	if (idx >= 0) {
		next[idx] = recalcCartLine({ ...next[idx], Qty: qty });
		return next;
	}
	return next;
}

export function patchCartLine(lines: DemoCartLine[], itemId: number, patch: Partial<DemoCartLine>): DemoCartLine[] {
	return (lines || []).map((l) => {
		if (l.ItemId !== itemId) return { ...l };
		const merged: DemoCartLine = { ...l, ...patch };
		const qty = Number(merged.Qty) || 0;
		const afterDisc = lineAmountAfterItemDiscount(merged);
		const rate = Number(merged.TaxRate) || 0;
		const afterTax = afterDisc + afterDisc * (rate / 100);

		// changedSalesmanPrice: Phải thu = SalesmanPrice × Qty; Bù giá = Sau thuế − Phải thu
		if ('SalesmanPrice' in patch && !('OriginalTotalAfterDiscountFromSalesman' in patch)) {
			const salesmanPrice = Number(patch.SalesmanPrice) || 0;
			const payable = salesmanPrice * qty;
			merged.OriginalTotalAfterDiscountFromSalesman = payable;
			merged.OriginalDiscountFromSalesman = afterTax - payable;
		}

		// changedOriginalTotalAfterDiscountFromSalesman: SalesmanPrice = Phải thu / Qty
		if ('OriginalTotalAfterDiscountFromSalesman' in patch && !('SalesmanPrice' in patch)) {
			const payable = Number(patch.OriginalTotalAfterDiscountFromSalesman) || 0;
			merged.OriginalDiscountFromSalesman = afterTax - payable;
			merged.SalesmanPrice = qty > 0 ? payable / qty : 0;
		}

		return recalcCartLine(merged);
	});
}

export function filterProducts(products: DemoProduct[], segmentId: number): DemoProduct[] {
	if (segmentId === 0) return products.filter((p) => p.Favorite);
	if (segmentId === -1) return products.filter((p) => p.FrequentForOutlet);
	if (segmentId === -2) return products.filter((p) => p.Promo);
	return products.filter((p) => p.CategoryId === segmentId);
}
