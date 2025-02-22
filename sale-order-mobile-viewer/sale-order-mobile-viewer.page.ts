import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { SALE_OrderProvider, CRM_ContactProvider, SALE_OrderDetailProvider, WMS_ItemProvider, HRM_StaffProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { NgSelectConfig } from '@ng-select/ng-select';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { SaleOrderMobileAddContactModalPage } from '../sale-order-mobile-add-contact-modal/sale-order-mobile-add-contact-modal.page';

@Component({
	selector: 'app-sale-order-mobile-viewer',
	templateUrl: './sale-order-mobile-viewer.page.html',
	styleUrls: ['./sale-order-mobile-viewer.page.scss'],
	standalone: false,
})
export class SaleOrderMobileViewerPage extends PageBase {
	constructor(
		public pageProvider: SALE_OrderProvider,
		public orderDetailProvider: SALE_OrderDetailProvider,
		public contactProvider: CRM_ContactProvider,
		public itemProvider: WMS_ItemProvider,
		public staffPovider: HRM_StaffProvider,

		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,
		public modalController: ModalController,
		public alertCtrl: AlertController,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController,
		public commonService: CommonService,
		private config: NgSelectConfig
	) {
		super();
		this.item = {};
		this.item.Customer = {};
		this.item.Status = {};

		this.pageConfig.isDetailPage = true;
		this.id = this.route.snapshot.paramMap.get('id');
	}

	loadData(event) {
		super.loadData();
	}

	loadedData(event) {
		if (this.item.Id) {
			this.item.OrderDateText = lib.dateFormat(this.item.OrderDate, 'hh:MM dd/mm/yyyy');
			this.item.TotalAfterTaxText = lib.currencyFormat(this.item.TotalAfterTax);
			this.item.OriginalTotalAfterTaxText = lib.currencyFormat(this.item.OriginalTotalAfterTax);

			this.orderDetailProvider.apiPath.getList.url = function () {
				return ApiSetting.apiDomain('SALE/OrderDetail/List');
			};
			this.orderDetailProvider.read({ IDOrder: this.id }).then((result: any) => {
				this.item.OrderLines = result.data;
				this.item.OrderLines.forEach((line) => {
					line._UoMPrice = line.UoMPrice;
					line.Discount1Text = lib.currencyFormat(line.Discount1);
					line.Discount2Text = lib.currencyFormat(line.Discount2);
				});
				super.loadedData(event, true);
			});

			if (this.checkIsEditableShipmentDetail()) {
				this.item.DA_GIAO_HANG = false;
			} else {
				this.item.DA_GIAO_HANG = true;
			}
		} else {
			this.item.OrderLines = [];
			super.loadedData(event, true);
		}

		if (this.item.IDContact) {
			this.contactProvider.getAnItem(this.item.IDContact).then((contact: any) => {
				this.item.Customer = contact;
			});
		}
		if (this.item.IDContact) {
			this.item.Status = this.env.statusList.find((d) => d.Id == this.item.IDStatus);
		}
	}

	checkIsEditableShipmentDetail() {
		if (this.item.IsDebt) {
			return false;
		}

		let editableStatus = [
			314, //	Đã phân tài	32
			315, //	Đã giao đơn vị vận chuyển	32
			316, //	Đang lấy hàng	32
			317, //	Đang đóng gói	32
			318, //	Đang giao hàng	32
			// 319	, //	Đã giao hàng	32
			// 307	, //	Khách hẹn giao lại	32
			// 308	, //	Không liên lạc được	32
			// 309	, //	Khách không nhận do hàng lỗi	32
			// 310	, //	Khách không nhận do giá	32
			// 311	, //	Khách không nhận	32
			// 312	, //	Khách không nhận do khách hết tiền	32
			// 313	, //	Không giao được - lý do khác	32
		];
		return editableStatus.indexOf(this.item.IDStatus) > -1;
	}
}
