export function hasInStock(item: any): boolean {
	return (item?.Warehouses || []).some((warehouse) => !isOutOfStock(warehouse?.CloseQuantity) && warehouse?.UoMs?.length);
}

export function showsSearchSpinner(event: any): boolean {
	return event == null || event == 'search';
}

export function withDefaultInStock(query: any) {
	if (query && Object.prototype.hasOwnProperty.call(query, 'inStockOnly')) return query;
	return { ...(query || {}), inStockOnly: true };
}

export function balanceRequestQuery(query: any) {
	const request = { ...(query || {}) };
	const flag = request.inStockOnly;
	delete request.inStockOnly;
	delete request.InStock;
	if (flag === true || flag === 'true') request.InStock = true;
	return request;
}

export function isOutOfStock(closeQuantity: number): boolean {
	return !(Number(closeQuantity) > 0);
}

export function warehouseCatalogId(warehouse: any): any {
	return warehouse?.Id ?? null;
}

export function applyWarehouseNames(items: any[] | null | undefined, warehouses?: any[] | null): any[] {
	const names = new Map<any, string>();
	(warehouses || []).forEach((warehouse) => {
		const id = warehouseCatalogId(warehouse);
		const name = warehouse?.Name;
		if (id != null && name) names.set(id, name);
	});

	return (items || []).filter((item) => !!item).map((item) => ({
		...item,
		Warehouses: (item.Warehouses || []).map((row) => ({
			...row,
			BranchName: row.BranchName || names.get(row.IDBranch) || '',
		})),
	}));
}
