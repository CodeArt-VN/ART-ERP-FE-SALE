import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { NavController, ModalController, NavParams, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { CRM_ContactProvider, SALE_OrderDetailProvider, SALE_OrderProvider, WMS_ItemProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { NgSelectConfig } from '@ng-select/ng-select';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { lib } from 'src/app/services/static/global-functions';
import { ApiSetting } from 'src/app/services/static/api-setting';

@Component({
	selector: 'app-sale-order-create-arinvoice-modal',
	templateUrl: './sale-order-create-arinvoice-modal.page.html',
	styleUrls: ['./sale-order-create-arinvoice-modal.page.scss'],
	standalone: false,
})
export class SaleOrderARInvoiceModalPage extends PageBase {
	@Input() selectedOrder;
	initContactsIds = [];

	constructor(
		public pageProvider: SALE_OrderProvider,
		public OrderDetailProvider: SALE_OrderDetailProvider,
		public contactProvider: CRM_ContactProvider,
		public itemProvider: WMS_ItemProvider,

		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,

		public modalController: ModalController,
		public alertCtrl: AlertController,
		public navParams: NavParams,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController,
		private config: NgSelectConfig
	) {
		super();
		this.pageConfig.isDetailPage = false;
		this.pageConfig.pageName = 'Tạo hóa đơn';
		this.config.notFoundText = 'Không tìm thấy dữ liệu phù hợp...';
		this.config.clearAllText = 'Xóa hết';
	}

	loadData(event) {
		this.item = { Id: this.selectedOrder.Id, SplitedOrders: [] };
		this.item.SplitedOrders.push({
			isFirst: true,
			IDContact: this.selectedOrder.IDContact,
			ContactName: this.selectedOrder.CustomerName,
		});
		this.item.SplitedOrders.push({
			isFirst: true,
			IDContact: null,
			ContactName: null,
		});

		this.contactListSelected.push({
			Id: this.selectedOrder.IDContact,
			Name: this.selectedOrder.CustomerName,
			WorkPhone: this.selectedOrder.IDContact,
			AddressLine1: this.selectedOrder.AddressLine1,
		});

		//check xem SO này là SO con hay không
		// console.log(this.selectedOrder);

		// let queryOption = {IDOrder: this.selectedOrder.Id, IDParent: 0};
		// if(this.selectedOrder.IDParent && this.selectedOrder.IDParent != 0)
		// {
		//     //queryOption = {IDOrder: this.selectedOrder.IDParent, IDParent: this.selectedOrder.IDParent};

		// }

		this.OrderDetailProvider.read({ IDOrder: this.selectedOrder.Id }).then((result: any) => {
			this.items = result.data;
			this.item.SplitedOrders[0].OrderLines = JSON.parse(JSON.stringify(this.items));
			this.item.SplitedOrders[1].OrderLines = JSON.parse(JSON.stringify(this.items));
			this.calcInvoices();

			this.loadedData(event);

			let ids = this.items.map((i) => i.IDItem);
			if (ids.length) {
				this.itemProvider
					.search({
						IgnoredBranch: true,
						Id: JSON.stringify(ids),
					})
					.toPromise()
					.then((result: any) => {
						result.forEach((i) => {
							if (this.itemListSelected.findIndex((d) => d.Id == i.Id) == -1) {
								this.itemListSelected.push(i);
							}
							let lines = this.items.filter((d) => d.IDItem == i.Id);
							lines.forEach((line) => {
								line._itemData = i;
							});
						});
					})
					.finally(() => {
						this.itemSearch();
					});
			} else {
				this.itemSearch();
			}
		});
	}

	loadedData(event) {
		this.contactSearch();
		super.loadedData(event);
	}

	contactList$;
	contactListLoading = false;
	contactListInput$ = new Subject<string>();
	contactListSelected = [];
	contactSelected = null;
	contactSearch() {
		this.contactListLoading = false;
		this.contactList$ = concat(
			of(this.contactListSelected),
			this.contactListInput$.pipe(
				distinctUntilChanged(),
				tap(() => (this.contactListLoading = true)),
				switchMap((term) =>
					this.contactProvider
						.search({
							Take: 20,
							Skip: 0,
							SkipMCP: true,
							Term: term ? term : 'BP:' + this.item.IDContact,
						})
						.pipe(
							catchError(() => of([])), // empty list on error
							tap(() => (this.contactListLoading = false))
						)
				)
			)
		);
	}

	itemList$;
	itemListLoading = false;
	itemListInput$ = new Subject<string>();
	itemListSelected = [];

	itemSearch() {
		this.itemListLoading = false;
		this.itemList$ = concat(
			of(this.itemListSelected),
			this.itemListInput$.pipe(
				distinctUntilChanged(),
				tap(() => (this.itemListLoading = true)),
				switchMap((term) =>
					this.itemProvider.search({ Take: 20, Skip: 0, Term: term }).pipe(
						catchError(() => of([])), // empty list on error
						tap(() => (this.itemListLoading = false))
					)
				)
			)
		);
	}

	changedIDContact(i, o) {
		if (i) {
			this.contactSelected = i;
			if (this.contactListSelected.findIndex((d) => d.Id == i.Id) == -1) {
				this.contactListSelected.push(i);
				this.contactSearch();
			}
			o.ContactName = i.Name;
		}
		this.checkValid();
	}

	segmentView = 's1';
	segmentChanged(ev: any) {
		this.segmentView = ev.detail.value;
	}

	addSplitedInvoice() {
		this.item.SplitedOrders.push({
			IDContact: null,
			OrderLines: JSON.parse(JSON.stringify(this.items)),
		});
		this.calcInvoices();
		this.checkValid();
	}

	removeSplitedInvoice(o) {
		const index = this.item.SplitedOrders.indexOf(o);
		if (index > -1) {
			this.item.SplitedOrders.splice(index, 1);
		}
		this.calcInvoices();
		this.checkValid();
	}

	calcInvoices() {
		this.items.forEach((i) => {
			i.splitDetail = [];
			for (let j = 0; j < this.item.SplitedOrders.length; j++) {
				const o = this.item.SplitedOrders[j];
				i.splitDetail.push(o.OrderLines.find((d) => d.Id == i.Id));
			}
		});

		this.items.forEach((i) => {
			let Order = i.splitDetail[0];
			let props = ['Quantity'];
			props.forEach((prop) => {
				this.checkOriginal(i, Order, prop);
			});
		});
	}

	changedCalc(originalRow, editingRow, prop) {
		let maxValue = originalRow[prop];
		let cValue = editingRow[prop];
		if (cValue > maxValue) {
			editingRow[prop] = maxValue;
			cValue = maxValue;
		}
		if (editingRow['Quantity'] == originalRow['Quantity']) {
			let props = ['Quantity'];
			props.forEach((prop) => {
				editingRow[prop] = originalRow[prop];
			});
		}

		this.calcOrderLine(editingRow);

		this.items.forEach((i) => {
			let Order = i.splitDetail[0];
			let props = ['Quantity'];
			props.forEach((prop) => {
				this.checkOriginal(i, Order, prop);
			});
		});
		this.checkValid();
	}

	checkOriginal(originalRow, editingRow, prop) {
		let maxValue = originalRow[prop];
		let cValue = editingRow[prop];
		if (cValue > maxValue) {
			editingRow[prop] = maxValue;
			cValue = maxValue;
		}

		this.calcOrderLine(editingRow);

		let remain = maxValue - cValue;

		let ortherInvoice = originalRow.splitDetail.filter((d) => d != editingRow);

		for (let i = 0; i < ortherInvoice.length; i++) {
			const OrderLine = ortherInvoice[i];

			if (i == ortherInvoice.length - 1) {
				OrderLine[prop] = remain;
			}

			if (remain - OrderLine[prop] <= 0) {
				OrderLine[prop] = remain;
			}

			remain = remain - OrderLine[prop];
			this.calcOrderLine(OrderLine);
		}
	}

	isCanSplit = false;
	checkValid() {
		this.isCanSplit = true;

		for (let i = 0; i < this.item.SplitedOrders.length; i++) {
			const o = this.item.SplitedOrders[i];
			if (!o.IDContact) {
				this.isCanSplit = false;
				break;
			}

			let totalQty = 0;
			for (let j = 0; j < o.OrderLines.length; j++) {
				const l = o.OrderLines[j];
				totalQty += l.Quantity;
			}
			if (totalQty == 0) {
				this.isCanSplit = false;
				break;
			}
		}
	}

	calcOrderLine(line) {
		line.UoMPrice = line.IsPromotionItem ? 0 : parseInt(line.UoMPrice) || 0;
		line.BuyPrice = parseInt(line.BuyPrice) || 0;

		line.Quantity = parseInt(line.Quantity) || 0;
	}

	splitARInvoice() {
		let publishEventCode = this.pageConfig.pageName;
		let apiPath = {
			method: 'POST',
			url: function () {
				return ApiSetting.apiDomain('AC/ARInvoice/SplitSOToARInvoices/');
			},
		};

		return new Promise((resolve, reject) => {
			if (!this.isCanSplit) {
				this.env.showMessage('Please check again, orders must have at least 1 item to be approved', 'warning');
			} else if (this.submitAttempt == false) {
				this.submitAttempt = true;

				if (!this.item.IDBranch) {
					this.item.IDBranch = this.env.selectedBranch;
				}

				if (!this.item.CreatedBy) {
					this.item.CreatedBy = this.env.user.UserName;
				}

				this.pageProvider.commonService
					.connect(apiPath.method, apiPath.url(), this.item)
					.toPromise()
					.then((savedItem: any) => {
						if (publishEventCode) {
							this.env.publishEvent({ Code: publishEventCode });
						}
						this.env.showMessage('Invoice created!', 'success');
						resolve(true);
						this.submitAttempt = false;
						this.closeModal();
					})
					.catch((err) => {
						this.env.showMessage('Please check again, orders must have at least 1 item to be approved', 'danger');
						this.cdr?.detectChanges();
						this.submitAttempt = false;
						reject(err);
					});
			}
		});
	}
}
