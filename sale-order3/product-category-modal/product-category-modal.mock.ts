/** Mock catalog for sale-order3 product-category modal (layout only). */

export interface CatalogStockSplit {
	Quantity: number;
	UoMName: string;
}

export interface CatalogStockLine {
	WarehouseName: string;
	Splits: CatalogStockSplit[];
}

export interface CatalogProduct {
	Id: number;
	Name: string;
	Price: number;
	UoM: string;
	ImageColor: string;
	Favorite?: boolean;
	/** On-hand by warehouse (mock). */
	Stock?: CatalogStockLine[];
}

export interface CatalogL2 {
	Id: string;
	Name: string;
	ProductIds: number[];
}

export interface CatalogL1 {
	Id: string;
	Name: string;
	Icon: string;
	Color: string;
	/** Empty/undefined → products listed flat under this L1. */
	Children?: CatalogL2[];
	/** Used when Children is empty — products directly under L1. */
	ProductIds?: number[];
}

export interface CatalogSuggestIds {
	/** Salesman favorites. */
	favoriteIds: number[];
	/** Customer purchase history. */
	frequentIds: number[];
	/** Admin seasonal push. */
	hotIds: number[];
}

export const SUGGEST_L1_ID = 'suggest';

export const MOCK_WAREHOUSES = ['Kho hàng Long Thành', 'Kho hàng Xuân Lộc'] as const;

/** Example stock lines (user sample). */
export const MOCK_STOCK_SAMPLE: CatalogStockLine[] = [
	{
		WarehouseName: 'Kho hàng Long Thành',
		Splits: [
			{ Quantity: 39, UoMName: 'Thùng' },
			{ Quantity: 6, UoMName: 'Hộp' },
		],
	},
	{
		WarehouseName: 'Kho hàng Xuân Lộc',
		Splits: [
			{ Quantity: 3, UoMName: 'Thùng' },
			{ Quantity: 17, UoMName: 'Hộp' },
		],
	},
];

/** Deterministic mock stock from product Id (first product uses the sample). */
export function mockStockForProduct(id: number, baseUom = 'Thùng', baseUom2 = 'Hộp'): CatalogStockLine[] {
	if (id === 1) return MOCK_STOCK_SAMPLE.map((s) => ({ ...s, Splits: s.Splits.map((x) => ({ ...x })) }));
	const a = ((id * 7) % 40) + 1;
	const b = ((id * 3) % 20) + 1;
	const c = ((id * 5) % 12) + 1;
	const d = ((id * 11) % 24) + 1;
	return [
		{
			WarehouseName: MOCK_WAREHOUSES[0],
			Splits: [
				{ Quantity: a, UoMName: baseUom },
				{ Quantity: b, UoMName: baseUom2 },
			],
		},
		{
			WarehouseName: MOCK_WAREHOUSES[1],
			Splits: [
				{ Quantity: c, UoMName: baseUom },
				{ Quantity: d, UoMName: baseUom2 },
			],
		},
	];
}

function withStock(p: CatalogProduct): CatalogProduct {
	return { ...p, Stock: mockStockForProduct(p.Id) };
}

