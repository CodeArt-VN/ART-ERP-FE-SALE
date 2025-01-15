import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { AlertController, LoadingController, ModalController, NavController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { EnvService } from 'src/app/services/core/env.service';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { SALE_OrderProvider } from 'src/app/services/static/services.service';
import { PopoverPage } from '../../SYS/popover/popover.page';
import { SaleOrderMergeModalPage } from '../sale-order-merge-modal/sale-order-merge-modal.page';
import { SaleOrderSplitModalPage } from '../sale-order-split-modal/sale-order-split-modal.page';

@Component({
  selector: 'app-sale-order-mobile',
  templateUrl: 'sale-order-mobile.page.html',
  styleUrls: ['sale-order-mobile.page.scss'],
  standalone: false,
})
export class SaleOrderMobilePage extends PageBase {
  statusList = [];

  ShowSubmit = false;
  ShowApprove = false;
  ShowDisapprove = false;
  ShowCancel = false;
  ShowDelete = false;

  selectedStatus = {
    Color: 'warning',
    Name: 'Đơn cần duyệt',
  };

  constructor(
    public pageProvider: SALE_OrderProvider,
    public modalController: ModalController,
    public popoverCtrl: PopoverController,
    public alertCtrl: AlertController,
    public scanner: BarcodeScannerService,
    public loadingController: LoadingController,
    public env: EnvService,
    public navCtrl: NavController,
    public location: Location,
  ) {
    super();
    // this.pageConfig.isShowSearch = true;
  }

  preLoadData(event) {
    this.query.IDOwner = this.pageConfig.canViewAllData ? 'all' : this.env.user.StaffID;
    this.query._saleman =
      this.query.IDOwner == 'all'
        ? null
        : {
            Id: this.env.user.StaffID,
            FullName: this.env.user.FullName,
          };

    this.sort.Id = 'Id';
    this.sortToggle('Id', true);
    this.query.Status = "['New','Unapproved','Submitted','Approved','Redelivery']";

    Promise.all([
      this.env.getStatus('SalesOrder'),
    ]).then((values: any) => {
      this.statusList = values[0];

      super.preLoadData(event);
    });
    
    
  }

  loadData(event) {
    this.pageProvider.apiPath.getList.url = function () {
      return ApiSetting.apiDomain('SALE/Order/MobileList');
    };
    super.loadData(event);
  }

  loadedData(event) {
    this.items.forEach((i) => {
      i.OrderTimeText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'hh:MM') : '';
      i.OrderDateText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'dd/mm/yy') : '';
      
      i.OriginalTotalText = lib.currencyFormat(i.OriginalTotalAfterTax);
      i._Status = this.statusList.find((s) => s.Code == i.Status);
    });
    super.loadedData(event);
  }

  changeSelection(i, e = null) {
    super.changeSelection(i, e);

    this.ShowSubmit = this.pageConfig.canSubmit;
    this.ShowApprove = this.pageConfig.canApprove;
    this.ShowDisapprove = this.pageConfig.canApprove;
    this.ShowCancel = this.pageConfig.canCancel;
    this.ShowDelete = this.pageConfig.canDelete;

    this.selectedItems.forEach((i) => {
      let notShowSubmitOrdersForApproval = [
        'Submitted',
        'Approved',
        'Scheduled',
        'Picking',
        'InCarrier',
        'InDelivery',
        'Delivered',
        'Redelivery',
        'Splitted',
        'Merged',
        'Debt',
        'Done',
        'Cancelled',
      ];
      if (notShowSubmitOrdersForApproval.indexOf(i.Status) > -1) {
        this.ShowSubmit = false;
      }

      let notShowApproveOrders = [
        'New',
        'Unapproved',
        'Approved',
        'Scheduled',
        'Picking',
        'InCarrier',
        'InDelivery',
        'Delivered',
        'Splitted',
        'Merged',
        'Debt',
        'Done',
        'Cancelled',
      ];
      if (notShowApproveOrders.indexOf(i.Status) > -1) {
        this.ShowApprove = false;
      }

      let notShowDisapproveOrders = [
        'New',
        'Unapproved',
        'Scheduled',
        'Picking',
        'InCarrier',
        'InDelivery',
        'Delivered',
        'Redelivery',
        'Splitted',
        'Merged',
        'Debt',
        'Done',
        'Cancelled',
      ];
      if (notShowDisapproveOrders.indexOf(i.Status) > -1) {
        this.ShowDisapprove = false;
      }

      let notShowCancelOrders = [
        'Approved',
        'Scheduled',
        'Picking',
        'InCarrier',
        'InDelivery',
        'Delivered',
        'Splitted',
        'Merged',
        'Debt',
        'Done',
        'Cancelled',
      ];
      if (notShowCancelOrders.indexOf(i.Status) > -1) {
        this.ShowCancel = false;
      }

      let notShowDelete = [
        'Submitted',
        'Approved',
        'Scheduled',
        'Picking',
        'InCarrier',
        'InDelivery',
        'Delivered',
        'Splitted',
        'Merged',
        'Debt',
        'Done',
      ];
      if (notShowDelete.indexOf(i.Status) > -1) {
        this.ShowDelete = false;
      }
    });
  }

  search(ev) {
    var val = ev.target.value;
    if (val == undefined) {
      val = '';
    }
    if (val.length > 2 || val == '') {
      this.query.CustomerName = val;
      this.query.Skip = 0;
      this.pageConfig.isEndOfData = false;
      this.loadData('search');
    }
  }

  resetQuery() {
    this.query.Status = "['New','Unapproved','Submitted','Approved','Redelivery']";
    this.query.IDOwner = this.pageConfig.canViewAllData ? 'all' : this.env.user.StaffID;
    this.query._saleman =
      this.query.IDOwner == 'all'
        ? null
        : {
            Id: this.env.user.StaffID,
            FullName: this.env.user.FullName,
          };

    this.query.OrderDateFrom = '';
    this.query.OrderDateTo = '';

    this.refresh();
  }

  showDetail(i) {
    if (
      i.Id == 0 ||
      !i.Status ||
      i.Status == 'New' ||
      i.Status == 'Unapproved' ||
      (this.pageConfig.canChangeCustomerOfReviewOrder && i.Status == 'Submitted')
    ) {
      this.nav('sale-order-mobile/' + i.Id, 'forward');
    } else {
      this.nav('sale-order-mobile-viewer/' + i.Id, 'forward');
    }
  }

  add() {
    let newSaleOrderMobile = {
      Id: 0,
    };
    this.showDetail(newSaleOrderMobile);
  }

  splitOrder(i) {
    this.selectedItems = [];
    this.selectedItems.push(i);
    this.splitSaleOrder();
  }

  async splitSaleOrder() {
    let status = this.selectedItems[0].Status;
    if (!(status == 'New' || status == 'Unapproved' || status == 'Submitted')) {
      this.env.showMessage(
        'Your selected order cannot be split. Please choose draft, new, pending for approval or disaaproved order',
        'warning',
      );
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

  async mergeSaleOrders() {
    let itemsCanNotProcess = this.selectedItems.filter(
      (i) => !(i.Status == 'New' || i.Status == 'Unapproved' || i.Status == 'Submitted'),
    );
    if (itemsCanNotProcess.length) {
      this.env.showMessage(
        'Your selected invoices cannot be combined. Please select new or disapproved invoice',
        'warning',
      );
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

  submitOrdersForApproval() {
    if (!this.pageConfig.canSubmitOrdersForApproval) {
      return;
    }
    this.alertCtrl
      .create({
        header: 'Gửi duyệt',
        //subHeader: '---',
        message:
          'Sau khi gửi duyệt, bạn không thể chỉnh sửa đơn hàng được nữa. Bạn có chắc muốn gửi duyệt tất cả đơn hàng?',
        buttons: [
          {
            text: 'Không',
            role: 'cancel',
            handler: () => {
              //console.log('Không xóa');
            },
          },
          {
            text: 'Gửi duyệt',
            cssClass: 'danger-btn',
            handler: () => {
              let publishEventCode = this.pageConfig.pageName;
              let apiPath = {
                method: 'POST',
                url: function () {
                  return ApiSetting.apiDomain('SALE/Order/SubmitSalesmanOrdersForApproval/');
                },
              };

              if (this.submitAttempt == false) {
                this.submitAttempt = true;

                this.pageProvider.commonService
                  .connect(apiPath.method, apiPath.url(), null)
                  .toPromise()
                  .then((savedItem: any) => {
                    if (publishEventCode) {
                      this.env.publishEvent({
                        Code: publishEventCode,
                      });
                    }
                    this.env.showMessage('Saving completed!', 'success');
                    this.submitAttempt = false;
                  })
                  .catch((err) => {
                    this.submitAttempt = false;
                    //console.log(err);
                  });
              }
            },
          },
        ],
      })
      .then((alert) => {
        alert.present();
      });
  }

  deleteItems() {
    let itemsCanNotDelete = this.selectedItems.filter((i) => !(i.Status == 'New' || i.Status == 'Unapproved'));
    if (itemsCanNotDelete.length == this.selectedItems.length) {
      this.env.showMessage(
        'Your selected invoices cannot be deleted. Please only delete new or disapproved invoice',
        'warning',
      );
    } else if (itemsCanNotDelete.length) {
      this.alertCtrl
        .create({
          header: 'Có ' + itemsCanNotDelete.length + ' đơn không thể xóa',
          //subHeader: '---',
          message:
            'Bạn có muốn bỏ qua và tiếp tục xóa ' + (this.selectedItems.length - itemsCanNotDelete.length) + ' đơn?',
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
                this.selectedItems = this.selectedItems.filter((i) => i.Status == 'New' || i.Status == 'Unapproved');
                super.deleteItems();
              },
            },
          ],
        })
        .then((alert) => {
          alert.present();
        });
    } else {
      super.deleteItems();
    }
  }

  currentPopover = null;
  async presentPopover(ev: any) {
    let popover = await this.popoverCtrl.create({
      component: PopoverPage,
      componentProps: {
        popConfig: {
          isShowDateRange: true,
          isShowSaleOrderStatusSelect: true,
          isShowStaffSelect: this.pageConfig.canViewAllData,
        },
        popData: {
          selectedBTNDate: this.query.selectedBTNDate,
          fromDate: this.query.OrderDateFrom,
          toDate: this.query._toDate,
          saleOrderStatus: this.query.Status,
          staff: this.query._saleman,
        },
      },
      event: ev,
      cssClass: 'sale-order-mobile-filter',
      translucent: true,
    });

    popover.onDidDismiss().then((result: any) => {
      //console.log(result);
      if (result.data) {
        this.query.OrderDateFrom = result.data.fromDate;
        this.query._toDate = result.data.toDate;
        this.query.OrderDateTo = result.data.toDate + ' 23:59:59';
        this.query.Status = result.data.saleOrderStatus;
        this.query.selectedBTNDate = result.data.selectedBTNDate;

        this.selectedStatus = result.data.selectedStatus;

        this.query._saleman = result.data.staff;
        if (this.query._saleman) {
          this.query.IDOwner = this.query._saleman.Id;
        } else {
          this.query.IDOwner = 'all';
        }

        this.refresh();
      }
      console.log(this.selectedStatus);
    });
    this.currentPopover = popover;
    return await popover.present();
  }

  dismissPopover() {
    if (this.currentPopover) {
      this.currentPopover.dismiss().then(() => {
        this.currentPopover = null;
      });
    }
  }

  scanning = false;
  async scanQRCode() {
    let code = await this.scanner.scan();
    let IDSaleOrder = '';
    if (code.indexOf('O:') == 0 || code.indexOf('000201') == 0) {
      if (code.indexOf('O:') == 0) {
        IDSaleOrder = code.replace('O:', '');
      } else {
        let qrContent = lib.readVietQRCode(code);
        IDSaleOrder = qrContent.message.replace('SO', '');
      }
    }
    if (IDSaleOrder) {
      this.query.CustomerName = IDSaleOrder;
      return;
    } else {
      this.env
        .showPrompt('Please scan valid QR code', 'Invalid QR code', null, 'Retry', 'Cancel')
        .then(() => {
          setTimeout(() => this.scanQRCode(), 0);
        })
        .catch(() => {});
    }
  }
}
