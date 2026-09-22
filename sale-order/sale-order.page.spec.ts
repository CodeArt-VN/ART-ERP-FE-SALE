import { SaleOrderPage } from './sale-order.page';

describe('SaleOrderPage', () => {
	let component: SaleOrderPage;
	let env: { showMessage: jasmine.Spy };
	let originalFetch: typeof fetch;

	beforeEach(() => {
		env = { showMessage: jasmine.createSpy('showMessage') };
		component = Object.create(SaleOrderPage.prototype) as SaleOrderPage;
		component.env = env as any;
		component.submitAttempt = false;
		component.nestleImportSOWebhook = '';
		component.nestleImportParam = {
			orderDateFrom: '2026-09-16',
			orderDateTo: '2026-09-16',
		};
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('nestleImport should warn when webhook is not configured', async () => {
		component.nestleImportSOWebhook = '';
		await component.nestleImport();
		expect(env.showMessage).toHaveBeenCalledWith('Nestle import webhook is not configured', 'warning');
		expect(component.submitAttempt).toBeFalse();
	});

	it('nestleImport should post date range and show waiting message when ok', async () => {
		component.nestleImportSOWebhook = 'https://example.com/webhook/nestle';
		component.nestleFormGroup = {
			get: (key: string) => ({ value: key === 'IDBranch' ? 12 : null }),
		} as any;
		const fetchSpy = jasmine.createSpy('fetch').and.resolveTo({ ok: true, status: 200 } as Response);
		globalThis.fetch = fetchSpy;

		await component.nestleImport();

		expect(fetchSpy).toHaveBeenCalledOnceWith('https://example.com/webhook/nestle', {
			method: 'POST',
			mode: 'cors',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				orderDateFrom: '2026-09-16',
				orderDateTo: '2026-09-16',
				IDBranch: 12,
			}),
		});
		expect(env.showMessage).toHaveBeenCalledWith(
			'This process may take a few minutes. Please wait for the email notification when it is completed.',
			'success',
			null,
			0,
			true
		);
		expect(component.submitAttempt).toBeFalse();
	});

	it('nestleImport should show error when webhook returns non-ok status', async () => {
		component.nestleImportSOWebhook = 'https://example.com/webhook/nestle';
		component.nestleFormGroup = {
			get: (key: string) => ({ value: key === 'IDBranch' ? 12 : null }),
		} as any;
		globalThis.fetch = jasmine.createSpy('fetch').and.resolveTo({ ok: false, status: 500 } as Response);

		await component.nestleImport();

		expect(env.showMessage).toHaveBeenCalledWith('Import error, please check again', 'danger');
		expect(component.submitAttempt).toBeFalse();
	});

	it('nestleImport should show error when webhook call fails', async () => {
		component.nestleImportSOWebhook = 'https://example.com/webhook/nestle';
		component.nestleFormGroup = {
			get: (key: string) => ({ value: key === 'IDBranch' ? 12 : null }),
		} as any;
		globalThis.fetch = jasmine.createSpy('fetch').and.rejectWith(new Error('network'));

		await component.nestleImport();

		expect(env.showMessage).toHaveBeenCalledWith('Import error, please check again', 'danger');
		expect(component.submitAttempt).toBeFalse();
	});

	it('enrichListItem maps status and date texts for list rows', () => {
		component.statusList = [{ Code: 'New', Name: 'New' }];
		const row = component.enrichListItem({
			Id: 7,
			OrderDate: '2026-09-22T10:15:00',
			ExpectedDeliveryDate: '2026-09-23T08:00:00',
			Status: 'New',
			OriginalTotalAfterTax: 1000,
			TotalAfterTax: 1000,
		});

		expect(row.OrderDateText).toBeTruthy();
		expect(row.Query).toBe('2026-09-22');
		expect(row.QueryExpectedDeliveryDate).toBe('2026-09-23');
		expect(row._Status).toEqual({ Code: 'New', Name: 'New' });
	});
});
