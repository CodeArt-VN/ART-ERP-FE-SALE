import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { NavController, ModalController, NavParams, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { CRM_ContactProvider, SALE_OrderProvider, SALE_OrderDetailProvider, WMS_ItemProvider } from 'src/app/services/static/services.service';
import { FormBuilder } from '@angular/forms';
import { NgSelectConfig } from '@ng-select/ng-select';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ApiSetting } from 'src/app/services/static/api-setting';

@Component({
	selector: 'app-sale-order-merge-arinvoice-modal',
	templateUrl: './sale-order-merge-arinvoice-modal.page.html',
	styleUrls: ['./sale-order-merge-arinvoice-modal.page.scss'],
	standalone: false,
})
export class SaleOrderMergeARInvoiceModalPage extends PageBase {
	@Input() selectedOrders;

	initContactsIds = [];

	constructor(
		public pageProvider: SALE_OrderProvider,
		public contactProvider: CRM_ContactProvider,
		public OrderDetailProvider: SALE_OrderDetailProvider,
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
		this.pageConfig.pageName = 'Gộp hóa đơn';
		this.config.notFoundText = 'Không tìm thấy dữ liệu phù hợp...';
		this.config.clearAllText = 'Xóa hết';
	}

	loadData(event) {
		this.item = { Ids: [], IDContact: null, SplitedOrders: [] };
		if (this.selectedOrders) {
			this.selectedOrders.forEach((i) => {
				this.item.Ids.push(i.Id);
				this.initContactsIds.push(i.IDContact);
			});
		}

		this.item.SplitedOrders.push({
			isFirst: true,
			IDContact: this.selectedOrders[0].IDContact,
			ContactName: this.selectedOrders[0].CustomerName,
		});

		this.contactListSelected.push({
			Id: this.selectedOrders[0].IDContact,
			Name: this.selectedOrders[0].CustomerName,
			WorkPhone: this.selectedOrders[0].IDContact,
			AddressLine1: this.selectedOrders[0].AddressLine1,
		});
		let soIds = JSON.stringify(this.selectedOrders.map((i) => i.Id));
		this.OrderDetailProvider.read({ IDOrder: soIds }).then((result: any) => {
			console.log(result);
			this.items = result.data;

			this.item.SplitedOrders[0].OrderLines = JSON.parse(JSON.stringify(this.items));

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
		if (this.initContactsIds.length) {
			this.contactProvider
				.read({ Id: JSON.stringify(this.initContactsIds) })
				.then((contacts: any) => {
					this.contactSelected = contacts.data[0];
					this.item.IDContact = this.contactSelected.Id;
					contacts.data.forEach((contact) => {
						if (contact && this.contactListSelected.findIndex((d) => d.Id == contact.Id) == -1) {
							this.contactListSelected.push({
								Id: contact.Id,
								Code: contact.Code,
								Name: contact.Name,
								WorkPhone: contact.WorkPhone,
								AddressLine1: contact.AddressLine1,
							});
						}
					});
				})
				.finally(() => {
					this.contactSearch();
					this.cdr.detectChanges();
				});
		} else {
			this.contactSearch();
		}

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

	merge() {
		let publishEventCode = this.pageConfig.pageName;
		let apiPath = {
			method: 'POST',
			url: function () {
				return ApiSetting.apiDomain('AC/ARInvoice/splitSOToARInvoices/');
			},
		};

		return new Promise((resolve, reject) => {
			if (!this.item.Ids.length || !this.item.IDContact) {
				this.env.showMessage('Please check the invoice to combine and select customer', 'warning');
				return;
			}

			if (!this.isCanSplit) {
				this.env.showMessage('Please check customer name and split order must have at least 01 item.', 'warning');
				return;
			}

			if (this.submitAttempt == false) {
				this.submitAttempt = true;

				if (!this.item.IDBranch) {
					this.item.IDBranch = this.env.selectedBranch;
				}

				if (!this.item.CreatedBy) {
					this.item.CreatedBy = this.env.user.UserName;
				}

				this.item.SplitedOrders[0].Remark = 'Merged from SO:' + this.item.Ids.toString();

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
						this.env.showMessage('Cannot generate invoice, please try again.', 'danger');
						this.cdr.detectChanges();
						this.submitAttempt = false;
						reject(err);
					});
			}
		});
	}

	changedIDContact(i) {
		if (i) {
			this.contactSelected = i;
			if (this.contactListSelected.findIndex((d) => d.Id == i.Id) == -1) {
				this.contactListSelected.push(i);
				this.contactSearch();
			}
		}
	}

	segmentView = 's1';
	segmentChanged(ev: any) {
		this.segmentView = ev.detail.value;
	}

	addSplitedInvoice() {
		this.item.SplitedOrders.push({
			IDContact: this.item.IDContact,
			OrderLines: JSON.parse(JSON.stringify(this.items)),
		});
		this.calcInvoices();
		this.checkValid();
	}

	removeSplitedInvoice() {
		if (this.item.SplitedOrders.length > 1) {
			this.item.SplitedOrders.splice(this.item.SplitedOrders.length - 1, 1);
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
		console.log(this.items);

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

		let otherInvoice = originalRow.splitDetail.filter((d) => d != editingRow);

		if (otherInvoice.length == 0) originalRow.splitDetail[0][prop] = maxValue;
		else {
			for (let i = 0; i < otherInvoice.length; i++) {
				const OrderLine = otherInvoice[i];

				if (i == otherInvoice.length - 1) {
					OrderLine[prop] = remain;
				}

				if (remain - OrderLine[prop] <= 0) {
					OrderLine[prop] = remain;
				}

				remain = remain - OrderLine[prop];
				this.calcOrderLine(OrderLine);
			}
		}
	}

	isCanSplit = true;
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
}