export const MOCK_CATALOG_PRODUCTS: CatalogProduct[] = [
	{ Id: 1, Name: 'Mì Hảo Hảo tôm chua cay', Price: 4500, UoM: 'Thùng', ImageColor: '#f4a261', Favorite: true },
	{ Id: 2, Name: 'Mì Omachi sốt bò hầm', Price: 5200, UoM: 'Thùng', ImageColor: '#e76f51', Favorite: true },
	{ Id: 3, Name: 'Phở Đệ Nhất bò', Price: 6800, UoM: 'Thùng', ImageColor: '#e9c46a' },
	{ Id: 4, Name: 'Coca-Cola 330ml', Price: 185000, UoM: 'Thùng', ImageColor: '#e63946' },
	{ Id: 5, Name: 'Pepsi 330ml', Price: 175000, UoM: 'Thùng', ImageColor: '#457b9d' },
	{ Id: 6, Name: 'Sting dâu', Price: 162000, UoM: 'Thùng', ImageColor: '#d62828', Favorite: true },
	{ Id: 7, Name: 'Bánh Choco-pie', Price: 98000, UoM: 'Thùng', ImageColor: '#bc6c25' },
	{ Id: 8, Name: 'Kẹo Mentos', Price: 72000, UoM: 'Hộp', ImageColor: '#2a9d8f' },
	{ Id: 9, Name: 'Sữa TH true MILK 180ml', Price: 210000, UoM: 'Thùng', ImageColor: '#90be6d', Favorite: true },
	{ Id: 10, Name: 'Yogurt Vinamilk', Price: 89000, UoM: 'Lốc', ImageColor: '#f9c74f' },
	{ Id: 11, Name: 'Nước rửa chén Sunlight', Price: 45000, UoM: 'Chai', ImageColor: '#577590' },
	{ Id: 12, Name: 'Khăn giấy Pulppy', Price: 38000, UoM: 'Bịch', ImageColor: '#43aa8b' },
	{ Id: 13, Name: 'Nước suối Aquafina', Price: 95000, UoM: 'Thùng', ImageColor: '#48cae4' },
	{ Id: 14, Name: 'Trà xanh 0 độ', Price: 128000, UoM: 'Thùng', ImageColor: '#52b788' },
	{ Id: 15, Name: 'Bánh Oreo', Price: 65000, UoM: 'Hộp', ImageColor: '#1d3557' },
	{ Id: 16, Name: 'Mì Kokomi tôm', Price: 4200, UoM: 'Thùng', ImageColor: '#fb8500' },
	{ Id: 17, Name: 'Dầu ăn Simply', Price: 89000, UoM: 'Chai', ImageColor: '#ffb703' },
	{ Id: 18, Name: 'Nước mắm Nam Ngư', Price: 32000, UoM: 'Chai', ImageColor: '#9b2226' },
	{ Id: 19, Name: 'Bột ngọt Ajinomoto', Price: 28000, UoM: 'Gói', ImageColor: '#ffffff' },
	{ Id: 20, Name: 'Mì gói 3 miền', Price: 3900, UoM: 'Thùng', ImageColor: '#ee9b00' },
	{ Id: 21, Name: 'Snack Oishi', Price: 45000, UoM: 'Thùng', ImageColor: '#f72585' },
	{ Id: 22, Name: 'Kẹo Playmore', Price: 38000, UoM: 'Hộp', ImageColor: '#7209b7' },
	{ Id: 23, Name: 'Sữa đặc Ông Thọ', Price: 22000, UoM: 'Lon', ImageColor: '#ffd166' },
	{ Id: 24, Name: 'Bột giặt OMO', Price: 78000, UoM: 'Túi', ImageColor: '#118ab2' },
	{ Id: 25, Name: 'Gạo ST25', Price: 185000, UoM: 'Bao', ImageColor: '#f6bd60' },
	{ Id: 26, Name: 'Mì ý spaghetti', Price: 42000, UoM: 'Hộp', ImageColor: '#f28482' },
	{ Id: 27, Name: 'Tương ớt Cholimex', Price: 18000, UoM: 'Chai', ImageColor: '#e63946' },
	{ Id: 28, Name: 'Trứng gà ta', Price: 38000, UoM: 'Vỉ', ImageColor: '#fcbf49' },
	{ Id: 29, Name: 'Thịt heo ba chỉ', Price: 95000, UoM: 'Kg', ImageColor: '#ef476f' },
	{ Id: 30, Name: 'Cá basa fillet', Price: 78000, UoM: 'Kg', ImageColor: '#48cae4' },
	{ Id: 31, Name: 'Rau muống', Price: 12000, UoM: 'Bó', ImageColor: '#2d6a4f' },
	{ Id: 32, Name: 'Cà chua', Price: 22000, UoM: 'Kg', ImageColor: '#d00000' },
	{ Id: 33, Name: 'Táo Mỹ', Price: 65000, UoM: 'Kg', ImageColor: '#9b2226' },
	{ Id: 34, Name: 'Chuối sứ', Price: 18000, UoM: 'Nải', ImageColor: '#ffd166' },
	{ Id: 35, Name: 'Bia Tiger', Price: 295000, UoM: 'Thùng', ImageColor: '#003566' },
	{ Id: 36, Name: 'Rượu nếp', Price: 45000, UoM: 'Chai', ImageColor: '#6a4c93' },
	{ Id: 37, Name: 'Kem đánh răng P/S', Price: 32000, UoM: 'Tuýp', ImageColor: '#00b4d8' },
	{ Id: 38, Name: 'Dầu gội Clear', Price: 89000, UoM: 'Chai', ImageColor: '#0077b6' },
	{ Id: 39, Name: 'Tã bỉm Bobby', Price: 245000, UoM: 'Bịch', ImageColor: '#90e0ef' },
	{ Id: 40, Name: 'Sữa bột Pediasure', Price: 520000, UoM: 'Hộp', ImageColor: '#80ed99' },
	{ Id: 41, Name: 'Đồ chơi xếp hình', Price: 125000, UoM: 'Hộp', ImageColor: '#ff9f1c' },
	{ Id: 42, Name: 'Pin AA Panasonic', Price: 45000, UoM: 'Vỉ', ImageColor: '#3d348b' },
	{ Id: 43, Name: 'Bóng đèn LED', Price: 55000, UoM: 'Cái', ImageColor: '#f7f7ff' },
	{ Id: 44, Name: 'Thức ăn chó Pedigree', Price: 98000, UoM: 'Túi', ImageColor: '#bc6c25' },
].map(withStock);

