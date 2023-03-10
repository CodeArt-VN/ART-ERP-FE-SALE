import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SALE_OrderProvider, SHIP_ShipmentProvider, SHIP_VehicleProvider, SYS_StatusProvider, AC_ARInvoiceProvider, CRM_ContactProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { SaleOrderSplitModalPage } from '../sale-order-split-modal/sale-order-split-modal.page';
import { SaleOrderMergeModalPage } from '../sale-order-merge-modal/sale-order-merge-modal.page';
import { SaleOrderARInvoiceModalPage } from '../sale-order-create-arinvoice-modal/sale-order-create-arinvoice-modal.page';
import { SaleOrderMergeARInvoiceModalPage } from '../sale-order-merge-arinvoice-modal/sale-order-merge-arinvoice-modal.page';

import { EInvoiceService } from 'src/app/services/einvoice.service';

@Component({
    selector: 'app-sale-order',
    templateUrl: 'sale-order.page.html',
    styleUrls: ['sale-order.page.scss']
})
export class SaleOrderPage extends PageBase {
    branchList = [];
    statusList = [];
    vehicleList = [];
    shipmentList = [];
    contact: any = {};

    segmentView = 's1';
    shipmentQuery: any = { IDStatus: 301, DeliveryDate: '', SortBy: 'IDVehicle' };

    masanImportParam: any = {
        featureDate: lib.dateFormat(new Date, 'yyyy-mm-dd'),
        wareHouse: 'KF1652T01',
    };

    constructor(
        public pageProvider: SALE_OrderProvider,
        public branchProvider: BRA_BranchProvider,
        public statusProvider: SYS_StatusProvider,
        public shipmentProvider: SHIP_ShipmentProvider,
        public vehicleProvider: SHIP_VehicleProvider,
        public arInvoiceProvider: AC_ARInvoiceProvider,
        public contactProvider: CRM_ContactProvider,

        public EInvoiceServiceProvider: EInvoiceService,

        public modalController: ModalController,
        public alertCtrl: AlertController,
        public loadingController: LoadingController,
        public env: EnvService,
        public navCtrl: NavController,
        public location: Location,
    ) {
        super();
        // this.pageConfig.isShowFeature = true;
        this.pageConfig.isShowSearch = false;
        let today = new Date;
        today.setDate(today.getDate() + 1);
        this.shipmentQuery.DeliveryDate = lib.dateFormat(today, 'yyyy-mm-dd');
    }

    events(e) {
        if (e.Code == 'shipment') {
            this.loadShipmentList();
            this.refresh();
        }
    }

    preLoadData(event) {
        this.query.IDOwner = this.pageConfig.canViewAllData ? 'all' : this.env.user.StaffID;
        //this.query.OrderDate = this.pageConfig.canViewAllData? 'all' : new Date();
        //this.query.IDStatus = '[1,2,3]';
        if (!this.sort.Id) {
            this.sort.Id = 'Id';
            this.sortToggle('Id', true);
        }
        if (!this.query.IDStatus) {
            this.query.IDStatus = '[101,102,103,104,110]';
        }


        this.statusProvider.read({ IDParent: 1 }).then(response => {
            this.statusList = response['data'];
            super.preLoadData(event);

        });

        this.loadVehicleList();
        this.loadShipmentList();

    }

    loadData(event) {
        this.pageProvider.apiPath.getList.url = function () { return ApiSetting.apiDomain("SALE/Order/List") };
        super.loadData(event);
    }

