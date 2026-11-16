import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { AlertController, LoadingController, ModalController, NavController, PopoverController } from '@ionic/angular';
import { SortConfig } from 'src/app/interfaces/options-interface';
import { PageBase } from 'src/app/page-base';
import { EnvService } from 'src/app/services/core/env.service';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { SALE_OrderProvider } from 'src/app/services/static/services.service';
import {
	DEMO_CATEGORIES,
	DEMO_OUTLETS,
	DEMO_PRODUCTS,
	DemoARInvoice,
	DemoCartLine,
	DemoOrderMeta,
	DemoOutlet,
	DemoProduct,
	emptyOrderMeta,
	formatVnd,
	invoiceDisplay,
	invoiceLookupUrl,
	normalizeOrderMeta,
} from './demo-data';
import { addToCart, cartLineCount, cartQty, cartTotal, filterProducts } from './cart.util';
import {
	customerAddressOf,
	customerNameOf,
	customerPhoneOf,
	hasShipment,
	keepCartOnCustomerRepick,
	orderTotalOf,
	resolveSaleOrderCanSubmit,
	shipmentIdsOf,
} from './sale-order3-list.util';
import { canShareInvoiceLink, shareInvoiceLink } from './share-invoice.util';
import { SaleOrder3NewOrderModalComponent } from './new-order-modal/new-order-modal.component';
import { SaleOrder3ProductCategoryModalComponent } from './product-category-modal/product-category-modal.component';
import { SaleOrder3CartModalComponent } from './cart-modal/cart-modal.component';
import { clearInvoiceMeta } from './cart-modal/cart-invoice.util';
import { SaleOrder3OfflineService } from './sale-order3-offline.service';
import { CustomerPickRow, isSameCustomerPick } from './new-order-modal/new-order-modal.util';

type OrderView = 'list' | 'catalog';

@Component({
	selector: 'app-sale-order3',
	templateUrl: './sale-order3.page.html',
	styleUrls: ['./sale-order3.page.scss'],
	standalone: false,
})
export class SaleOrder3Page extends PageBase {
	view: OrderView = 'list';
	statusList: any[] = [];
	outlets = DEMO_OUTLETS;
	categories = DEMO_CATEGORIES;
	products = DEMO_PRODUCTS;
	cart: DemoCartLine[] = [];
	orderMeta: DemoOrderMeta = emptyOrderMeta();
	selectedOutlet: DemoOutlet | null = null;
	segmentId = 0;
	productSearch = '';

	formatVnd = formatVnd;
	cartQty = (id: number) => cartQty(this.cart, id);
	shipmentIds = shipmentIdsOf;
	hasShipment = hasShipment;
	customerName = customerNameOf;
	customerAddress = customerAddressOf;
	customerPhone = customerPhoneOf;
	orderTotal = orderTotalOf;

	get headerTitle(): string {
		if (this.view === 'catalog') return this.selectedOutlet?.Name || 'Catalog';
		return this.pageConfig.pageTitle || 'Order';
	}

	get cartCount() {
		return cartLineCount(this.cart);
	}
	get cartSum() {
		return cartTotal(this.cart);
	}

	get filteredProducts(): DemoProduct[] {
		let list = filterProducts(this.products, this.segmentId);
		const q = this.productSearch.trim().toLowerCase();
		if (q) list = list.filter((p) => p.Name.toLowerCase().includes(q));
		return list;
	}

	constructor(
		public pageProvider: SALE_OrderProvider,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location,
		private so3Offline: SaleOrder3OfflineService
	) {
		super();
		// Same SYS_Form Code as classic sale-order (route /sale-order)
		this.pageConfig.pageName = 'sale-order';
		this.pageConfig.pageTitle = 'Order';
		this.pageConfig.pageIcon = 'cart-outline';
		this.pageConfig.reportIds = [5, 38,3,2,1];
		this.pageConfig.ShowFeature = false;
		this.pageConfig.refresher = true;

		this.pageConfig.dividers = [
			{
				fields: ['OrderDate'],
				dividerFn: (record, recordIndex, records) => {
					if (!record?.OrderDate) return null;
					const prevDate = recordIndex == 0 ? null : records[recordIndex - 1]?.OrderDate;
					const a = prevDate ? new Date(prevDate) : new Date('2000-01-01');
					const b = new Date(record.OrderDate);
					if (Number.isNaN(b.getTime())) return null;
					const sameDay =
						a.getDate() == b.getDate() && a.getMonth() == b.getMonth() && a.getFullYear() == b.getFullYear();
					if (sameDay) return null;
					return lib.dateFormat(record.OrderDate, 'dd/mm/yyyy');
				},
			},
		];
		const sorted: SortConfig[] = [
			{ Dimension: 'OrderDate', Order: 'DESC' },
			{ Dimension: 'Id', Order: 'DESC' },
		];
		this.pageConfig.sort = sorted;
	}

