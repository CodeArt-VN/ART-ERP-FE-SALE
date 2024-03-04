import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { SALE_OrderDetailProvider, SALE_OrderProvider, WMS_ItemProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormArray, FormGroup } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';


@Component({
    selector: 'app-close-order',
    templateUrl: './close-order.page.html',
    styleUrls: ['./close-order.page.scss'],
})
export class CloseOrderPage extends PageBase {
    childSOList = [];
    allLines = [];
    preLoadItems = [];
    constructor(
        public pageProvider: SALE_OrderProvider,
        public saleOrderDetailProvider: SALE_OrderDetailProvider,
        public itemProvider: WMS_ItemProvider,
        public env: EnvService,
        public navCtrl: NavController,
        public route: ActivatedRoute,
        public alertCtrl: AlertController,
        public formBuilder: FormBuilder,
        public cdr: ChangeDetectorRef,
        public loadingController: LoadingController,
        public commonService: CommonService,
    ) {
        super();
        this.pageConfig.isDetailPage = true;

        this.formGroup = formBuilder.group({
            IDBranch: [''],
            Id: new FormControl({ value: '', disabled: true }),
            Code: new FormControl({ value: '', disabled: true }),
            Name: new FormControl({ value: '', disabled: true }),
            Remark: new FormControl({ value: '', disabled: true }),
            Sort: [''],
            IsDisabled: new FormControl({ value: '', disabled: true }),
            IsDeleted: new FormControl({ value: '', disabled: true }),
            CreatedBy: new FormControl({ value: '', disabled: true }),
            CreatedDate: new FormControl({ value: '', disabled: true }),
            ModifiedBy: new FormControl({ value: '', disabled: true }),
            ModifiedDate: new FormControl({ value: '', disabled: true }),
            OrderLines: this.formBuilder.array([]),
        });
    }

    preLoadData(event?: any): void {

        this.pageProvider.read({ IDParent: this.id }).then(resp => {
            this.childSOList = resp['data'];
            this.childSOList = this.childSOList.filter(d=>d.Status != 'Cancelled');
            let queryLines = this.childSOList.map(m => m.Id);
            queryLines.push(parseInt(this.id));

            this.saleOrderDetailProvider.read({ IDOrder: JSON.stringify(queryLines) }).then(rows => {
                this.allLines = rows['data'];
                let helper = {};

                this.allLines = this.allLines.reduce(function (r, o) {
                    var key = o.IDUoM + '-' + o.UoMPrice;

                    if (!helper[key]) {
                        helper[key] = Object.assign({}, o); // create a copy of o
                        r.push(helper[key]);
                    } else {
                        helper[key].Quantity += o.Quantity;
                        helper[key].ShippedQuantity += o.ShippedQuantity;
                    }

                    return r;
                }, []);

                let itemIds = this.allLines.map(m => m.IDItem);
                this.itemProvider.search({ Id: JSON.stringify(itemIds), IDSO: this.id }).toPromise().then((resp: any) => {
                    this.preLoadItems = resp;

                    super.preLoadData(event);
                })

            })

        })
    }

    loadedData(event?: any, ignoredFromGroup?: boolean): void {
        this.item.OrderLines = this.allLines;
        this.pageConfig.canEdit = !(this.item.Status == 'Done' || this.item.Status == 'Cancelled');
        
        super.loadedData(event, ignoredFromGroup);

        this.patchOrderLinesValue();
    }

    refresh(event?: any): void {
        this.clearData();
        this.preLoadData(event);
    }

    private patchOrderLinesValue() {
        this.formGroup.controls.OrderLines = new FormArray([]);
        if (this.item.OrderLines?.length) {
            for (let i of this.item.OrderLines) {
                i._Item = this.preLoadItems.find(d => d.Id == i.IDItem);
                this.addOrderLine(i);
            }
            this.calcSubTotal();
        }
    }

