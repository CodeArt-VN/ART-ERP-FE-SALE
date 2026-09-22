import { SaleOrderMobilePage } from './sale-order-mobile.page';

describe('SaleOrderMobilePage', () => {
	let component: SaleOrderMobilePage;

	beforeEach(() => {
		component = Object.create(SaleOrderMobilePage.prototype) as SaleOrderMobilePage;
		component.pageConfig = { listSyncFetchById: true } as any;
		component.statusList = [];
		component.items = [];
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('enrichListItem maps status, date and total texts for list rows', () => {
		component.statusList = [{ Code: 'New', Name: 'New' }];
		const row = component.enrichListItem({
			Id: 7,
			OrderDate: '2026-09-22T10:15:00',
			Status: 'New',
			OriginalTotalAfterTax: 1000,
		});

		expect(row.OrderDateText).toBeTruthy();
		expect(row.OriginalTotalText).toBeTruthy();
		expect(row._Status).toEqual({ Code: 'New', Name: 'New' });
	});

	it('fetchAndUpsertListItem queries MobileList by Id', async () => {
		const urls: string[] = [];
		component.pageProvider = {
			apiPath: { getList: { url: () => '' } },
			read: jasmine.createSpy('read').and.callFake((q: any) => {
				urls.push(component.pageProvider.apiPath.getList.url());
				return Promise.resolve({ data: [{ Id: q.Id, Status: 'New' }] });
			}),
		} as any;
		(component as any).listFetchSeqById = new Map();

		const row = await component.fetchAndUpsertListItem(42);

		expect(component.pageProvider.read).toHaveBeenCalledWith({ Id: 42 }, true);
		expect(urls[0]).toContain('SALE/Order/MobileList');
		expect(row.Id).toBe(42);
	});
});
