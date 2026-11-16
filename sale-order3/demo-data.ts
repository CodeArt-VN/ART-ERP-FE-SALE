/**
 * Demo outlet / catalog data for sale-order3 Add flow (list uses live SALE_Order).
 */

export interface DemoARInvoice {
	InvoiceNo?: string;
	InvoiceForm?: string;
	InvoiceSerial?: string;
	InvoiceGUID?: string;
}

export interface DemoOutlet {
	Id: number;
	Name: string;
	Address: string;
	Phone?: string;
	/** From CustomerPicker — used to re-highlight when reopening the modal. */
	TrackId?: string;
	IDAddress?: number;
	DistanceM?: number;
	/** true = personal; false/undefined = organization (CustomerPicker). */
	IsPersonal?: boolean;
	/** MCP visit day badges from CustomerPicker. */
	McpDays?: string[];
	McpSeq?: number;
	OrderedToday?: boolean;
	Hint?: 'nearby' | 'mcp' | 'draft' | 'recent' | 'frequent';
}

export interface DemoCategory {
	Id: number;
	Code: string;
	Name: string;
}

export interface DemoProduct {
	Id: number;
	Name: string;
	Price: number;
	UoM: string;
	CategoryId: number;
	Favorite?: boolean;
	Promo?: boolean;
	FrequentForOutlet?: boolean;
	ImageColor: string;
}

export interface DemoCartUoM {
	Id: number;
	Name: string;
}

/** Cart line — compact + full-controls fields (sale-order-mobile-detail parity). */
export interface DemoCartLine {
	ItemId: number;
	Name: string;
	Price: number;
	UoM: string;
	Qty: number;
	IDUoM?: number;
	UoMs?: DemoCartUoM[];
	UoMPrice?: number;
	OriginalDiscount1?: number;
	OriginalDiscount2?: number;
	IsPromotionItem?: boolean;
	OriginalDiscountFromSalesman?: number;
	SalesmanPrice?: number;
	OriginalTotalAfterDiscount?: number;
	/** Percent tax rate on amount after item discount (sale-order parity). */
	TaxRate?: number;
	OriginalTax?: number;
	OriginalTotalAfterTax?: number;
	OriginalTotalAfterDiscountFromSalesman?: number;
}

/** Order header fields on cart (sale-order-mobile-detail parity). */
export interface DemoOrderMeta {
	Name: string;
	Remark: string;
	IsSampleOrder: boolean;
	IsUrgentOrders: boolean;
	IsWholeSale: boolean;
	IsShipBySaleMan: boolean;
	IsInvoiceRequired: boolean;
	IDTaxInfo: number | null;
	TaxCode: string | null;
	InvoiceLabel: string;
	/** Order-level service fee; summary shows only when > 0. */
	ServiceCharge: number;
	/** Đã trả — summary shows only when > 0. */
	Received: number;
}

export function emptyOrderMeta(): DemoOrderMeta {
	return {
		Name: '',
		Remark: '',
		IsSampleOrder: false,
		IsUrgentOrders: false,
		IsWholeSale: false,
		IsShipBySaleMan: false,
		IsInvoiceRequired: false,
		IDTaxInfo: null,
		TaxCode: null,
		InvoiceLabel: '',
		ServiceCharge: 0,
		Received: 0,
	};
}

export function normalizeOrderMeta(raw: any): DemoOrderMeta {
	const base = emptyOrderMeta();
	if (!raw || typeof raw !== 'object') return base;
	return {
		Name: typeof raw.Name === 'string' ? raw.Name : base.Name,
		Remark: typeof raw.Remark === 'string' ? raw.Remark : base.Remark,
		IsSampleOrder: !!raw.IsSampleOrder,
		IsUrgentOrders: !!raw.IsUrgentOrders,
		IsWholeSale: !!raw.IsWholeSale,
		IsShipBySaleMan: !!raw.IsShipBySaleMan,
		IsInvoiceRequired: !!raw.IsInvoiceRequired,
		// Keep -1 (walk-in); null/undefined → clear.
		IDTaxInfo:
			raw.IDTaxInfo === null || raw.IDTaxInfo === undefined || raw.IDTaxInfo === ''
				? null
				: isFinite(Number(raw.IDTaxInfo))
					? Number(raw.IDTaxInfo)
					: null,
		TaxCode: typeof raw.TaxCode === 'string' ? raw.TaxCode : raw.TaxCode != null ? String(raw.TaxCode) : null,
		InvoiceLabel: typeof raw.InvoiceLabel === 'string' ? raw.InvoiceLabel : base.InvoiceLabel,
		ServiceCharge:
			raw.ServiceCharge == null || raw.ServiceCharge === ''
				? 0
				: Math.max(0, Number(raw.ServiceCharge) || 0),
		Received:
			raw.Received == null || raw.Received === '' ? 0 : Math.max(0, Number(raw.Received) || 0),
	};
}

