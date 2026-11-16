import { CatalogL1, CatalogProduct, CatalogStockLine } from './product-category-modal.mock';

export type CatalogVirtualKind = 'section' | 'products' | 'end-spacer';

export interface CatalogVirtualRow {
	TrackId: string;
	Kind: CatalogVirtualKind;
	/** L1 id for left-rail sync. */
	L1Id: string;
	L2Id?: string;
	Title?: string;
	Products?: CatalogProduct[];
	/** Fixed height for Kind=end-spacer (px). */
	SpacerPx?: number;
}

/**
 * Chunk size for virtual rows. Keep small (≈1 visual row on 2-col phones) so
 * measured height stays close to defaultItemSize — large chunks under-measure
 * and the last cards cannot scroll fully into view.
 */
const PRODUCTS_PER_ROW = 2;

export const CATALOG_END_SPACER_ID = 'end-spacer';

export function productMapOf(products: CatalogProduct[]): Map<number, CatalogProduct> {
	const map = new Map<number, CatalogProduct>();
	for (const p of products || []) {
		if (p?.Id) map.set(p.Id, p);
	}
	return map;
}

function resolveProducts(ids: number[] | undefined, byId: Map<number, CatalogProduct>): CatalogProduct[] {
	const out: CatalogProduct[] = [];
	for (const id of ids || []) {
		const p = byId.get(id);
		if (p) out.push(p);
	}
	return out;
}

function pushProductRows(out: CatalogVirtualRow[], l1Id: string, l2Id: string | undefined, products: CatalogProduct[]) {
	for (let i = 0; i < products.length; i += PRODUCTS_PER_ROW) {
		const slice = products.slice(i, i + PRODUCTS_PER_ROW);
		const rowIndex = Math.floor(i / PRODUCTS_PER_ROW);
		out.push({
			TrackId: `p:${l1Id}:${l2Id || '_'}:${rowIndex}`,
			Kind: 'products',
			L1Id: l1Id,
			L2Id: l2Id,
			Products: slice,
		});
	}
}

export function matchCatalogProduct(p: CatalogProduct | null | undefined, q: string): boolean {
	if (!q) return true;
	if (!p) return false;
	const hay = `${p.Name || ''} ${p.Id || ''} ${p.UoM || ''}`.toLowerCase();
	return hay.includes(q);
}

/** Live filter — keep products whose name/id/uom contain keyword. */
export function filterCatalogProducts(products: CatalogProduct[], keyword: string): CatalogProduct[] {
	const q = (keyword || '').trim().toLowerCase();
	const list = products || [];
	if (!q) return list;
	return list.filter((p) => matchCatalogProduct(p, q));
}

/** Flatten L1/L2 tree into virtual rows (section headers + product grids). */
export function buildCatalogVirtualRows(
	l1List: CatalogL1[],
	products: CatalogProduct[],
	opts?: { endSpacerPx?: number }
): CatalogVirtualRow[] {
	const byId = productMapOf(products);
	const out: CatalogVirtualRow[] = [];

	for (const l1 of l1List || []) {
		if (!l1?.Id) continue;
		const children = l1.Children || [];
		if (children.length) {
			for (const l2 of children) {
				const list = resolveProducts(l2.ProductIds, byId);
				if (!list.length) continue;
				out.push({
					TrackId: `s:${l1.Id}:${l2.Id}`,
					Kind: 'section',
					L1Id: l1.Id,
					L2Id: l2.Id,
					Title: l2.Name,
				});
				pushProductRows(out, l1.Id, l2.Id, list);
			}
		} else {
			const list = resolveProducts(l1.ProductIds, byId);
			if (!list.length) continue;
			out.push({
				TrackId: `s:${l1.Id}:_`,
				Kind: 'section',
				L1Id: l1.Id,
				Title: l1.Name,
			});
			pushProductRows(out, l1.Id, undefined, list);
		}
	}

	const spacerPx = Math.max(0, Number(opts?.endSpacerPx) || 0);
	if (out.length && spacerPx > 0) {
		const lastL1 = out[out.length - 1]?.L1Id || '';
		out.push({
			TrackId: CATALOG_END_SPACER_ID,
			Kind: 'end-spacer',
			L1Id: lastL1,
			SpacerPx: spacerPx,
		});
	}
	return out;
}

/** First virtual row TrackId for an L1 (used by scrollToId). */
export function firstRowIdForL1(rows: CatalogVirtualRow[], l1Id: string): string | null {
	const hit = (rows || []).find((r) => r.L1Id === l1Id && r.Kind !== 'end-spacer');
	return hit?.TrackId || null;
}

/**
 * Pick active L1 from rendered row tops (relative to scroll viewport top = 0).
 * Uses the last row whose top is still at/above the sticky line — does not require
 * document order if several L1s are interleaved in the virtual window.
 */
export function activeL1FromSectionTops(
	tops: { L1Id: string; top: number }[],
	viewportTop: number,
	stickyPx = 72
): string | null {
	if (!tops?.length) return null;
	const threshold = viewportTop + stickyPx;
	let active: string | null = null;
	let bestTop = -Infinity;
	for (const t of tops) {
		if (!t.L1Id) continue;
		if (t.top <= threshold && t.top >= bestTop) {
			bestTop = t.top;
			active = t.L1Id;
		}
	}
	if (active) return active;
	// Everything still below the sticky line — pick the nearest upcoming row.
	let nearest = Infinity;
	for (const t of tops) {
		if (!t.L1Id) continue;
		if (t.top < nearest) {
			nearest = t.top;
			active = t.L1Id;
		}
	}
	return active;
}

export function formatCatalogPrice(amount: number): string {
	if (amount == null || !isFinite(amount)) return '';
	return amount.toLocaleString('vi-VN') + ' đ';
}

/** "39 Thùng 6 Hộp" */
export function formatStockSplits(line: CatalogStockLine | null | undefined): string {
	if (!line?.Splits?.length) return '';
	return line.Splits.map((s) => `${s.Quantity} ${s.UoMName}`).join(' ');
}