	/** Owner / parent defaults (same as sale-order list). */
	private applySaleOrderListQuery() {
		// /sale-order3 alias has no SYS_Form Code — reuse sale-order rights
		this.getPagePermission('sale-order');
		this.query.IDOwner = this.pageConfig.canViewAllData ? 'all' : this.env.user?.StaffID;
		this.query.IDParent = null;
		delete this.query.Status;
		delete this.query['_Customer.Name'];
		delete this.query['_Saleman.FullName'];
	}

	preLoadData(event?: any) {
		this.applySaleOrderListQuery();
		if (!this.query.OrderDateTimeFrame) {
			// Same default range style as AR invoice (last 1 week → today)
			this.query.OrderDateTimeFrame = {
				From: { Type: 'Relative', IsPastDate: true, Period: 'Week', Amount: 1, IsNull: false },
				To: { Type: 'Relative', IsPastDate: true, Period: 'Day', Amount: 0, IsNull: false },
			};
		}
		delete this.query.OrderDate;
		Promise.all([this.env.getStatus('SalesOrder'), this.restoreOfflineDraft()]).then((values: any) => {
			this.statusList = values[0] || [];
			super.preLoadData(event);
		});
	}

	private async restoreOfflineDraft() {
		const draft = await this.so3Offline.loadDraft();
		if (!draft) return;
		if (draft.outlet) this.selectedOutlet = draft.outlet;
		this.cart = draft.cart || [];
		this.orderMeta = normalizeOrderMeta(draft.orderMeta);
	}

	private persistOfflineDraft() {
		void this.so3Offline.saveDraft(this.selectedOutlet, this.cart, this.orderMeta);
	}

	events(e) {
		if (e?.Code == 'shipment' || e?.Code == 'sale-order') {
			this.refresh();
		}
	}

