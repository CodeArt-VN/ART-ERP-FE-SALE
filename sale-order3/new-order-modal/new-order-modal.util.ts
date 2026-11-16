/** Map + sort helpers for SALE/Order/CustomerPicker rows. */

export interface CustomerPickerApiRow {
	Id?: number;
	Code?: string;
	Name?: string;
	Phone?: string;
	IsPersonal?: boolean;
	IDAddress?: number | null;
	AddressLine1?: string;
	Lat?: number | null;
	Long?: number | null;
	Monday?: boolean;
	Tuesday?: boolean;
	Wednesday?: boolean;
	Thursday?: boolean;
	Friday?: boolean;
	Saturday?: boolean;
	Sunday?: boolean;
	Sort?: number;
	DistanceM?: number | null;
	DayRank?: number;
}

export type McpDayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface CustomerPickRow {
	Id: number;
	/** Stable virtual-scroll / trackBy key (Id + IDAddress). */
	TrackId: string;
	Name: string;
	Code?: string;
	Address: string;
	Phone?: string;
	/** true = cá nhân; false = tổ chức (same as CRM outlet). */
	IsPersonal: boolean;
	IDAddress?: number;
	Lat?: number | null;
	Long?: number | null;
	DistanceM?: number | null;
	DayRank: number;
	Sort: number;
	McpDays: McpDayKey[];
	Monday: boolean;
	Tuesday: boolean;
	Wednesday: boolean;
	Thursday: boolean;
	Friday: boolean;
	Saturday: boolean;
	Sunday: boolean;
}

const DAY_ORDER: { key: McpDayKey; flag: keyof CustomerPickerApiRow; dow: number }[] = [
	{ key: 'Sun', flag: 'Sunday', dow: 0 },
	{ key: 'Mon', flag: 'Monday', dow: 1 },
	{ key: 'Tue', flag: 'Tuesday', dow: 2 },
	{ key: 'Wed', flag: 'Wednesday', dow: 3 },
	{ key: 'Thu', flag: 'Thursday', dow: 4 },
	{ key: 'Fri', flag: 'Friday', dow: 5 },
	{ key: 'Sat', flag: 'Saturday', dow: 6 },
];

export function mcpDaysOf(row: CustomerPickerApiRow | CustomerPickRow): McpDayKey[] {
	const days: McpDayKey[] = [];
	if (row.Monday) days.push('Mon');
	if (row.Tuesday) days.push('Tue');
	if (row.Wednesday) days.push('Wed');
	if (row.Thursday) days.push('Thu');
	if (row.Friday) days.push('Fri');
	if (row.Saturday) days.push('Sat');
	if (row.Sunday) days.push('Sun');
	return days;
}

/** 0 = today … 6 = 6 days ahead; 7 = no MCP day. */
export function mcpDayRank(todayDow: number, row: CustomerPickerApiRow | CustomerPickRow): number {
	for (let offset = 0; offset < 7; offset++) {
		const dow = (todayDow + offset) % 7;
		const meta = DAY_ORDER.find((d) => d.dow === dow);
		if (meta && (row as any)[meta.flag]) return offset;
	}
	return 7;
}