/** Suggest buckets for the selected customer (mock). */
export const MOCK_CATALOG_SUGGEST: CatalogSuggestIds = {
	favoriteIds: [1, 2, 6, 9],
	frequentIds: [1, 4, 7, 13],
	hotIds: [3, 6, 12, 14, 21],
};

export const MOCK_CATALOG_L1: CatalogL1[] = [
	{
		Id: SUGGEST_L1_ID,
		Name: 'Gợi ý cho bạn',
		Icon: 'star',
		Color: 'warning',
		Children: [
			{ Id: 'fav', Name: 'Gợi ý cho bạn 1', ProductIds: MOCK_CATALOG_SUGGEST.favoriteIds },
			{ Id: 'freq', Name: 'Gợi ý cho bạn 2', ProductIds: MOCK_CATALOG_SUGGEST.frequentIds },
			{ Id: 'hot', Name: 'Gợi ý cho bạn 3', ProductIds: MOCK_CATALOG_SUGGEST.hotIds },
		],
	},
	{
		Id: 'noodle',
		Name: 'Mì & phở',
		Icon: 'restaurant-outline',
		Color: 'danger',
		Children: [
			{ Id: 'noodle-hao', Name: 'Mì & phở 1', ProductIds: [1, 2, 16, 20] },
			{ Id: 'noodle-pho', Name: 'Mì & phở 2', ProductIds: [3] },
		],
	},
	{
		Id: 'drink',
		Name: 'Nước giải khát',
		Icon: 'water-outline',
		Color: 'primary',
		Children: [
			{ Id: 'drink-cola', Name: 'Nước giải khát 1', ProductIds: [4, 5, 6] },
			{ Id: 'drink-water', Name: 'Nước giải khát 2', ProductIds: [13, 14] },
		],
	},
	{
		Id: 'snack',
		Name: 'Bánh kẹo',
		Icon: 'cafe-outline',
		Color: 'tertiary',
		Children: [
			{ Id: 'snack-cake', Name: 'Bánh kẹo 1', ProductIds: [7, 15] },
			{ Id: 'snack-candy', Name: 'Bánh kẹo 2', ProductIds: [8, 21, 22] },
		],
	},
	{
		Id: 'dairy',
		Name: 'Sữa & yogurt',
		Icon: 'beaker-outline',
		Color: 'success',
		// No L2 — flat product list under L1
		ProductIds: [9, 10, 23],
	},
	{
		Id: 'home',
		Name: 'Gia dụng',
		Icon: 'home-outline',
		Color: 'medium',
		ProductIds: [11, 12, 17, 18, 19, 24],
	},
	{
		Id: 'rice',
		Name: 'Gạo & ngũ cốc',
		Icon: 'leaf-outline',
		Color: 'warning',
		Children: [
			{ Id: 'rice-1', Name: 'Gạo & ngũ cốc 1', ProductIds: [25, 26] },
			{ Id: 'rice-2', Name: 'Gạo & ngũ cốc 2', ProductIds: [17, 19] },
		],
	},
	{
		Id: 'sauce',
		Name: 'Gia vị',
		Icon: 'flask-outline',
		Color: 'danger',
		Children: [
			{ Id: 'sauce-1', Name: 'Gia vị 1', ProductIds: [18, 27] },
			{ Id: 'sauce-2', Name: 'Gia vị 2', ProductIds: [19, 17] },
		],
	},
	{
		Id: 'fresh-meat',
		Name: 'Thịt tươi',
		Icon: 'nutrition-outline',
		Color: 'danger',
		Children: [
			{ Id: 'meat-1', Name: 'Thịt tươi 1', ProductIds: [28, 29] },
			{ Id: 'meat-2', Name: 'Thịt tươi 2', ProductIds: [30] },
		],
	},
	{
		Id: 'veg',
		Name: 'Rau củ',
		Icon: 'flower-outline',
		Color: 'success',
		Children: [
			{ Id: 'veg-1', Name: 'Rau củ 1', ProductIds: [31, 32] },
			{ Id: 'veg-2', Name: 'Rau củ 2', ProductIds: [32, 31] },
		],
	},
	{
		Id: 'fruit',
		Name: 'Trái cây',
		Icon: 'sunny-outline',
		Color: 'warning',
		Children: [
			{ Id: 'fruit-1', Name: 'Trái cây 1', ProductIds: [33, 34] },
			{ Id: 'fruit-2', Name: 'Trái cây 2', ProductIds: [34, 33] },
		],
	},
	{
		Id: 'alcohol',
		Name: 'Bia rượu',
		Icon: 'wine-outline',
		Color: 'tertiary',
		Children: [
			{ Id: 'alcohol-1', Name: 'Bia rượu 1', ProductIds: [35, 36] },
			{ Id: 'alcohol-2', Name: 'Bia rượu 2', ProductIds: [35] },
		],
	},
	{
		Id: 'personal',
		Name: 'Chăm sóc cá nhân',
		Icon: 'body-outline',
		Color: 'primary',
		Children: [
			{ Id: 'personal-1', Name: 'Chăm sóc cá nhân 1', ProductIds: [37, 38] },
			{ Id: 'personal-2', Name: 'Chăm sóc cá nhân 2', ProductIds: [38, 12] },
		],
	},
	{
		Id: 'baby',
		Name: 'Mẹ & bé',
		Icon: 'happy-outline',
		Color: 'secondary',
		Children: [
			{ Id: 'baby-1', Name: 'Mẹ & bé 1', ProductIds: [39, 40] },
			{ Id: 'baby-2', Name: 'Mẹ & bé 2', ProductIds: [41, 39] },
		],
	},
	{
		Id: 'elec',
		Name: 'Điện gia dụng',
		Icon: 'flash-outline',
		Color: 'medium',
		Children: [
			{ Id: 'elec-1', Name: 'Điện gia dụng 1', ProductIds: [42, 43] },
			{ Id: 'elec-2', Name: 'Điện gia dụng 2', ProductIds: [43, 42] },
		],
	},
	{
		Id: 'pet',
		Name: 'Thú cưng',
		Icon: 'paw-outline',
		Color: 'tertiary',
		Children: [
			{ Id: 'pet-1', Name: 'Thú cưng 1', ProductIds: [44, 21] },
			{ Id: 'pet-2', Name: 'Thú cưng 2', ProductIds: [44] },
		],
	},
];
