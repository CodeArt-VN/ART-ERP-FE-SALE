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
})
export class InventoryBalancePage extends PageBase {
  branchList = [];
  isShowBranch = false;
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
    public location: Location,
  ) {
    super();
    // this.pageConfig.isShowFeature = true;
    // this.pageConfig.isShowSearch = true;
  }

  loadData(event) {
      if (event == 'search') {
        this.commonService.connect('GET','SALE/Forecast/Balance',this.query, ).toPromise().then((result: any) => {
          if (result.length == 0) {
            this.pageConfig.isEndOfData = true;
          }
          this.items = result;
          this.loadedData(null);
        });
      } else {
        this.query.Skip = this.items.length;
        this.commonService.connect('GET','SALE/Forecast/Balance',this.query, ).toPromise().then((result: any) => {
            if (result.length == 0) {
              this.pageConfig.isEndOfData = true;
            }
            if (result.length > 0) {
              let firstRow = result[0];

              //Fix dupplicate rows
              if (this.items.findIndex((d) => d.Id == firstRow.Id) == -1) {
                this.items = [...this.items, ...result];
              }
            }
            this.loadedData(event);
          })
          .catch((err) => {
            if (err.message != null) {
              this.env.showMessage(err.message, 'danger');
            } else {
              this.env.showMessage('Cannot extract data', 'danger');
            }

            this.loadedData(event);
          });
   // super.loadData(event);
  }
  }
  loadedData(event) {
    super.loadedData(event);
    this.isShowBranch = false;
    let warehouses = new Set<number>();
    this.items.forEach(i=> {
      let branch = this.env.branchList.find(d=> d.Id == i.IDBranch);
      if(branch){
        i.BranchName = branch.Name;
        if(branch.Type == 'Warehouse') warehouses.add(branch.Id);
      }
    })
    if(warehouses.size >1){
      this.isShowBranch = true;
    }
  }

}
