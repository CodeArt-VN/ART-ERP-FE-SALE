import { Component, ViewChild } from '@angular/core';
import { AlertController, LoadingController, ModalController, NavController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { EnvService } from 'src/app/services/core/env.service';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { AC_ARInvoiceProvider, SALE_OrderProvider, SHIP_ShipmentProvider, SHIP_VehicleProvider } from 'src/app/services/static/services.service';
import { SaleOrderARInvoiceModalPage } from '../sale-order-create-arinvoice-modal/sale-order-create-arinvoice-modal.page';
import { SaleOrderMergeARInvoiceModalPage } from '../sale-order-merge-arinvoice-modal/sale-order-merge-arinvoice-modal.page';
import { SaleOrderMergeModalPage } from '../sale-order-merge-modal/sale-order-merge-modal.page';
import { SaleOrderSplitModalPage } from '../sale-order-split-modal/sale-order-split-modal.page';

import { EInvoiceService } from 'src/app/services/custom/einvoice.service';
import { SortConfig } from 'src/app/interfaces/options-interface';
import { SYS_ConfigService } from 'src/app/services/custom/system-config.service';

@Component({
	selector: 'app-sale-order2',
	templateUrl: 'sale-order2.page.html',
	styleUrls: ['sale-order2.page.scss'],
	standalone: false,
})
export class SaleOrder2Page extends PageBase {
	branchList = [];
	statusList = [];
	vehicleList = [];
	shipmentList = [];
	contact: any = {};

	segmentView = 's1';
	shipmentQuery: any = {
		Status: 'Scheduled',
		DeliveryDate: '',
		SortBy: 'IDVehicle',
	};

	masanImportParam: any = {
		featureDate: lib.dateFormat(new Date(), 'yyyy-mm-dd'),
		wareHouse: 'KF1652T01',
	};

	constructor(
		public pageProvider: SALE_OrderProvider,
		public shipmentProvider: SHIP_ShipmentProvider,
		public vehicleProvider: SHIP_VehicleProvider,
		public arInvoiceProvider: AC_ARInvoiceProvider,
		public sysConfigService: SYS_ConfigService,
		public EInvoiceServiceProvider: EInvoiceService,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController
	) {
		super();
		this.pageConfig.ShowFeature = true;

		let today = new Date();
		today.setDate(today.getDate() + 1);
		this.shipmentQuery.DeliveryDate = lib.dateFormat(today, 'yyyy-mm-dd');

		this.pageConfig.dividers = [
			{
				field: 'OrderDate',
				dividerFn: (record, recordIndex, records) => {
					let a: any = recordIndex == 0 ? new Date('2000-01-01') : new Date(records[recordIndex - 1].OrderDate);
					let b: any = new Date(record.OrderDate);
					let mins = Math.floor((b - a) / 1000 / 60);

					if (Math.abs(mins) < 600) {
						return null;
					}
					return  lib.dateFormat(record.OrderDate, 'yyyy-mm-dd') ;
				},
			},
		];

	}

	events(e) {
		if (e.Code == 'shipment') {
			this.loadShipmentList();
			this.refresh();
		}
	}

	preLoadData(event) {
		this.query.IDOwner = this.pageConfig.canViewAllData ? 'all' : this.env.user.StaffID;
		this.query.IDParent = null;
		this.query.Type = "POSOrder";
		let sysConfigQuery = ['SOUsedApprovalModule', 'IsShowExpectedDeliveryDate'];

		let sorted: SortConfig[] = [
					{ Dimension: 'OrderDate', Order: 'DESC' },
					{ Dimension: 'Id', Order: 'DESC' },
				];
		this.pageConfig.sort = sorted;
		


		Promise.all([
			this.sysConfigService.getConfig(this.env.selectedBranch, ['SOUsedApprovalModule', 'IsShowExpectedDeliveryDate']),
			this.env.getStatus('POSOrder')
		]).then((values: any) => {
			if(values[0]){
				this.pageConfig = {
					...this.pageConfig,
					...values[0]
				};
			}
			if (this.pageConfig.SOUsedApprovalModule) {
				this.pageConfig.canApprove = false;
			}
			this.statusList = values[1];

			super.preLoadData(event);
		});

		this.loadVehicleList();
		this.loadShipmentList();
	}

	loadedData(event) {
		this.items.forEach((i) => {
			i._Status = this.statusList.find((s) => s.Code == i.Status);
		});
		super.loadedData(event);

		this.pageConfig.canSubmit = this.pageConfig.canSubmitOrdersForApproval || this.pageConfig.canSubmitSalesmanOrdersForApproval;
	}

	loadVehicleList() {
		this.vehicleProvider.read({ IgnoredBranch: true }).then((response) => {
			this.vehicleList = response['data'];
			this.vehicleList.forEach((v) => {
				if (v.ShipperName) {
					v.Name = v.Name + ' - ' + v.ShipperName;
				}
			});
		});
	}

	loadShipmentList() {
		this.shipmentProvider.apiPath.getList.url = function () {
			return ApiSetting.apiDomain('SHIP/Shipment/List');
		};
		this.shipmentProvider.read(this.shipmentQuery).then((resp: any) => {
			this.shipmentList = resp.data;
			this.shipmentList.forEach((i) => {
				i.DeliveryDateText = lib.dateFormat(i.DeliveryDate, 'dd/mm/yy hh:MM');
			});
		});
	}

	showDetail(i) {
		this.navCtrl.navigateForward('/sale-order/' + i.Id);
	}

	add() {
		let newSaleOrder = {
			Id: 0,
		};
		this.showDetail(newSaleOrder);
	}

	async split() {
		// let IDStatus = this.selectedItems[0].IDStatus;
		let status = this.selectedItems[0].Status;
		if (!(status == 'New' || status == 'Unapproved' || status == 'Submitted')) {
			this.env.showMessage('Your selected order cannot be split. Please choose draft, new, pending for approval or disaaproved order', 'warning');
			return;
		}
		const modal = await this.modalController.create({
			component: SaleOrderSplitModalPage,
			cssClass: 'modal90',
			componentProps: {
				selectedOrder: this.selectedItems[0],
			},
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();

		this.selectedItems = [];
		this.refresh();
	}

	async merge() {
		let itemsCanNotProcess = this.selectedItems.filter((i) => !(i.Status == 'New' || i.Status == 'Unapproved' || i.Status == 'Submitted'));
		if (itemsCanNotProcess.length) {
			this.env.showMessage('Your selected invoices cannot be combined. Please select new or disapproved invoice', 'warning');
			return;
		}

		const modal = await this.modalController.create({
			component: SaleOrderMergeModalPage,
			cssClass: 'modal-merge-orders',
			componentProps: {
				selectedOrders: this.selectedItems,
			},
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();

		this.selectedItems = [];
		this.refresh();
	}

	delete() {
		// !(i.IDStatus == 101 || i.IDStatus == 102)
		let itemsCanNotDelete = this.selectedItems.filter((i) => !(i.Status == 'New' || i.Status == 'Unapproved'));
		if (itemsCanNotDelete.length == this.selectedItems.length) {
			this.env.showMessage('Your selected invoices cannot be deleted. Please only delete new or disapproved invoice', 'warning');
		} else if (itemsCanNotDelete.length) {
			this.alertCtrl
				.create({
					header: 'Có ' + itemsCanNotDelete.length + ' đơn không thể xóa',
					//subHeader: '---',
					message: 'Bạn có muốn bỏ qua ' + this.selectedItems.length + ' đơn này và tiếp tục xóa?',
					buttons: [
						{
							text: 'Không',
							role: 'cancel',
							handler: () => {
								//console.log('Không xóa');
							},
						},
						{
							text: 'Đồng tiếp tục',
							cssClass: 'danger-btn',
							handler: () => {
								itemsCanNotDelete.forEach((i) => {
									i.checked = false;
								});
								// i.IDStatus == 101 || i.IDStatus == 102
								this.selectedItems = this.selectedItems.filter((i) => i.Status == 'New' || i.Status == 'Unapproved');
								super.delete();
							},
						},
					],
				})
				.then((alert) => {
					alert.present();
				});
		} else {
			super.delete();
		}
	}

	addSOtoShipment(s) {
		// i.IDStatus == 104 || i.IDStatus == 110
		let OrderIds = this.selectedItems.filter((i) => i.Status == 'Approved' || i.Status == 'Redelivery'); //Đã duyệt || chờ giao lại
		let DebtOrderIds = this.selectedItems.filter((i) => i.Status == 'Debt'); // Đang nợ i.IDStatus == 113
		if (!(OrderIds.length || DebtOrderIds.length)) {
			this.env.showMessage('Your chosen order cannot be allocated for delivery. Please only select approved or pending for delivery orders.', 'warning');
			return;
		}

		let shipment = {
			Id: s.Id,
			OrderIds: OrderIds.map((e) => e.Id),
			DebtOrderIds: DebtOrderIds.map((e) => e.Id),
		};

		let publishEventCode = this.pageConfig.pageName;
		let apiPath = {
			method: 'PUT',
			url: function () {
				return ApiSetting.apiDomain('SHIP/Shipment/QuickAddSO/');
			},
		};

		if (this.submitAttempt == false) {
			this.submitAttempt = true;

			this.pageProvider.commonService
				.connect(apiPath.method, apiPath.url(), shipment)
				.toPromise()
				.then((savedItem: any) => {
					if (publishEventCode) {
						this.env.publishEvent({ Code: publishEventCode });
					}
					this.env.showMessage('Saving completed!', 'success');
					this.loadShipmentList();
					this.submitAttempt = false;
				})
				.catch((err) => {
					this.submitAttempt = false;
					this.loadShipmentList();
					this.env.showMessage('Cannot save, please try again', 'danger');
					//console.log(err);
				});
		}
	}

	async createARInvoice() {
		if (!this.pageConfig.canAddARInvoice) {
			return;
		}

		// (i) =>
		//     i.IDStatus == 101 ||
		//     i.IDStatus == 102 ||
		//     i.IDStatus == 103 ||
		//     i.IDStatus == 110 ||
		//     i.IDStatus == 111 ||
		//     i.IDStatus == 112 ||
		//     i.IDStatus == 115,

		let itemsCanNotProcess = this.selectedItems.filter(
			(i) =>
				i.Status == 'New' ||
				i.Status == 'Unapproved' ||
				i.Status == 'Submitted' ||
				i.Status == 'Redelivery' ||
				i.Status == 'Splitted' ||
				i.Status == 'Merged' ||
				i.Status == 'Canceled'
		);
		if (itemsCanNotProcess.length == this.selectedItems.length) {
			this.env.showMessage('Cannot generate invoice from your chosen orders. Please only select approved orders!', 'warning');
			return;
		}

		itemsCanNotProcess.forEach((i) => {
			i.checked = false;
		});
		this.selectedItems = this.selectedItems.filter(
			(i) =>
				i.Status == 'Approved' ||
				i.Status == 'Scheduled' ||
				i.Status == 'Picking' ||
				i.Status == 'InCarrier' ||
				i.Status == 'InDelivery' ||
				i.Status == 'Delivered' ||
				i.Status == 'Debt' ||
				i.Status == 'Done'
		);

		let ids = this.selectedItems.map((m) => m.Id);

		// ids.forEach((id, index) => {
		//     this.arInvoiceProvider.read({ IDSaleOrder: id }).then(ar => {
		//         ids.splice(index, id);

		//     });
		// })

		for (let index = 0; index < ids.length; index++) {
			const id = ids[index];
			this.arInvoiceProvider.read({ IDSaleOrder: id }).then((ar) => {
				ids.splice(index, id);
			});
		}

		if (!ids) {
			this.env.showMessage('Your chosen orders have their invoices generated. Please check again!', 'warning');
		} else {
			//return new Promise(resolve => {
			this.EInvoiceServiceProvider.CreateARInvoiceFromSOs(ids)
				.then((resp: any) => {
					if (resp != '') {
						this.env.showMessage(resp[0].errorMsg, 'warning');
						this.submitAttempt = false;
					} else {
						this.env.showMessage('Invoice created!', 'success');
						//this.env.showTranslateMessage('Đã cập nhật hóa đơn điện tử thành công!', 'success');
						this.submitAttempt = false;
					}
				})
				.catch((err) => {
					console.log(err);
				});
			//})
		}
	}

	async createMergeARInvoice() {
		if (!this.pageConfig.canAddARInvoice) {
			return;
		}
		// i.IDStatus != 104
		let itemsCanNotProcess = this.selectedItems.filter((i) => i.Status != 'Approved');
		if (itemsCanNotProcess.length == this.selectedItems.length) {
			this.env.showMessage('Cannot generate merged invoice from your chosen orders. Please only select approved orders!', 'warning');
			return;
		}

		itemsCanNotProcess.forEach((i) => {
			i.checked = false;
		});
		// i.IDStatus == 104
		this.selectedItems = this.selectedItems.filter((i) => i.Status == 'Approved');

		let ids = this.selectedItems.map((m) => m.Id);

		//bổ sung các SO con (nếu có)
		ids.forEach((id) => {
			let subSOs = this.items.filter((ii) => ii.IDParent == id);

			if (subSOs) {
				subSOs.forEach((so) => {
					this.selectedItems.push(so);
					so.checked = true;
				});
			}
		});

		const modal = await this.modalController.create({
			component: SaleOrderMergeARInvoiceModalPage,
			cssClass: 'modal90',
			componentProps: {
				selectedOrders: this.selectedItems,
			},
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();

		this.selectedItems = [];
		this.refresh();
	}

	async createSplitARInvoices() {
		// let IDStatus = this.selectedItems[0].IDStatus;
		let Status = this.selectedItems[0].Status;
		// IDStatus != 104
		if (Status != 'Approved') {
			this.env.showMessage('Cannot split invoice from your chosen order. Please only select approved orders!', 'warning');
			return;
		}

		const modal = await this.modalController.create({
			component: SaleOrderARInvoiceModalPage,
			cssClass: 'modal90',
			componentProps: {
				selectedOrder: this.selectedItems[0],
			},
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();

		this.selectedItems = [];
		this.refresh();
	}

	toggleRow(i, event) {
		if (!i._HasSubOrder) {
			return;
		}
		event.stopPropagation();

		if (i._ShowSubItem) {
			this.hideSubRows(i);
		} else {
			let idx = this.items.indexOf(i, 0) + 1;

			if (i._SubItems) {
				this.items = [...this.items.slice(0, idx), ...i._SubItems, ...this.items.slice(idx)];
				i._ShowSubItem = true;
			} else {
				this.env
					.showLoading('Please wait for a few moments', this.pageProvider.read({ IDParent: i.Id }))
					.then((result: any) => {
						i._SubItems = result.data;
						i._SubItems.forEach((so) => {
							so._level = (i._level || 0) + 1;
							so._levels = new Array(so._level).fill(null);
							so._Status = this.statusList.find((s) => s.Code == so.Status);
						});
						this.items = [...this.items.slice(0, idx), ...i._SubItems, ...this.items.slice(idx)];
						i._ShowSubItem = true;
					})
					.catch((err) => {
						if (err.message != null) {
							this.env.showMessage(err.message, 'danger');
						} else {
							this.env.showMessage('Cannot extract data', 'danger');
						}
					});
			}
		}
	}

	hideSubRows(i) {
		i._ShowSubItem = false;
		let subItems = this.items.filter((d) => d.IDParent == i.Id);

		subItems.forEach((it) => {
			this.hideSubRows(it);
			const index = this.items.indexOf(it, 0);
			if (index > -1) {
				this.items.splice(index, 1);
				console.log(index);
			}
		});
	}

	masanImport() {
		if (this.submitAttempt) {
			this.env.showMessage('Order from Masan being imported, please wait till complete', 'primary');
			return;
		}
		this.submitAttempt = true;

		this.pageProvider.commonService
			.connect('GET', 'SALE/Order/MasanImport', {
				JobId: 1,
				Kho: this.masanImportParam.wareHouse,
				StartDate: this.masanImportParam.featureDate,
				EndDate: this.masanImportParam.featureDate,
			})
			.toPromise()
			.then((fileurl) => {
				this.submitAttempt = false;
				this.pageConfig.isShowSearch = true;
				this.query.Status = '';
				this.refresh();
				this.download(fileurl);
			})
			.catch((err) => {
				debugger;
				this.submitAttempt = false;
				if (err.error.Message != null && err.error != null) {
					this.env.showMessage(err.message, 'danger');
				} else {
					this.env.showMessage('Import error, please check again', 'danger');
				}
			});
	}

	@ViewChild('importfile2') importfile: any;
	onClickImport() {
		this.importfile.nativeElement.value = '';
		this.importfile.nativeElement.click();
	}

	async import2(event) {
		if (this.submitAttempt) {
			this.env.showMessage('File being imported, please wait till complete', 'primary');
			return;
		}
		this.submitAttempt = true;

		let wareHouse = this.masanImportParam.wareHouse;
		this.pageProvider.apiPath.postImport.method = 'UPLOAD';
		this.pageProvider.apiPath.postImport.url = function () {
			return ApiSetting.apiDomain('SALE/Order/ImportFile?Kho=' + wareHouse);
		};

		this.pageProvider
			.import(event.target.files[0])
			.then((response) => {
				this.submitAttempt = false;
				this.refresh();
				this.download(response);
			})
			.catch((err) => {
				this.submitAttempt = false;
				this.refresh();
				this.env.showMessage('Import error, please check again', 'danger');
			});
	}
}
