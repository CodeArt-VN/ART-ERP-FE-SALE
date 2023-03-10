import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { SALE_OrderProvider, BRA_BranchProvider, CRM_ContactProvider, SALE_OrderDetailProvider, WMS_ItemProvider, HRM_StaffProvider, SYS_StatusProvider } from 'src/app/services/static/services.service';
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
})
export class SaleOrderMobileViewerPage extends PageBase {



    constructor(
        public pageProvider: SALE_OrderProvider,
        public orderDetailProvider: SALE_OrderDetailProvider,
        public statusProvider: SYS_StatusProvider,
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

            this.orderDetailProvider.apiPath.getList.url = function(){return ApiSetting.apiDomain("SALE/OrderDetail/List")};
            this.orderDetailProvider.read({ IDOrder: this.id }).then((result: any) => {
                this.item.OrderLines = result.data;
                this.item.OrderLines.forEach(line => {
                    line._UoMPrice = line.UoMPrice;
                    line.Discount1Text = lib.currencyFormat(line.Discount1);
                    line.Discount2Text = lib.currencyFormat(line.Discount2);
                });
                super.loadedData(event, true);

            });

            if (this.checkIsEditableShipmentDetail()) {
                this.item.DA_GIAO_HANG = false;
            }
            else {
                this.item.DA_GIAO_HANG = true;
            }
        }
        else {
            this.item.OrderLines = [];
            super.loadedData(event, true);
        }

        if (this.item.IDContact) {
            this.contactProvider.getAnItem(this.item.IDContact).then((contact: any) => {
                this.item.Customer = contact;
            });
        }
        if (this.item.IDContact) {
            this.statusProvider.getAnItem(this.item.IDStatus).then((status: any) => {
                this.item.Status = status;
            });
        }

    }

    checkIsEditableShipmentDetail() {
        if (this.item.IsDebt) {
            return false;
        }

        let editableStatus = [
            314, //	???? ph??n t??i	32
            315, //	???? giao ????n v??? v???n chuy???n	32
            316, //	??ang l???y h??ng	32
            317, //	??ang ????ng g??i	32
            318, //	??ang giao h??ng	32
            // 319	, //	???? giao h??ng	32
            // 307	, //	Kh??ch h???n giao l???i	32
            // 308	, //	Kh??ng li??n l???c ???????c	32
            // 309	, //	Kh??ch kh??ng nh???n do h??ng l???i	32
            // 310	, //	Kh??ch kh??ng nh???n do gi??	32
            // 311	, //	Kh??ch kh??ng nh???n	32
            // 312	, //	Kh??ch kh??ng nh???n do kh??ch h???t ti???n	32
            // 313	, //	Kh??ng giao ???????c - l?? do kh??c	32
        ];
        return editableStatus.indexOf(this.item.IDStatus) > -1;

    }
}
