import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { SALE_OrderProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { SalemanDebtModalPage } from '../saleman-debt-modal/saleman-debt-modal.page';

@Component({
    selector: 'app-saleman-debt',
    templateUrl: 'saleman-debt.page.html',
    styleUrls: ['saleman-debt.page.scss'],
    standalone: false
})
export class SalemanDebtPage extends PageBase {
  branchList = [];

  constructor(
    public pageProvider: SALE_OrderProvider,

    public modalController: ModalController,
    public popoverCtrl: PopoverController,
    public alertCtrl: AlertController,
    public loadingController: LoadingController,
    public env: EnvService,
    public navCtrl: NavController,
    public location: Location,
  ) {
    super();
    // this.pageConfig.isShowFeature = true;
    this.pageConfig.isShowSearch = true;
  }

  preLoadData(event) {
    this.query.IDOwner = this.pageConfig.canViewAllData ? 'all' : this.env.user.StaffID;
    this.query.ShowDebt = 'All';
    //this.sort.OrderDate = 'OrderDate';
    this.sortToggle('OrderDate', true);
    super.preLoadData(event);
  }

  loadData(event) {
    this.pageProvider.apiPath.getList.url = function () {
      return ApiSetting.apiDomain('SALE/Order/SalemanDebtList');
    };
    super.loadData(event);
  }

  loadedData(event) {
    this.items.forEach((i) => {
      i.OrderTimeText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'hh:MM') : '';
      i.OrderDateText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'dd/mm/yy') : '';
      i.Query = i.OrderDate ? lib.dateFormat(i.OrderDate, 'yyyy-mm-dd') : '';
      i.DiscountFromSalesmanText = lib.currencyFormat(i.DiscountFromSalesman);
      i.ReceivedDiscountFromSalesmanText = lib.currencyFormat(i.ReceivedDiscountFromSalesman);
    });
    super.loadedData(event);
  }

  showDetail(i) {
    this.navCtrl.navigateForward('/sale-order/' + i.Id);
  }

  async createReceipt() {
    const modal = await this.modalController.create({
      component: SalemanDebtModalPage,
      cssClass: 'modal-saleman-debt',
      componentProps: {
        selectedOrders: this.selectedItems,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      this.selectedItems = [];
      this.refresh();
    }
  }
}