export const DEMO_OUTLETS: DemoOutlet[] = [
	{
		Id: 501,
		Name: 'Tạp hóa Minh Anh',
		Address: '12 Nguyễn Trãi, Q.5',
		Phone: '0901 111 222',
		DistanceM: 18,
		McpSeq: 2,
		OrderedToday: true,
		Hint: 'mcp',
	},
	{
		Id: 502,
		Name: 'Tạp hóa Hồng',
		Address: '45 Cách Mạng Tháng 8',
		Phone: '0902 333 444',
		DistanceM: 120,
		McpSeq: 1,
		Hint: 'mcp',
	},
	{
		Id: 503,
		Name: 'Cửa hàng tiện lợi 24h',
		Address: '88 Lê Hồng Phong',
		DistanceM: 350,
		McpSeq: 3,
		Hint: 'mcp',
	},
	{
		Id: 504,
		Name: 'Tạp hóa Ba Đạt',
		Address: '3 Trần Hưng Đạo',
		DistanceM: 520,
		Hint: 'draft',
	},
	{
		Id: 505,
		Name: 'Tạp hóa Lan Chi',
		Address: '19 Nguyễn Văn Cừ',
		DistanceM: 890,
		Hint: 'recent',
	},
	{
		Id: 506,
		Name: 'Siêu thị mini Phát',
		Address: '101 Hai Bà Trưng',
		DistanceM: 1200,
		Hint: 'frequent',
	},
];

export const DEMO_CATEGORIES: DemoCategory[] = [
	{ Id: 0, Code: 'fav', Name: 'Yêu thích' },
	{ Id: -1, Code: 'freq', Name: 'Khách hay mua' },
	{ Id: -2, Code: 'promo', Name: 'Khuyến mãi' },
	{ Id: 1, Code: 'noodle', Name: 'Mì & phở' },
	{ Id: 2, Code: 'drink', Name: 'Nước giải khát' },
	{ Id: 3, Code: 'snack', Name: 'Bánh kẹo' },
	{ Id: 4, Code: 'dairy', Name: 'Sữa & yogurt' },
	{ Id: 5, Code: 'home', Name: 'Gia dụng' },
];

export const DEMO_PRODUCTS: DemoProduct[] = [
	{ Id: 1, Name: 'Mì Hảo Hảo tôm chua cay', Price: 4500, UoM: 'Thùng', CategoryId: 1, Favorite: true, FrequentForOutlet: true, ImageColor: '#f4a261' },
	{ Id: 2, Name: 'Mì Omachi sốt bò hầm', Price: 5200, UoM: 'Thùng', CategoryId: 1, Favorite: true, ImageColor: '#e76f51' },
	{ Id: 3, Name: 'Phở Đệ Nhất bò', Price: 6800, UoM: 'Thùng', CategoryId: 1, Promo: true, ImageColor: '#e9c46a' },
	{ Id: 4, Name: 'Coca-Cola 330ml', Price: 185000, UoM: 'Thùng', CategoryId: 2, FrequentForOutlet: true, ImageColor: '#e63946' },
	{ Id: 5, Name: 'Pepsi 330ml', Price: 175000, UoM: 'Thùng', CategoryId: 2, ImageColor: '#457b9d' },
	{ Id: 6, Name: 'Sting dâu', Price: 162000, UoM: 'Thùng', CategoryId: 2, Promo: true, Favorite: true, ImageColor: '#d62828' },
	{ Id: 7, Name: 'Bánh Choco-pie', Price: 98000, UoM: 'Thùng', CategoryId: 3, FrequentForOutlet: true, ImageColor: '#bc6c25' },
	{ Id: 8, Name: 'Kẹo Mentos', Price: 72000, UoM: 'Hộp', CategoryId: 3, ImageColor: '#2a9d8f' },
	{ Id: 9, Name: 'Sữa TH true MILK 180ml', Price: 210000, UoM: 'Thùng', CategoryId: 4, Favorite: true, ImageColor: '#90be6d' },
	{ Id: 10, Name: 'Yogurt Vinamilk', Price: 89000, UoM: 'Lốc', CategoryId: 4, ImageColor: '#f9c74f' },
	{ Id: 11, Name: 'Nước rửa chén Sunlight', Price: 45000, UoM: 'Chai', CategoryId: 5, ImageColor: '#577590' },
	{ Id: 12, Name: 'Khăn giấy Pulppy', Price: 38000, UoM: 'Bịch', CategoryId: 5, Promo: true, ImageColor: '#43aa8b' },
];

export function formatVnd(amount: number): string {
	const n = Number(amount);
	return (isFinite(n) ? n : 0).toLocaleString('vi-VN') + ' đ';
}

export function invoiceDisplay(inv: DemoARInvoice): string {
	if (!inv) return '';
	return `${inv.InvoiceForm || ''}${inv.InvoiceSerial || ''}-${inv.InvoiceNo || ''}`;
}

export function invoiceLookupUrl(inv: DemoARInvoice): string {
	if (!inv?.InvoiceGUID) return '';
	return `https://tchd.ehoadon.vn/Lookup?InvoiceGUID=${inv.InvoiceGUID}`;
}

export function hintLabel(hint?: DemoOutlet['Hint']): string {
	switch (hint) {
		case 'nearby':
			return 'Gần bạn';
		case 'mcp':
			return 'MCP hôm nay';
		case 'draft':
			return 'Có đơn nháp';
		case 'recent':
			return 'Vừa ghé';
		case 'frequent':
			return 'Hay bán';
		default:
			return '';
	}
}
