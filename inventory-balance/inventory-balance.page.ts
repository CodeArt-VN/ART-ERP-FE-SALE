import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { SALE_OrderProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { CommonService } from 'src/app/services/core/common.service';
import { ActivatedRoute, Route } from '@angular/router';

@Component({
	selector: 'app-inventory-balance',
	templateUrl: 'inventory-balance.page.html',
	styleUrls: ['inventory-balance.page.scss'],
	standalone: false,
})
export class InventoryBalancePage extends PageBase {
	constructor(
		//public pageProvider: SALE_OrderProvider,
		public commonService: CommonService,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public route: ActivatedRoute,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location
	) {
		super();
		// this.pageConfig.isShowFeature = true;
		// this.pageConfig.isShowSearch = true;
	}

	loadData(event) {
		delete this.query.IDBranch;
		this.query.Skip = event == 'search' ? 0 : this.items.length;
		this.commonService
			.connect('GET', 'SALE/Inventory/Balance', this.query)
			.toPromise()
			.then((result: any) => {
				const payload = result || {};
				const rows = Array.isArray(result) ? result : payload.Items || [];
				if (this.query.Skip == 0) {
					this.items = rows;
				} else if (rows.length > 0) {
					const seen = new Set(this.items.map((d) => d.ItemId));
					const fresh = rows.filter((row) => !seen.has(row.ItemId));
					if (fresh.length > 0) this.items = [...this.items, ...fresh];
				}
				this.markEndOfDataIfLastPage(rows.length);
				this.loadedData(event);
			})
			.catch((err) => {
				this.items = [];
				if (err.message != null) {
					this.env.showMessage(err.message, 'danger');
				} else {
					this.env.showMessage('Cannot extract data', 'danger');
				}
				this.loadedData(event);
			});
	}
	loadedData(event) {
		super.loadedData(event);
		this.items.forEach((i) => {
			(i.Warehouses || []).forEach((warehouse) => {
				if (warehouse.BranchName) return;
				const branch = this.env.branchList.find((d) => d.Id == warehouse.IDBranch);
				if (branch) warehouse.BranchName = branch.Name;
			});
		});
	}
}