export function distanceMeters(originLat: number | null | undefined, originLng: number | null | undefined, lat: number | null | undefined, lng: number | null | undefined): number | null {
	if (originLat == null || originLng == null || lat == null || lng == null) return null;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const R = 6371000;
	const dLat = toRad(lat - originLat);
	const dLng = toRad(lng - originLng);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(originLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function mapCustomerPickerRow(row: CustomerPickerApiRow): CustomerPickRow | null {
	const id = Number(row?.Id);
	if (!id) return null;
	const idAddress = row.IDAddress != null ? Number(row.IDAddress) : undefined;
	const mapped: CustomerPickRow = {
		Id: id,
		TrackId: '',
		Code: row.Code,
		Name: row.Name || row.Code || `#${id}`,
		Address: row.AddressLine1 || '',
		Phone: row.Phone || undefined,
		IsPersonal: !!row.IsPersonal,
		IDAddress: idAddress,
		Lat: row.Lat ?? null,
		Long: row.Long ?? null,
		DistanceM: row.DistanceM ?? null,
		DayRank: row.DayRank ?? 7,
		Sort: row.Sort ?? 0,
		McpDays: mcpDaysOf(row),
		Monday: !!row.Monday,
		Tuesday: !!row.Tuesday,
		Wednesday: !!row.Wednesday,
		Thursday: !!row.Thursday,
		Friday: !!row.Friday,
		Saturday: !!row.Saturday,
		Sunday: !!row.Sunday,
	};
	mapped.TrackId = customerPickTrackId(mapped);
	return mapped;
}

/** Same icons as CRM outlet list: person/success vs business/warning. */
export function customerPickTypeIcon(row: { IsPersonal?: boolean } | null | undefined): { name: string; color: string } {
	return row?.IsPersonal ? { name: 'person-outline', color: 'success' } : { name: 'business-outline', color: 'warning' };
}

export function mapCustomerPickerRows(rows: CustomerPickerApiRow[] | null | undefined): CustomerPickRow[] {
	const list = Array.isArray(rows) ? rows : [];
	const out: CustomerPickRow[] = [];
	for (const row of list) {
		const mapped = mapCustomerPickerRow(row);
		if (mapped) out.push(mapped);
	}
	return out;
}

/** Re-sort with fresh GPS (API may already sort; FE re-applies after cache/reload). */
export function sortCustomerPickerRows(rows: CustomerPickRow[], originLat: number | null, originLng: number | null, today = new Date()): CustomerPickRow[] {
	const todayDow = today.getDay();
	const enriched = (rows || []).map((r) => {
		const dayRank = mcpDayRank(todayDow, r);
		const dist = distanceMeters(originLat, originLng, r.Lat, r.Long);
		return { ...r, DayRank: dayRank, DistanceM: dist };
	});
	return enriched.sort((a, b) => {
		const aHas = a.DistanceM != null ? 0 : 1;
		const bHas = b.DistanceM != null ? 0 : 1;
		if (aHas !== bHas) return aHas - bHas;
		if (a.DistanceM != null && b.DistanceM != null && a.DistanceM !== b.DistanceM) return a.DistanceM - b.DistanceM;
		if (a.DayRank !== b.DayRank) return a.DayRank - b.DayRank;
		if (a.Sort !== b.Sort) return a.Sort - b.Sort;
		return (a.Name || '').localeCompare(b.Name || '', undefined, { sensitivity: 'base' });
	});
}

export function formatDistanceM(meters: number | null | undefined): string {
	if (meters == null || !isFinite(meters)) return '';
	if (meters < 1000) return `${Math.round(meters)}m`;
	return `${(meters / 1000).toFixed(1)}km`;
}

export function customerPickTrackId(row: CustomerPickRow): string {
	return `${row.Id}-${row.IDAddress ?? 0}`;
}

/** Stable key for selected vs list row (TrackId or Id+IDAddress). */
export function customerPickKey(row: { Id?: number; IDAddress?: number; TrackId?: string } | null | undefined): string {
	if (!row) return '';
	if (row.TrackId) return row.TrackId;
	const id = Number(row.Id) || 0;
	if (!id) return '';
	return `${id}-${row.IDAddress ?? 0}`;
}

export function isSameCustomerPick(
	a: { Id?: number; IDAddress?: number; TrackId?: string } | null | undefined,
	b: { Id?: number; IDAddress?: number; TrackId?: string } | null | undefined
): boolean {
	const ka = customerPickKey(a);
	const kb = customerPickKey(b);
	return !!ka && ka === kb;
}

/** Move selected customer to index 0 when present in the list. */
export function pinSelectedCustomer(
	rows: CustomerPickRow[],
	selected: { Id?: number; IDAddress?: number; TrackId?: string } | null | undefined
): CustomerPickRow[] {
	const list = rows || [];
	const key = customerPickKey(selected);
	if (!key || !list.length) return list;
	const idx = list.findIndex((r) => customerPickKey(r) === key);
	if (idx <= 0) return list;
	const next = list.slice();
	const [hit] = next.splice(idx, 1);
	next.unshift(hit);
	return next;
}

export function matchCustomerLocal(o: CustomerPickRow, q: string): boolean {
	if (!q) return true;
	const hay = `${o.Name || ''} ${o.Code || ''} ${o.Address || ''} ${o.Phone || ''}`.toLowerCase();
	return hay.includes(q);
}
