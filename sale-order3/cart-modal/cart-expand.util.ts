/** Toggle one cart line in the advanced-expanded id set. */
export function toggleExpandedLineId(expandedIds: number[], itemId: number): number[] {
	const id = Number(itemId);
	if (!isFinite(id)) return [...expandedIds];
	return expandedIds.includes(id) ? expandedIds.filter((x) => x !== id) : [...expandedIds, id];
}

/** True when every cart line id is expanded (empty cart → false). */
export function allCartLinesExpanded(expandedIds: number[], itemIds: number[]): boolean {
	const ids = (itemIds || []).map((x) => Number(x)).filter((x) => isFinite(x));
	if (!ids.length) return false;
	return ids.every((id) => expandedIds.includes(id));
}

/** Footer Advanced: expand all; Simple: collapse all. */
export function toggleAllCartLinesExpanded(expandedIds: number[], itemIds: number[]): number[] {
	const ids = (itemIds || []).map((x) => Number(x)).filter((x) => isFinite(x));
	if (!ids.length) return [];
	return allCartLinesExpanded(expandedIds, ids) ? [] : [...ids];
}

/** Drop expanded ids that are no longer in the cart. */
export function pruneExpandedLineIds(expandedIds: number[], itemIds: number[]): number[] {
	const keep = new Set((itemIds || []).map((x) => Number(x)).filter((x) => isFinite(x)));
	return (expandedIds || []).filter((id) => keep.has(id));
}