	enrichListItem(row: any): any {
		if (!row) return row;
		const i = { ...row };
		i.OrderTimeText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'hh:MM') : '';
		i.OrderDateText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'dd/mm/yy') : '';
		i.Query = i.OrderDate ? lib.dateFormat(i.OrderDate, 'yyyy-mm-dd') : '';
		i.OriginalTotalAfterTaxText = lib.currencyFormat(i.OriginalTotalAfterTax);
		i.TotalAfterTaxText = lib.currencyFormat(i.TotalAfterTax);
		i.DisplayTotal = orderTotalOf(i);
		i.CustomerName = customerNameOf(i);
		i.AddressLine1 = customerAddressOf(i);
		i.WorkPhone = customerPhoneOf(i);
		i.ShipmentIds = shipmentIdsOf(i);
		i._Status = this.statusList?.find((s) => s.Code == i.Status);
		return i;
	}

	loadedData(event?: any) {
		this.items = (this.items || []).map((i) => this.enrichListItem(i));
		super.loadedData(event);
		this.pageConfig.canSubmit = resolveSaleOrderCanSubmit(this.pageConfig);
	}

	refresh(event = null) {
		if (this.so3Offline.warnIfOffline(true)) {
			if (event?.target?.complete) event.target.complete();
			return;
		}
		this.applySaleOrderListQuery();
		super.refresh(event);
	}

	add() {
		this.openNewOrderModal();
	}

	private listPageTitle: string | null = null;

	setView(next: OrderView) {
		this.view = next;
		const onList = next === 'list';
		this.pageConfig.ShowAdd = onList;
		this.pageConfig.ShowSearch = onList;
		this.pageConfig.ShowRefresh = onList;
		if (onList) {
			if (this.listPageTitle) this.pageConfig.pageTitle = this.listPageTitle;
		} else {
			if (!this.listPageTitle) this.listPageTitle = this.pageConfig.pageTitle || 'Order';
			this.pageConfig.pageTitle = this.headerTitle;
		}
	}

	/** Only one so3 modal at a time — open next after previous dismisses. */
	private cartReturn: 'category' | 'list' = 'list';
	/** Where customer picker was opened from — controls next modal after select. */
	private pickerFrom: 'add' | 'category' | 'cart' = 'add';

	async openNewOrderModal(from: 'add' | 'category' | 'cart' = 'add') {
		this.pickerFrom = from;
		const modal = await this.modalController.create({
			component: SaleOrder3NewOrderModalComponent,
			cssClass: 'so3-customer-picker-modal',
			componentProps: {
				selectedOutlet: this.selectedOutlet,
				openedFrom: from,
			},
			breakpoints: [0, 0.25, 0.5, 0.75, 1],
			initialBreakpoint: 0.75,
			handleBehavior: 'cycle',
			expandToScroll: false,
		});
		await modal.present();
		const { data, role } = await modal.onWillDismiss();
		if (role === 'select' && data?.outlet) {
			const from = this.pickerFrom;
			// Pick-again from catalog/cart keeps lines; only a fresh Add clears cart.
			this.pickOutlet(data.outlet as CustomerPickRow | DemoOutlet, {
				keepCart: keepCartOnCustomerRepick(from),
			});
			if (from === 'cart') {
				await this.openCart(this.cartReturn, { allowEmpty: true });
				return;
			}
			await this.openProductCategoryModal();
		}
	}

	async openProductCategoryModal() {
		if (!this.selectedOutlet) return;
		const modal = await this.modalController.create({
			component: SaleOrder3ProductCategoryModalComponent,
			cssClass: 'so3-product-category-modal',
			componentProps: {
				customer: this.selectedOutlet,
				cart: this.cart,
			},
		});
		await modal.present();
		const { data, role } = await modal.onWillDismiss();
		if (data?.cart) {
			this.cart = data.cart as DemoCartLine[];
			this.persistOfflineDraft();
		}
		if (role === 'cart') {
			await this.openCart('category');
			return;
		}
		if (role === 'submit') {
			await this.submitOrder();
			return;
		}
		if (role === 'back') {
			await this.openNewOrderModal('category');
		}
	}

	goBackView() {
		if (this.view === 'catalog') this.backFromCatalog();
		else this.setView('list');
	}

	pickOutlet(outlet: DemoOutlet | CustomerPickRow, opts?: { keepCart?: boolean }) {
		const next = this.toDemoOutlet(outlet);
		const same = isSameCustomerPick(this.selectedOutlet, next) || this.selectedOutlet?.Id === next?.Id;
		this.selectedOutlet = next;
		if (!same) {
			// Tax info belongs to the previous customer — clear even when cart lines are kept.
			this.orderMeta = clearInvoiceMeta(this.orderMeta);
			if (!opts?.keepCart) this.cart = [];
		}
		this.segmentId = 0;
		this.productSearch = '';
		this.persistOfflineDraft();
		this.setView('list');
	}

	private toDemoOutlet(outlet: DemoOutlet | CustomerPickRow): DemoOutlet {
		const row = outlet as CustomerPickRow & DemoOutlet;
		return {
			Id: Number(row.Id) || 0,
			Name: row.Name || '',
			Address: row.Address || '',
			Phone: row.Phone,
			TrackId: row.TrackId,
			IDAddress: row.IDAddress,
			DistanceM: row.DistanceM ?? undefined,
			IsPersonal: row.IsPersonal,
			McpDays: row.McpDays ? [...row.McpDays] : undefined,
		};
	}

	backFromCatalog() {
		this.setView('list');
		void this.openNewOrderModal('category');
	}

	async openCart(from: 'category' | 'list' = 'list', opts?: { allowEmpty?: boolean }) {
		if (this.cartCount === 0 && !opts?.allowEmpty) return;
		this.cartReturn = from;
		const modal = await this.modalController.create({
			component: SaleOrder3CartModalComponent,
			cssClass: 'so3-cart-modal',
			componentProps: {
				customer: this.selectedOutlet,
				cart: this.cart,
				orderMeta: this.orderMeta,
			},
			breakpoints: [0, 0.25, 0.5, 0.75, 1],
			initialBreakpoint: 0.75,
			handleBehavior: 'cycle',
			expandToScroll: false,
		});
		await modal.present();
		const { data, role } = await modal.onWillDismiss();
		if (data?.cart) {
			this.cart = data.cart as DemoCartLine[];
		}
		if (data?.orderMeta) {
			this.orderMeta = normalizeOrderMeta(data.orderMeta);
		}
		if (data?.cart || data?.orderMeta) {
			this.persistOfflineDraft();
		}
		if (role === 'pick-again') {
			await this.openNewOrderModal('cart');
			return;
		}
		if (role === 'add-products') {
			await this.openProductCategoryModal();
			return;
		}
		if (role === 'submit') {
			await this.submitOrder();
			return;
		}
		// Close cart → reopen catalog alone when that was the previous step.
		if ((role === 'close' || !role) && this.cartReturn === 'category' && this.selectedOutlet) {
			await this.openProductCategoryModal();
		}
	}

	plus(p: DemoProduct) {
		this.cart = addToCart(this.cart, p, 1);
		this.persistOfflineDraft();
	}

	minus(p: DemoProduct) {
		this.cart = addToCart(this.cart, p, -1);
		this.persistOfflineDraft();
	}

	/** List: no selection → salesman bulk (sale-order-mobile); with selection → Ids via PageBase. */
	submitForApproval() {
		if (!this.pageConfig.canSubmit || this.submitAttempt) return;
		if (this.view === 'list' && !this.selectedItems?.length && this.pageConfig.canSubmitSalesmanOrdersForApproval) {
			this.submitSalesmanOrdersForApproval();
			return;
		}
		if (!this.selectedItems?.length) {
			this.env.showMessage('Please select at least one item to continue', 'warning');
			return;
		}
		super.submitForApproval();
	}

	private submitSalesmanOrdersForApproval() {
		this.env
			.showPrompt(
				'After submitting for approval, you will not be able to edit the orders anymore. Do you want to submit all orders for approval?',
				null,
				'Submit for approval',
				'Submit for approval',
				'No'
			)
			.then(() => {
				if (this.submitAttempt) return;
				this.submitAttempt = true;
				const url = ApiSetting.apiDomain('SALE/Order/SubmitSalesmanOrdersForApproval/');
				this.pageProvider.commonService
					.connect('POST', url, null)
					.toPromise()
					.then(() => {
						this.env.publishEvent({ Code: this.pageConfig.pageName });
						this.env.showMessage('Saving completed!', 'success');
						this.submitAttempt = false;
						this.refresh();
					})
					.catch(() => {
						this.submitAttempt = false;
						this.env.showMessage('Cannot submit, please try again', 'danger');
					});
			})
			.catch(() => {});
	}

	async submitOrder() {
		if (!this.selectedOutlet || this.cartCount === 0) return;
		const total = this.cartSum;
		const now = new Date();
		const staffId = this.env.user?.StaffID || 0;
		const row = this.enrichListItem({
			Id: -1 * (Date.now() % 100000),
			Code: `DRAFT-${Date.now() % 100000}`,
			OrderDate: now.toISOString(),
			Status: 'New',
			IDContact: this.selectedOutlet.Id,
			IDOwner: staffId,
			OriginalTotalAfterTax: total,
			TotalAfterTax: 0,
			_Invoices: [],
			ShipmentIds: [],
			_Customer: {
				Id: this.selectedOutlet.Id,
				Name: this.selectedOutlet.Name,
				WorkPhone: this.selectedOutlet.Phone,
				Address: { AddressLine1: this.selectedOutlet.Address },
			},
			_Saleman: {
				Id: staffId,
				FullName: this.env.user?.FullName || '',
			},
		});
		this.items = [row, ...this.items];
		this.cart = [];
		this.orderMeta = emptyOrderMeta();
		this.selectedOutlet = null;
		void this.so3Offline.clearDraft();
		this.setView('list');
		this.env.showMessage('Order confirmed (demo, not saved to server yet)', 'success', null, 1800);
	}

	primaryInvoice(order: any): DemoARInvoice | null {
		return (order?._Invoices || []).find((x) => !!x?.InvoiceNo) || null;
	}

	invoiceLink(order: any): string {
		return invoiceLookupUrl(this.primaryInvoice(order));
	}

	invoiceLabel(order: any): string {
		return invoiceDisplay(this.primaryInvoice(order));
	}

	async shareInvoice(order: any, event: Event) {
		event.stopPropagation();
		const inv = this.primaryInvoice(order);
		const link = this.invoiceLink(order);
		const label = this.invoiceLabel(order);
		if (!inv || !link) {
			event.preventDefault();
			return;
		}

		if (!canShareInvoiceLink()) return;

		event.preventDefault();
		const title = (await this.env.translateResource({ code: 'Invoice {{value}}', value: label })) as string;
		await shareInvoiceLink({
			title: title || `Invoice ${label}`,
			text: `${customerNameOf(order)}\n${link}`.trim(),
			url: link,
		});
	}
}