    loadedData(event) {
        this.items.forEach(i => {
            i.OrderTimeText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'hh:MM') : '';
            i.OrderDateText = i.OrderDate ? lib.dateFormat(i.OrderDate, 'dd/mm/yy') : '';
            i.Query = i.OrderDate ? lib.dateFormat(i.OrderDate, 'yyyy-mm-dd') : '';
            i.OriginalTotalAfterTaxText = lib.currencyFormat(i.OriginalTotalAfterTax);
            i.TotalAfterTaxText = lib.currencyFormat(i.TotalAfterTax);
        });
        super.loadedData(event);
    }

    loadVehicleList() {
        this.vehicleProvider.read({ IgnoredBranch: true }).then(response => {
            this.vehicleList = response['data'];
            this.vehicleList.forEach(v => {
                if (v.ShipperName) {
                    v.Name = v.Name + ' - ' + v.ShipperName;
                }

            });
        });
    }

    loadShipmentList() {
        this.shipmentProvider.apiPath.getList.url = function () { return ApiSetting.apiDomain("SHIP/Shipment/List") };
        this.shipmentProvider.read(this.shipmentQuery).then((resp: any) => {
            this.shipmentList = resp.data;
            this.shipmentList.forEach(i => {
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

    masanImport() {
        if (this.submitAttempt) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.importing-masan', 'primary');
            return;
        }
        this.submitAttempt = true;
        this.env.publishEvent({ Code: 'app:ShowAppMessage', IsShow: true, Id: 'MasanImport', Icon: 'flash', IsBlink: true, Color: 'danger', Message: '??ang import ????n Masan' });

        this.pageProvider.commonService.connect('GET', 'SALE/Order/MasanImport', {
            JobId: 1,
            Kho: this.masanImportParam.wareHouse,
            StartDate: this.masanImportParam.featureDate,
            EndDate: this.masanImportParam.featureDate
        }).toPromise().then((fileurl) => {
            this.submitAttempt = false;
            this.env.publishEvent({ Code: 'app:ShowAppMessage', IsShow: false, Id: 'MasanImport' });
            this.pageConfig.isShowSearch = true;
            this.query.IDStatus = '';
            this.refresh()
            this.download(fileurl);
        })
            .catch(err => {
                debugger;
                this.submitAttempt = false;
                this.env.publishEvent({ Code: 'app:ShowAppMessage', IsShow: false, Id: 'MasanImport' });
                //this.refresh();
                if (err.error.Message != null && err.error != null) {
                    this.env.showMessage(err.message, 'danger');
                }
                else {
                    this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.import-error', 'danger');
                }
            })
    }

    @ViewChild('importfile2') importfile: any;
    onClickImport() {
        this.importfile.nativeElement.value = "";
        this.importfile.nativeElement.click();
    }

    async import2(event) {
        if (this.submitAttempt) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.importing', 'primary');
            return;
        }
        this.submitAttempt = true;
        this.env.publishEvent({ Code: 'app:ShowAppMessage', IsShow: true, Id: 'FileImport', Icon: 'flash', IsBlink: true, Color: 'danger', Message: '??ang import' });

        let wareHouse = this.masanImportParam.wareHouse;
        this.pageProvider.apiPath.postImport.method = "UPLOAD";
        this.pageProvider.apiPath.postImport.url = function () { return ApiSetting.apiDomain("SALE/Order/ImportFile?Kho=" + wareHouse) };

        this.pageProvider.import(event.target.files[0])
            .then((response) => {
                this.submitAttempt = false;
                this.env.publishEvent({ Code: 'app:ShowAppMessage', IsShow: false, Id: 'FileImport' });
                this.refresh();
                this.download(response);

            })
            .catch(err => {
                this.submitAttempt = false;
                this.env.publishEvent({ Code: 'app:ShowAppMessage', IsShow: false, Id: 'FileImport' });
                this.refresh();
                this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.import-error', 'danger');
            })


    }

    async splitSaleOrder() {
        let IDStatus = this.selectedItems[0].Status.IDStatus;
        if (!(IDStatus == 101 || IDStatus == 102 || IDStatus == 103)) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-split', 'warning');
            return;
        }
        const modal = await this.modalController.create({
            component: SaleOrderSplitModalPage,
            swipeToClose: true,
            cssClass: 'modal90',
            componentProps: {
                'selectedOrder': this.selectedItems[0]
            }
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();

        this.selectedItems = [];
        this.refresh();
    }

    async mergeSaleOrders() {
        let itemsCanNotProcess = this.selectedItems.filter(i => !(i.Status.IDStatus == 101 || i.Status.IDStatus == 102 || i.Status.IDStatus == 103));
        if (itemsCanNotProcess.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-merge', 'warning');
            return;
        }

        const modal = await this.modalController.create({
            component: SaleOrderMergeModalPage,
            swipeToClose: true,
            cssClass: 'modal-merge-orders',
            componentProps: {
                'selectedOrders': this.selectedItems
            }
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();

        this.selectedItems = [];
        this.refresh();
    }

    submitOrdersForApproval() {
        if (!this.pageConfig.canApprove) {
            return;
        }

        let itemsCanNotProcess = this.selectedItems.filter(i => !(i.Status.IDStatus == 101 || i.Status.IDStatus == 102));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-send-approve-new-draft-disapprove-only', 'warning');
        }
        else {
            itemsCanNotProcess.forEach(i => {
                i.checked = false;
            });
            this.selectedItems = this.selectedItems.filter(i => (i.Status.IDStatus == 101 || i.Status.IDStatus == 102));

            this.alertCtrl.create({
                header: 'G???i duy???t ' + this.selectedItems.length + ' ????n h??ng',
                //subHeader: '---',
                message: 'B???n ch???c mu???n g???i duy???t ' + this.selectedItems.length + ' ????n h??ng ??ang ch???n?',
                buttons: [
                    {
                        text: 'Kh??ng',
                        role: 'cancel',
                        handler: () => {
                            //console.log('Kh??ng x??a');
                        }
                    },
                    {
                        text: 'G???i duy???t',
                        cssClass: 'danger-btn',
                        handler: () => {

                            let publishEventCode = this.pageConfig.pageName;
                            let apiPath = {
                                method: "POST",
                                url: function () { return ApiSetting.apiDomain("SALE/Order/SubmitOrdersForApproval/") }
                            };

                            if (this.submitAttempt == false) {
                                this.submitAttempt = true;

                                let postDTO = { Ids: [] };
                                postDTO.Ids = this.selectedItems.map(e => e.Id);

                                this.pageProvider.commonService.connect(apiPath.method, apiPath.url(), postDTO).toPromise()
                                    .then((savedItem: any) => {
                                        if (publishEventCode) {
                                            this.env.publishEvent({ Code: publishEventCode });
                                        }
                                        this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.save-complete', 'warning');
                                        this.submitAttempt = false;

                                    }).catch(err => {
                                        this.submitAttempt = false;
                                        //console.log(err);
                                    });
                            }

                        }
                    }
                ]
            }).then(alert => {
                alert.present();
            })
        }
    }

    approveOrders() {
        if (!this.pageConfig.canApprove) {
            return;
        }

        let itemsCanNotProcess = this.selectedItems.filter(i => !(i.Status.IDStatus == 103 || i.Status.IDStatus == 110));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-approve-pending-only', 'warning');
        }
        else {
            itemsCanNotProcess.forEach(i => {
                i.checked = false;
            });
            this.selectedItems = this.selectedItems.filter(i => (i.Status.IDStatus == 103 || i.Status.IDStatus == 110));

            this.alertCtrl.create({
                header: 'Duy???t ' + this.selectedItems.length + ' ????n h??ng',
                //subHeader: '---',
                message: 'B???n ch???c mu???n x??c nh???n ' + this.selectedItems.length + ' ????n h??ng ??ang ch???n?',
                buttons: [
                    {
                        text: 'Kh??ng',
                        role: 'cancel',
                        handler: () => {
                            //console.log('Kh??ng x??a');
                        }
                    },
                    {
                        text: 'Duy???t',
                        cssClass: 'danger-btn',
                        handler: () => {

                            let publishEventCode = this.pageConfig.pageName;
                            let apiPath = {
                                method: "POST",
                                url: function () { return ApiSetting.apiDomain("SALE/Order/ApproveOrders/") }
                            };

                            if (this.submitAttempt == false) {
                                this.submitAttempt = true;

                                let postDTO = { Ids: [] };
                                postDTO.Ids = this.selectedItems.map(e => e.Id);

                                this.pageProvider.commonService.connect(apiPath.method, apiPath.url(), postDTO).toPromise()
                                    .then((savedItem: any) => {
                                        if (publishEventCode) {
                                            this.env.publishEvent({ Code: publishEventCode });
                                        }
                                        this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.save-complete', 'success');
                                        this.submitAttempt = false;

                                    }).catch(err => {
                                        this.submitAttempt = false;
                                        //console.log(err);
                                    });
                            }

                        }
                    }
                ]
            }).then(alert => {
                alert.present();
            })
        }
    }

    disapproveOrders() {
        if (!this.pageConfig.canApprove) {
            return;
        }

        let itemsCanNotProcess = this.selectedItems.filter(i => !(i.Status.IDStatus == 103 || i.Status.IDStatus == 104));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-disapprove-pending-approved-only', 'warning');
        }
        else {
            itemsCanNotProcess.forEach(i => {
                i.checked = false;
            });
            this.selectedItems = this.selectedItems.filter(i => (i.Status.IDStatus == 103 || i.Status.IDStatus == 104));

            this.alertCtrl.create({
                header: 'Tr??? l???i ' + this.selectedItems.length + ' ????n h??ng',
                //subHeader: '---',
                message: 'B???n ch???c mu???n tr??? l???i ' + this.selectedItems.length + ' ????n h??ng ??ang ch???n?',
                buttons: [
                    {
                        text: 'Kh??ng',
                        role: 'cancel',
                        handler: () => {
                            //console.log('Kh??ng x??a');
                        }
                    },
                    {
                        text: 'Tr??? l???i',
                        cssClass: 'danger-btn',
                        handler: () => {

                            let publishEventCode = this.pageConfig.pageName;
                            let apiPath = {
                                method: "POST",
                                url: function () { return ApiSetting.apiDomain("SALE/Order/DisapproveOrders/") }
                            };

                            if (this.submitAttempt == false) {
                                this.submitAttempt = true;

                                let postDTO = { Ids: [] };
                                postDTO.Ids = this.selectedItems.map(e => e.Id);

                                this.pageProvider.commonService.connect(apiPath.method, apiPath.url(), postDTO).toPromise()
                                    .then((savedItem: any) => {
                                        if (publishEventCode) {
                                            this.env.publishEvent({ Code: publishEventCode });
                                        }
                                        this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.save-complete', 'success');
                                        this.submitAttempt = false;

                                    }).catch(err => {
                                        this.submitAttempt = false;
                                        //console.log(err);
                                    });
                            }

                        }
                    }
                ]
            }).then(alert => {
                alert.present();
            })
        }
    }

    cancelOrders() {

        if (!this.pageConfig.canCancel) {
            return;
        }

        let itemsCanNotProcess = this.selectedItems.filter(i => !(i.Status.IDStatus == 101 || i.Status.IDStatus == 102 || i.Status.IDStatus == 103 || i.Status.IDStatus == 110));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-cancel-pending-draft-only', 'warning');
        }
        else {
            itemsCanNotProcess.forEach(i => {
                i.checked = false;
            });
            this.selectedItems = this.selectedItems.filter(i => (i.Status.IDStatus == 101 || i.Status.IDStatus == 102 || i.Status.IDStatus == 103 || i.Status.IDStatus == 110));

            this.alertCtrl.create({
                header: 'H???Y ' + this.selectedItems.length + ' ????n h??ng',
                //subHeader: '---',
                message: 'B???n ch???c mu???n H???Y ' + this.selectedItems.length + ' ????n h??ng ??ang ch???n?',
                buttons: [
                    {
                        text: 'Kh??ng',
                        role: 'cancel',
                        handler: () => {
                            //console.log('Kh??ng x??a');
                        }
                    },
                    {
                        text: 'H???y',
                        cssClass: 'danger-btn',
                        handler: () => {

                            let publishEventCode = this.pageConfig.pageName;
                            let apiPath = {
                                method: "POST",
                                url: function () { return ApiSetting.apiDomain("SALE/Order/CancelOrders/") }
                            };

                            if (this.submitAttempt == false) {
                                this.submitAttempt = true;

                                let postDTO = { Ids: [] };
                                postDTO.Ids = this.selectedItems.map(e => e.Id);

                                this.pageProvider.commonService.connect(apiPath.method, apiPath.url(), postDTO).toPromise()
                                    .then((savedItem: any) => {
                                        if (publishEventCode) {
                                            this.env.publishEvent({ Code: publishEventCode });
                                        }
                                        this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.save-complete', 'success');
                                        this.submitAttempt = false;

                                    }).catch(err => {
                                        this.submitAttempt = false;
                                        //console.log(err);
                                    });
                            }

                        }
                    }
                ]
            }).then(alert => {
                alert.present();
            })
        }

    }

    deleteItems() {
        let itemsCanNotDelete = this.selectedItems.filter(i => !(i.Status.IDStatus == 101 || i.Status.IDStatus == 102));
        if (itemsCanNotDelete.length == this.selectedItems.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-delete-new-disapprove-only', 'warning');
        }
        else if (itemsCanNotDelete.length) {
            this.alertCtrl.create({
                header: 'C?? ' + itemsCanNotDelete.length + ' ????n kh??ng th??? x??a',
                //subHeader: '---',
                message: 'B???n c?? mu???n b??? qua ' + this.selectedItems.length + ' ????n n??y v?? ti???p t???c x??a?',
                buttons: [
                    {
                        text: 'Kh??ng',
                        role: 'cancel',
                        handler: () => {
                            //console.log('Kh??ng x??a');
                        }
                    },
                    {
                        text: '?????ng ti???p t???c',
                        cssClass: 'danger-btn',
                        handler: () => {
                            itemsCanNotDelete.forEach(i => {
                                i.checked = false;
                            });
                            this.selectedItems = this.selectedItems.filter(i => (i.Status.IDStatus == 101 || i.Status.IDStatus == 102));
                            super.deleteItems();
                        }
                    }
                ]
            }).then(alert => {
                alert.present();
            })
        }
        else {
            super.deleteItems();
        }



    }

    addSOtoShipment(s) {
        let OrderIds = this.selectedItems.filter(i => i.Status.IDStatus == 104 || i.Status.IDStatus == 110); //???? duy???t || ch??? giao l???i
        let DebtOrderIds = this.selectedItems.filter(i => i.Status.IDStatus == 113); // ??ang n???
        if (!(OrderIds.length || DebtOrderIds.length)) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-add-to-shipment', 'warning');
            return;
        }

        let shipment = {
            Id: s.Id,
            OrderIds: OrderIds.map(e => e.Id),
            DebtOrderIds: DebtOrderIds.map(e => e.Id)
        };

        let publishEventCode = this.pageConfig.pageName;
        let apiPath = {
            method: "PUT",
            url: function () { return ApiSetting.apiDomain("SHIP/Shipment/QuickAddSO/") }
        };

        if (this.submitAttempt == false) {
            this.submitAttempt = true;

            this.pageProvider.commonService.connect(apiPath.method, apiPath.url(), shipment).toPromise()
                .then((savedItem: any) => {
                    if (publishEventCode) {
                        this.env.publishEvent({ Code: publishEventCode });
                    }
                    this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.save-complete', 'success');
                    this.loadShipmentList();
                    this.submitAttempt = false;

                }).catch(err => {
                    this.submitAttempt = false;
                    this.loadShipmentList();
                    this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-save', 'danger');
                    //console.log(err);
                });
        }

    }

    async createARInvoice() {
        if (!this.pageConfig.canAddARInvoice) {
            return;
        }

        let itemsCanNotProcess = this.selectedItems.filter(i => (i.Status.IDStatus == 101 || i.Status.IDStatus == 102 || i.Status.IDStatus == 103 || i.Status.IDStatus == 110 || i.Status.IDStatus == 111 || i.Status.IDStatus == 112 || i.Status.IDStatus == 115));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-create-arinvoice', 'warning');
            return;
        }

        itemsCanNotProcess.forEach(i => {
            i.checked = false;
        });
        this.selectedItems = this.selectedItems.filter(i => (i.Status.IDStatus == 104 || i.Status.IDStatus == 105 || i.Status.IDStatus == 106 || i.Status.IDStatus == 107 || i.Status.IDStatus == 108 || i.Status.IDStatus == 109 || i.Status.IDStatus == 113 || i.Status.IDStatus == 114));

        let ids = this.selectedItems.map(m => m.Id)

        // ids.forEach((id, index) => {
        //     this.arInvoiceProvider.read({ IDSaleOrder: id }).then(ar => {
        //         ids.splice(index, id);

        //     });
        // })

        for (let index = 0; index < ids.length; index++) {
            const id = ids[index];
            this.arInvoiceProvider.read({ IDSaleOrder: id }).then(ar => {
                ids.splice(index, id);
            });
        }
        console.log(ids);

        if (!ids) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-create-already', 'warning');
        }
        else {
            //return new Promise(resolve => {
            this.EInvoiceServiceProvider.CreateARInvoiceFromSOs(ids).then((resp: any) => {
                if (resp != '') {
                    this.env.showMessage(resp[0].errorMsg, 'warning');
                    this.submitAttempt = false;
                }
                else {
                    this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.invoice-complete', 'success');
                    //this.env.showMessage('???? c???p nh???t h??a ????n ??i???n t??? th??nh c??ng!', 'success');
                    this.submitAttempt = false;
                }
            })
                .catch(err => {
                    console.log(err);

                })
            //})
        }
    }

    async createMergeARInvoice() {
        if (!this.pageConfig.canAddARInvoice) {
            return;
        }

        let itemsCanNotProcess = this.selectedItems.filter(i => (i.Status.IDStatus != 104));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-create-merge-arinvoice', 'warning');
            return;
        }

        itemsCanNotProcess.forEach(i => {
            i.checked = false;
        });

        this.selectedItems = this.selectedItems.filter(i => (i.Status.IDStatus == 104));

        let ids = this.selectedItems.map(m => m.Id)

        //b??? sung c??c SO con (n???u c??)
        ids.forEach(id => {
            let subSOs = this.items.filter(ii => (ii.IDParent == id));

            if (subSOs) {
                subSOs.forEach(so => {
                    this.selectedItems.push(so);
                    so.checked = true;
                });
            }
        })

        const modal = await this.modalController.create({
            component: SaleOrderMergeARInvoiceModalPage,
            swipeToClose: true,
            cssClass: 'modal90',
            componentProps: {
                'selectedOrders': this.selectedItems
            }
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();

        this.selectedItems = [];
        this.refresh();
    }

    async createSplitARInvoices() {

        let IDStatus = this.selectedItems[0].Status.IDStatus;
        if (IDStatus != 104) {
            this.env.showTranslateMessage('erp.app.pages.sale.sale-order.message.can-not-create-split-arinvoice', 'warning');
            return;
        }

        const modal = await this.modalController.create({
            component: SaleOrderARInvoiceModalPage,
            swipeToClose: true,
            cssClass: 'modal90',
            componentProps: {
                'selectedOrder': this.selectedItems[0]
            }
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();

        this.selectedItems = [];
        this.refresh();
    }
}
