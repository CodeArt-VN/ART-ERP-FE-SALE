import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { SALE_OrderProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';

@Component({
	selector: 'app-receivable-debt',
	templateUrl: 'receivable-debt.page.html',
	styleUrls: ['receivable-debt.page.scss'],
	standalone: false,
})
export class ReceivableDebtPage extends PageBase {
	branchList = [];

	masanImportParam: any = {
		featureDate: lib.dateFormat(new Date(), 'yyyy-mm-dd'),
		wareHouse: 'KF1652T01',
	};

	constructor(
		public pageProvider: SALE_OrderProvider,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location
	) {
		super();
		// this.pageConfig.isShowFeature = true;
		this.pageConfig.isShowSearch = true;
	}

	preLoadData(event) {
		this.query.IDOwner = this.pageConfig.canViewAllData ? 'all' : this.env.user.StaffID;

		this.query.ShowDebt = 'All';
		// this.query.ShowDebt = 'IsInProgress'; //Đang đi thu nợ
		// this.query.ShowDebt = 'IsNotInProgress';

		//this.query.AnyShipment = true;
		//this.query.OrderDate = this.pageConfig.canViewAllData? 'all' : new Date();
		//this.query.IDStatus = '[1,2,3]';

		this.sort.Id = 'Id';
		this.sortToggle('Id', true);

		super.preLoadData(event);
	}

	loadData(event) {
		this.pageProvider.apiPath.getList.url = function () {
			return ApiSetting.apiDomain('SALE/Order/DebtList');
		};
		super.loadData(event);
	}

	loadedData(event) {
		this.items.forEach((i) => {
			i.OrderTimeText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'hh:MM') : '';
			i.OrderDateText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'dd/mm/yy') : '';
			i.Query = i.OrderDate ? lib.dateFormat(i.OrderDate, 'yyyy-mm-dd') : '';
			i.TotalAfterTaxText = lib.currencyFormat(i.TotalAfterTax);
			i.DebtText = lib.currencyFormat(i.Debt);
		});
		super.loadedData(event);
	}

	showDetail(i) {
		this.navCtrl.navigateForward('/sale-order/' + i.Id);
	}

	add() {
		let newReceivableDebt = {
			Id: 0,
		};
		this.showDetail(newReceivableDebt);
	}
}
