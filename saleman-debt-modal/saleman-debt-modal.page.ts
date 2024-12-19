import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { NavController, ModalController, NavParams, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { HRM_StaffProvider, SALE_OrderProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { NgSelectConfig } from '@ng-select/ng-select';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { lib } from 'src/app/services/static/global-functions';
import { ApiSetting } from 'src/app/services/static/api-setting';

@Component({
    selector: 'app-saleman-debt-modal',
    templateUrl: './saleman-debt-modal.page.html',
    styleUrls: ['./saleman-debt-modal.page.scss'],
    standalone: false
})
export class SalemanDebtModalPage extends PageBase {
  @Input() selectedOrders;

  constructor(
    public pageProvider: SALE_OrderProvider,
    public staffProvider: HRM_StaffProvider,

    public env: EnvService,
    public navCtrl: NavController,
    public route: ActivatedRoute,

    public modalController: ModalController,
    public alertCtrl: AlertController,
    public navParams: NavParams,
    public formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef,
    public loadingController: LoadingController,
    private config: NgSelectConfig,
  ) {
    super();
    this.pageConfig.isDetailPage = false;
    this.pageConfig.pageName = 'MergeSaleOrder';
    this.config.notFoundText = 'Không tìm thấy dữ liệu phù hợp...';
    this.config.clearAllText = 'Xóa hết';
  }

  loadData(event) {
    this.item = {
      PostDate: lib.dateFormat(new Date(), 'yyyy-mm-dd'),
      IDBranch: this.env.selectedBranch,
      Amount: 0,
    };

    if (this.selectedOrders && this.selectedOrders.length) {
      for (let i = 0; i < this.selectedOrders.length; i++) {
        const o = this.selectedOrders[i];
        this.item.Amount += o.DiscountFromSalesman - o.ReceivedDiscountFromSalesman;
      }

      this.item.Ids = this.selectedOrders.map((e) => e.Id);
      this.item.IDOwner = this.selectedOrders[0].IDSeller;
      this.salemanListSelected.push({
        Id: this.selectedOrders[0].IDSeller,
        FullName: this.selectedOrders[0].SellerName,
      });
    }

    this.loadedData(event);
  }

  loadedData(event) {
    this.salemanSearch();
    super.loadedData(event);
  }

  salemanList$;
  salemanListLoading = false;
  salemanListInput$ = new Subject<string>();
  salemanListSelected = [];
  salemanSelected = null;
  salemanSearch() {
    this.salemanListLoading = false;
    this.salemanList$ = concat(
      of(this.salemanListSelected),
      this.salemanListInput$.pipe(
        distinctUntilChanged(),
        tap(() => (this.salemanListLoading = true)),
        switchMap((term) =>
          this.staffProvider
            .search({
              Take: 20,
              Skip: 0,
              IDDepartment: this.env.selectedBranchAndChildren,
              Term: term,
            })
            .pipe(
              catchError(() => of([])), // empty list on error
              tap(() => (this.salemanListLoading = false)),
            ),
        ),
      ),
    );
  }

  createReceipt() {
    let publishEventCode = this.pageConfig.pageName;
    let apiPath = {
      method: 'POST',
      url: function () {
        return ApiSetting.apiDomain('SALE/Order/CreateReceipt/');
      },
    };

    return new Promise((resolve, reject) => {
      if (!this.item.IDOwner || !this.item.Amount) {
        this.env.showMessage('Please information of payer and amount paid.', 'warning');
      } else if (this.submitAttempt == false) {
        this.submitAttempt = true;

        // setTimeout(() => {
        //     resolve(this.item);
        //     this.submitAttempt = false;
        //     this.modalController.dismiss(this.item);
        // }, 0);

        this.pageProvider.commonService
          .connect(apiPath.method, apiPath.url(), this.item)
          .toPromise()
          .then((resp: any) => {
            if (publishEventCode) {
              this.env.publishEvent({ Code: publishEventCode });
            }
            this.env.showMessage('Saving completed!', 'success');
            resolve(resp);
            this.submitAttempt = false;
            this.modalController.dismiss(this.item);
          })
          .catch((err) => {
            this.env.showMessage('Cannot save, please try again', 'success');
            this.cdr.detectChanges();
            this.submitAttempt = false;
            reject(err);
          });
      }
    });
  }
}
