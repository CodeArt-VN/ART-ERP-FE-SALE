import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { PURCHASE_QuotationProvider, SALE_QuotationProvider, SYS_ConfigProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { lib } from 'src/app/services/static/global-functions';
import { ApiSetting } from 'src/app/services/static/api-setting';
@Component({
	selector: 'app-sale-quotation',
	templateUrl: 'sale-quotation.page.html',
	styleUrls: ['sale-quotation.page.scss'],
	standalone: false,
})
export class SaleQuotationPage extends PageBase {
	statusList: any = [];
	constructor(
		public pageProvider: SALE_QuotationProvider,
		public sysConfigProvider: SYS_ConfigProvider,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location
	) {
		super();
	}

	preLoadData(event) {
		super.preLoadData(event);
		this.query.Type = 'PurchaseRequest';
		if (!this.sort.Id) {
			this.sort.Id = 'Id';
			this.sortToggle('Id', true);
		}
		let sysConfigQuery = ['PRUsedApprovalModule'];
		Promise.all([this.env.getStatus('PurchaseQuotation'), this.sysConfigProvider.read({ Code_in: sysConfigQuery })]).then((values) => {
			this.statusList = values[0];
			values[1]['data'].forEach((e) => {
				if ((e.Value == null || e.Value == 'null') && e._InheritedConfig) {
					e.Value = e._InheritedConfig.Value;
				}
				this.pageConfig[e.Code] = JSON.parse(e.Value);
			});
			super.preLoadData(event);
		});
	}

	loadedData(event) {
		this.items.forEach((i) => {
			i.RequestBranchName = this.env.branchList.find((d) => d.Id == i.IDRequestBranch)?.Name;
			i.StatusText = lib.getAttrib(i.Status, this.statusList, 'Name', '--', 'Code');
			i.StatusColor = lib.getAttrib(i.Status, this.statusList, 'Color', 'dark', 'Code');
		});
		super.loadedData(event);
		console.log(this.items);
	}

	confirm() {
		let Ids = this.selectedItems.map((d) => d.Id);
		this.env.showPrompt(null, null, 'Do you want to confirm?').then((_) => {
			this.env
				.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('POST', 'SALE/Quotation/Confirm/', { Ids: Ids }).toPromise())
				.then((x) => {
					this.env.showMessage('Confirmed', 'success');
					this.refresh();
				})
				.catch((x) => {
					this.env.showMessage('Failed', 'danger');
				});
		});
	}

	submitForApproval() {
		if (this.submitAttempt) return;
		this.env
			.showPrompt(
				{
					code: 'Bạn có chắc muốn gửi duyệt {{value}} báo giá đang chọn?',
					value: this.selectedItems.length,
				},
				null,
				{ code: 'Gửi duyệt {{value}} báo giá', value: this.selectedItems.length }
			)
			.then((_) => {
				this.submitAttempt = true;
				let postDTO = { Ids: [] };
				postDTO.Ids = this.selectedItems.map((e) => e.Id);

				this.pageProvider.commonService
					.connect('POST', ApiSetting.apiDomain('SALE/Quotation/Submit/'), postDTO)
					.toPromise()
					.then((savedItem: any) => {
						this.env.publishEvent({
							Code: this.pageConfig.pageName,
						});
						this.submitAttempt = false;

						if (savedItem > 0) {
							this.env.showMessage('{{value}} quotations sent for approval', 'success', savedItem);
						} else {
							this.env.showMessage('Please check again, quotations must have at least 1 item to be approved', 'warning');
						}
					})
					.catch((err) => {
						this.submitAttempt = false;
						console.log(err);
					});
			});
	}

	approve() {
		if (this.submitAttempt) return;

		this.env
			.showPrompt({ code: 'Bạn có chắc muốn DUYỆT {{value}} báo giá đang chọn?', value: this.selectedItems.length }, null, {
				code: 'Duyệt {{value}} báo giá',
				value: this.selectedItems.length,
			})
			.then((_) => {
				this.submitAttempt = true;
				let postDTO = { Ids: [] };
				postDTO.Ids = this.selectedItems.map((e) => e.Id);

				this.pageProvider.commonService
					.connect('POST', ApiSetting.apiDomain('SALE/Quotation/Approve/'), postDTO)
					.toPromise()
					.then((savedItem: any) => {
						this.env.publishEvent({
							Code: this.pageConfig.pageName,
						});
						this.submitAttempt = false;

						if (savedItem > 0) {
							this.env.showMessage('{{value}} quotations approved', 'success', savedItem);
						} else {
							this.env.showMessage('Please check again, quotations must have at least 1 item to be approved', 'warning');
						}
					})
					.catch((err) => {
						this.submitAttempt = false;
						console.log(err);
					});
			});
	}

	disapprove() {
		if (this.submitAttempt) return;
		this.env
			.showPrompt({ code: 'Bạn có chắc muốn không duyệt {{value}} báo giá đang chọn?', value: this.selectedItems.length }, null, {
				code: 'Không phê duyệt {{value}} báo giá',
				value: this.selectedItems.length,
			})
			.then((_) => {
				this.submitAttempt = true;
				let postDTO = { Ids: [] };
				postDTO.Ids = this.selectedItems.map((e) => e.Id);

				this.pageProvider.commonService
					.connect('POST', ApiSetting.apiDomain('SALE/Quotation/Disapprove/'), postDTO)
					.toPromise()
					.then((savedItem: any) => {
						this.env.publishEvent({
							Code: this.pageConfig.pageName,
						});
						this.env.showMessage('Saving completed!', 'success');
						this.submitAttempt = false;
					})
					.catch((err) => {
						this.submitAttempt = false;
						console.log(err);
					});
			});
	}

	// cancel() {
	// 	if (this.submitAttempt) return;
	// 	this.env
	// 		.showPrompt({ code: 'Bạn có chắc muốn HỦY {{value}} báo giá đang chọn?', value: this.selectedItems.length }, null, {
	// 			code: 'Huỷ {{value}} báo giá',
	// 			value: this.selectedItems.length,
	// 		})
	// 		.then((_) => {
	// 			this.submitAttempt = true;
	// 			let postDTO = { Ids: [] };
	// 			postDTO.Ids = this.selectedItems.map((e) => e.Id);

	// 			this.pageProvider.commonService
	// 				.connect('POST', ApiSetting.apiDomain('SALE/Quotation/Cancel/'), postDTO)
	// 				.toPromise()
	// 				.then((savedItem: any) => {
	// 					this.env.publishEvent({
	// 						Code: this.pageConfig.pageName,
	// 					});
	// 					this.env.showMessage('Saving completed!', 'success');
	// 					this.submitAttempt = false;
	// 				})
	// 				.catch((err) => {
	// 					this.submitAttempt = false;
	// 					console.log(err);
	// 				});
	// 		});
	// }
}
