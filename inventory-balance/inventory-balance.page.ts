import { Component } from '@angular/core';
import { ModalController, NavController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { CommonService } from 'src/app/services/core/common.service';
import { ActivatedRoute } from '@angular/router';
import { applyWarehouseNames, balanceRequestQuery, hasInStock, isOutOfStock, showsSearchSpinner, warehouseCatalogId, withDefaultInStock } from './inventory-balance.util';

@Component({
	selector: 'app-inventory-balance',
	templateUrl: 'inventory-balance.page.html',
	styleUrls: ['inventory-balance.page.scss'],
	standalone: false,
})
export class InventoryBalancePage extends PageBase {
	isOutOfStock = isOutOfStock;
	warehouseCatalog: any[] = [];

	constructor(
		public commonService: CommonService,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public route: ActivatedRoute,
		public env: EnvService,
		public navCtrl: NavController
	) {
		super();
		this.pageConfig.isShowSearch = true;
		this.query = withDefaultInStock(this.query);
	}

	preLoadData(event = null) {
		this.query = withDefaultInStock(this.query);
		super.preLoadData(event);
	}

	toggleInStock() {
		this.pageConfig.isEndOfData = false;
		this.query = {
			...this.query,
			inStockOnly: this.query?.inStockOnly ? null : true,
		};
		this.loadData('search');
	}

	loadData(event) {
		if (showsSearchSpinner(event)) this.pageConfig.showSpinner = true;
		delete this.query.IDBranch;
		this.query = {
			...this.query,
			Skip: event == 'search' ? 0 : this.items.length,
		};
		this.commonService
			.connect('GET', 'SALE/Inventory/Balance', balanceRequestQuery(this.query))
			.toPromise()
			.then((result: any) => {
				const payload = result && !Array.isArray(result) ? result : { Items: result || [] };
				const incoming = Array.isArray(payload.Warehouses) ? payload.Warehouses : [];
				if (this.query.Skip == 0) {
					this.warehouseCatalog = incoming;
				} else {
					const seen = new Set(this.warehouseCatalog.map((warehouse) => warehouseCatalogId(warehouse)));
					incoming.forEach((warehouse) => {
						if (!seen.has(warehouseCatalogId(warehouse))) this.warehouseCatalog.push(warehouse);
					});
				}
				let rows = applyWarehouseNames(payload.Items || [], this.warehouseCatalog);
				if (this.query.inStockOnly) rows = rows.filter((row) => hasInStock(row));
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