    addOrderLine(line) {
        let IDItemDataSource = {
            searchProvider: this.itemProvider,
            loading: false,
            input$: new Subject<string>(),
            selected: [...this.preLoadItems],
            items$: null,
            id: this.id,
            initSearch() {
                this.loading = false;
                this.items$ = concat(
                    of(this.selected),
                    this.input$.pipe(
                        distinctUntilChanged(),
                        tap(() => this.loading = true),
                        switchMap(term => this.searchProvider.search({ IDSO: this.id, SortBy: ['Id_desc'], Take: 20, Skip: 0, Term: term }).pipe(
                            catchError(() => of([])), // empty list on error
                            tap(() => this.loading = false)
                        ))

                    )
                );
            }
        };

        let groups = <FormArray>this.formGroup.controls.OrderLines;
        let group = this.formBuilder.group({
            _IDItemDataSource: [IDItemDataSource],
            _Item: new FormControl({ value: line._Item, disabled: line.Id ? true : false }, Validators.required),
            _UoMs: [line._Item ? line._Item.UoMs : ''],

            IDOrder: [line.IDOrder],
            Id: new FormControl({ value: line.Id, disabled: true }),

            //Type: [line.Type],
            //Status: new FormControl({ value: line.Status, disabled: true }),

            IDItem: [line.IDItem, Validators.required],
            IDTax: [line.IDTax],
            TaxRate: [line.TaxRate],

            IDUoM: new FormControl({ value: line.IDUoM, disabled: line.Id ? true : false }, Validators.required),
            UoMPrice: [line.UoMPrice],

            Quantity: new FormControl({ value: line.Quantity, disabled: line.Id ? true : false }, Validators.required),
            IDBaseUoM: [line.IDBaseUoM],
            UoMSwap: [line.UoMSwap],
            UoMSwapAlter: [line.UoMSwapAlter],
            BaseQuantity: [line.BaseQuantity],

            ShippedQuantity: new FormControl({ value: line.ShippedQuantity, disabled: !this.pageConfig.canEdit }, Validators.required), 
           
            //Remark: new FormControl({ value: line.Remark, disabled: true }),

            IsPromotionItem: [line.IsPromotionItem],
            IDPromotion: [line.IDPromotion],

            Sort: [line.Sort],

            // OriginalTotalBeforeDiscount
            // OriginalPromotion
            // OriginalDiscount1
            // OriginalDiscount2
            // OriginalDiscountByItem
            // OriginalDiscountByGroup
            // OriginalDiscountByLine
            // OriginalDiscountByOrder
            // OriginalDiscountFromSalesman
            // OriginalTotalDiscount
            // OriginalTotalAfterDiscount
            // OriginalTax
            // OriginalTotalAfterTax
            // CalcOriginalTotalAdditions
            // CalcOriginalTotalDeductions
            // CalcTotalOriginal

            // ShippedQuantity
            // ReturnedQuantity

            // TotalBeforeDiscount
            // Discount1
            // Discount2
            // DiscountByItem
            // Promotion
            // DiscountByGroup
            // DiscountByLine
            // DiscountByOrder
            // DiscountFromSalesman
            // TotalDiscount
            // TotalAfterDiscount
            // Tax
            // TotalAfterTax
            // CalcTotalAdditions
            // CalcTotalDeductions
            // CalcTotal


            // CreatedBy
            // ModifiedBy
            // CreatedDate
            // ModifiedDate

        });
        groups.push(group);
        group.valueChanges.subscribe(value => {
            this.calcSubTotal();
        });
        IDItemDataSource.initSearch();
    }

    calcSubTotal() {
        let rvalue = this.formGroup.getRawValue();
        this.item.subTotal = rvalue.OrderLines.reduce((sum, item) => sum += (item.ShippedQuantity || 0) * (item.UoMPrice || 0), 0)
    }

    segmentView = 's2';
    segmentChanged(ev: any) {
        this.segmentView = ev.detail.value;
    }

    changedIDItem(group, e) {
        console.log(e);
        
        if (e) {
            group.controls._UoMs.setValue(e.UoMs);
            group.controls.IDItem.setValue(e.Id);
            group.controls.IDItem.markAsDirty();

            group.controls.TaxRate.setValue(e.SalesTaxInPercent);
            group.controls.TaxRate.markAsDirty();

            group.controls.IDTax.setValue(e.IDSalesTaxDefinition);
            group.controls.IDTax.markAsDirty();

            group.controls.IDUoM.setValue(e.SalesUoM);
            group.controls.IDUoM.markAsDirty();
            this.changedIDUoM(group);
        }
    }

    changedIDUoM(group) {
        let selectedUoM = group.controls._UoMs.value.find(d => d.Id == group.controls.IDUoM.value);

        if (selectedUoM) {
            let price = selectedUoM.PriceList.find(d => d.Type == 'PriceListForCustomer');
            if (price) {
                group.controls.UoMPrice.setValue(price.Price);
            }
            else {
                group.controls.UoMPrice.setValue(0);
            }
            group.controls.UoMPrice.markAsDirty();
            this.saveChange();
        }
        else{
            this.env.showMessage('Sản phẩm chưa có giá bán, xin vui lòng liên hệ quản trị để được hỗ trợ.');
        }
    }

    toggleAllShippedQty() {


        let groups = <FormArray>this.formGroup.controls.OrderLines;
        groups.controls.forEach((group: FormGroup) => {
            if (this.item._IsShippedAll) {
                group.controls.ShippedQuantity.setValue(0);
                group.controls.ShippedQuantity.markAsDirty();
            }
            else {
                group.controls.ShippedQuantity.setValue(group.controls.Quantity.value);
                group.controls.ShippedQuantity.markAsDirty();
            }

        });
        this.item._IsShippedAll = !this.item._IsShippedAll;
    }

    toggleShippedQty(group) {
        if (group.controls.Quantity.value == group.controls.ShippedQuantity.value) {
            group.controls.ShippedQuantity.setValue(0);
            group.controls.ShippedQuantity.markAsDirty();
        }
        else {
            group.controls.ShippedQuantity.setValue(group.controls.Quantity.value);
            group.controls.ShippedQuantity.markAsDirty();
        }
    }

    removeTempProperties(obj) {
        for (var key in obj) {
            if (key.startsWith('_')) delete obj[key];

            if (Array.isArray(obj[key]))
                for (let sobj of obj[key])
                    this.removeTempProperties(sobj);
        }
    }

    async saveChange(isClosed = false, form = this.formGroup, publishEventCode = this.pageConfig.pageName, provider = this.pageProvider) {
        this.formGroup.updateValueAndValidity();
        if (!form.valid) {
            this.env.showTranslateMessage('Please recheck information highlighted in red above', 'warning');
        }
        else if (this.submitAttempt == false) {

            this.submitAttempt = true;
            let submitItem = form.getRawValue();
            this.removeTempProperties(submitItem);
            submitItem.IsClosedOrder = isClosed;
            
            this.env.showLoading('Xin vui lòng chờ xử lý chốt tiệc!', this.pageProvider.commonService.put('SALE/Order/CloseOrder/' + this.item.Id, submitItem))
                .then(_ => {
                    this.preLoadData();
                    this.env.publishEvent({ Code: publishEventCode });
                    this.submitAttempt = false;
                }).catch(err => {
                    console.log(err);
                    this.submitAttempt = false;
                    this.env.showTranslateMessage('Cannot save, please try again', 'danger');
                })
        }
    }

    async closeOrder() {
        this.env.showPrompt('Sau khi chốt tiệc và xuất hóa đơn, bạn sẽ không chỉnh sửa được nữa. Bạn có xác nhận tiếp tục chốt tiệc?', this.item.Name, 'Chốt tiệc')
        .then(_=>{
            this.saveChange(true);
        })
        .catch(_=>{});
        
    }

    

    openSONote(){
        var dirty:any = this.getDirtyValues(this.formGroup);
        if (dirty?.OrderLines) {
            this.env.showPrompt('Bạn chưa lưu thay đổi, bạn có muốn lưu lại các thay đổi?',null, 'In bảng kê')
            .then(_=>{
                this.saveChange().then(_=>{
                    this.nav('sale-order-note/'+this.id);
                })
            }).catch(_=>{
                this.nav('sale-order-note/'+this.id);
            })
        }
        else{
            this.nav('sale-order-note/'+this.id);
        }
    }

    removeOrderLine(index) {
        this.env.showPrompt('Bạn chắc muốn bỏ item phần này?', null, 'Xóa item').then(_=>{
            let groups = <FormArray>this.formGroup.controls.OrderLines;
            groups.removeAt(index);
            this.calcSubTotal();
            
        }).catch(err=>{});
    }

    doReorder(ev, groups) {
        groups = ev.detail.complete(groups);
        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            g.controls.Sort.setValue(i + 1);
            g.controls.Sort.markAsDirty();
        }

        //this.saveChange();
    }
}