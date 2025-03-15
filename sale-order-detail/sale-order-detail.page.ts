import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import {
	SALE_OrderProvider,
	BRA_BranchProvider,
	AC_ARInvoiceProvider,
	CRM_ContactProvider,
	SALE_OrderDetailProvider,
	WMS_ItemProvider,
	HRM_StaffProvider,
	SYS_ConfigProvider,
} from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { NgSelectConfig } from '@ng-select/ng-select';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';

import { EInvoiceService } from 'src/app/services/einvoice.service';
import { SALE_OrderService } from '../sale-order-service';

@Component({
	selector: 'app-sale-order-detail',
	templateUrl: './sale-order-detail.page.html',
	styleUrls: ['./sale-order-detail.page.scss'],
	standalone: false,
})
export class SaleOrderDetailPage extends PageBase {
	//m3Mask = ['PPP-PPP', this.pattern];
	statusList = [];
	typeList = [];
	subTypeList = [];
	paymentMethodList = [];
	saller = [];
	branch = null;
	billOfLanding: any = {};
	disableCustomerChange = true;

	constructor(
		public pageProvider: SALE_OrderService,
		public orderDetailProvider: SALE_OrderDetailProvider,
		public branchProvider: BRA_BranchProvider,
		public contactProvider: CRM_ContactProvider,
		public itemProvider: WMS_ItemProvider,
		public staffPovider: HRM_StaffProvider,
		public arInvoiceProvider: AC_ARInvoiceProvider,

		public EInvoiceServiceProvider: EInvoiceService,

		public popoverCtrl: PopoverController,
		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,
		public modalController: ModalController,
		public alertCtrl: AlertController,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController,
		public commonService: CommonService,
		public sysConfigProvider: SYS_ConfigProvider,
		private config: NgSelectConfig
	) {
		super();
		this.item = {};
		this.pageConfig.isDetailPage = true;
		this.id = this.route.snapshot.paramMap.get('id');

		this.buidFormGroup();
		//https://github.com/ng-select/ng-select
		this.config.notFoundText = 'Không tìm thấy dữ liệu phù hợp...';
		this.config.clearAllText = 'Xóa hết';
	}

	_staffDataSource = this.buildSelectDataSource((term) => {
		return this.staffPovider.search({ Take: 20, Skip: 0, Term: term });
	});
	_contactDataSource = this.buildSelectDataSource((term) => {
		return this.contactProvider.search({
			Take: 20,
			Skip: 0,
			SkipMCP: term ? false : true,
			Term: term ? term : 'BP:' + this.item.IDContact,
		});
	});

	buidFormGroup() {
		this.formGroup = this.formBuilder.group({
			Id: new FormControl({ value: '', disabled: true }),
			RefID: new FormControl({ value: '', disabled: true }),
			IDBranch: new FormControl({ value: this.env.selectedBranch, disabled: false }),
			Code: [''],
			Name: [''],
			Remark: [''],
			IDStatus: new FormControl({ value: '', disabled: false }),
			Status: ['New'],
			Type: new FormControl({ value: 'FMCGSalesOrder', disabled: true }),
			SubType: [''],
			PaymentMethod: [''],
			OrderDate: new FormControl({ value: '', disabled: true }),
			ExpectedDeliveryDate: [''],
			ShippedDate: new FormControl({ value: '', disabled: true }),
			IDContact: ['', Validators.required],
			IDAddress: ['', Validators.required],
			ShippingAddress: [''],
			ShippingAddressRemark: [''],
			IDOwner: new FormControl({ value: '', disabled: true }),
			RefOwner: [''],
			IDOpportunity: [''],
			RefContact: [''],
			IDContract: [''],
			TaxRate: [''],
			ProductWeight: new FormControl({ value: '', disabled: true }),
			ProductDimensions: new FormControl({ value: '', disabled: true }),
			OriginalTotalBeforeDiscount: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalPromotion: new FormControl({ value: '', disabled: true }),
			OriginalDiscount1: [''],
			OriginalDiscount2: [''],
			OriginalDiscountByItem: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalDiscountByGroup: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalDiscountByLine: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalDiscountByOrder: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalDiscountFromSalesman: [''],
			OriginalTotalDiscount: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalTotalAfterDiscount: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalTax: new FormControl({ value: '', disabled: true }),
			OriginalTotalAfterTax: new FormControl({
				value: '',
				disabled: true,
			}),
			OriginalTotalAfterDiscountFromSalesman: [''],

			TotalBeforeDiscount: [''],
			Promotion: [''],
			Discount1: [''],
			Discount2: [''],
			DiscountByItem: [''],
			DiscountByGroup: [''],
			DiscountByLine: [''],
			DiscountByOrder: [''],
			DiscountFromSalesman: [''],
			TotalDiscount: [''],
			TotalAfterDiscount: [''],
			Tax: [''],
			TotalAfterTax: [''],
			Received: [''],
			Debt: [''],
			IsDebt: [''],
			IsPaymentReceived: [''],

			TaxCode: [''],
			InvoiceNumber: [''],
			InvoicDate: [''],
			Sort: [''],
			IsDisabled: new FormControl({ value: '', disabled: true }),
			IsDeleted: [''],
			CreatedBy: [''],
			ModifiedBy: [''],
			CreatedDate: [''],
			ModifiedDate: [''],
			RefWarehouse: [''],
			RefDepartment: [''],
			RefShipper: [''],
			InvoiceDate :[''],
			OrderLines: this.formBuilder.array([]),
			DeletedLines:[],
			IsUrgentOrders:[],
			IsSampleOrder:[],
			IsWholeSale:[],
			IsShipBySaleMan:[]

		});
	}

	preLoadData(event) {
		let sysConfigQuery = ['SOIsShowOrderDetailRemark'];
		Promise.all([
			this.env.getStatus('SalesOrder'),
			this.env.getType('OrderType'),
			this.env.getType('FMCGSalesOrder'),
			this.env.getType('PaymentMethod'),
			this.sysConfigProvider.read({
				Code_in: sysConfigQuery,
				IDBranch: this.env.selectedBranch,
			}),
		]).then((results: any) => {
			this.statusList = results[0];
			this.typeList = results[1];
			this.subTypeList = results[2];
			this.paymentMethodList = results[3];
			// this.pageConfig.systemConfig = {};
			results[4]['data'].forEach((e) => {
				if ((e.Value == null || e.Value == 'null') && e._InheritedConfig) {
					e.Value = e._InheritedConfig.Value;
				}
				this.pageConfig[e.Code] = JSON.parse(e.Value);
			});
		});

		super.preLoadData(event);
	}

	loadedData(event) {
		if (this.item.Id) {
			//   let blockedStatus = [
			//     //101,	// Mới (sale tạo)
			//     //102,	// Đã trả
			//     103, // Chờ duyệt
			//     104, // Đã duyệt
			//     105, // Đã phân tài
			//     106, // Đang lấy hàng - đóng gói
			//     107, // Đã giao đơn vị vận chuyển
			//     108, // Đang giao hàng
			//     109, // Đã giao hàng
			//     110, // Chờ giao lại
			//     111, // Đã xuất hóa đơn
			//     112, // Đã có phiếu thu
			//     113, // Còn nợ
			//     114, // Đã xong
			//     115,
			//   ];

			let blockedStatus = [
				//101,	// Mới (sale tạo)
				//102,	// Đã trả
				'Submitted', // Chờ duyệt
				'Approved', // Đã duyệt
				'Scheduled', // Đã phân tài
				'Picking', // Đang lấy hàng - đóng gói
				'InCarrier', // Đã giao đơn vị vận chuyển
				'InDelivery', // Đang giao hàng
				'Delivered', // Đã giao hàng
				'Redelivery', // Chờ giao lại
				'Splitted', // Đã xuất hóa đơn
				'Merged', // Đã có phiếu thu
				'Debt', // Còn nợ
				'Done', // Đã xong
				'Canceled',
			];

			if (blockedStatus.indexOf(this.item.Status) > -1) {
				this.pageConfig.canEdit = false;
				this.pageConfig.canDelete = false;
				this.formGroup.get('IDAddress').disable();
			}

			if (this.pageConfig.canEditOrderInDelivery && this.item.Status == 'InDelivery') {
				//Đang giao hàng
				this.pageConfig.canEdit = true;
				this.pageConfig.canDelete = false;
				this.formGroup.get('IDAddress').enable();
			}

			if (this.pageConfig.canChangeCustomerOfReviewOrder && this.item.Status == 'Submitted') {
				this.pageConfig.canEdit = false;
				this.pageConfig.canDelete = false;
				this.formGroup.get('IDAddress').enable();
			}

			this.item.OrderDateText = lib.dateFormat(this.item.OrderDate, 'hh:MM dd/mm/yyyy');

			this.LoadTaxCodeDataSource(this.item._Customer);

			super.loadedData(event, true);
		} else {
			if (!this.pageConfig.canEdit) {
				this.pageConfig.canEdit = this.pageConfig.canAdd;
			}
			this.item.Type = 'FMCGSalesOrder';
			this.item.SubType = 'PreSales';
			this.item.OrderLines = [];
			super.loadedData(event, true);
		}
		this.setOrderLines();

		if (this.item._Customer) {
			this.contactProvider
				.search({
					Take: 20,
					Skip: 0,
					SkipMCP: true,
					Term: 'BP:' + this.item.IDContact,
				})
				.subscribe((data: any) => {
					this._contactDataSource.initSearch();
					this._contactDataSource.selected.push(this.item._Customer);
					this.cdr.detectChanges();
				});
		} else {
			this._contactDataSource.initSearch();
		}

		if (this.item.IDOwner) {
			this.staffPovider.getAnItem(this.item.IDOwner).then((seller: any) => {
				this._staffDataSource.selected.push(seller);
			});
			this._staffDataSource.initSearch();
		}

		if (this.item.IDBranch) {
			this.branchProvider.getAnItem(this.item.IDBranch).then((branch: any) => {
				this.branch = branch;
			});
		}
		if (!(this.item?.Id > 0)) {
			this.formGroup.get('Status').markAsDirty();
		}
	}

	TaxCodeDataSource = [];
	LoadTaxCodeDataSource(i) {
		this.TaxCodeDataSource = [];
		this._contactDataSource.selected.push(i);
		if (i?.TaxAddresses) {
			this.TaxCodeDataSource = i.TaxAddresses;
		}
		this.TaxCodeDataSource.unshift({
			CompanyName: '----------',
			disabled: true,
		});
		this.TaxCodeDataSource.unshift({
			TaxCode: '-1',
			CompanyName: 'Xuất khách vãng lai',
		});
		this.TaxCodeDataSource.unshift({
			TaxCode: null,
			CompanyName: 'Xuất theo MST mặc định',
		});
	}

	changedIDAddress(i) {
		if (i) {
			this.LoadTaxCodeDataSource(i);
			this.item.IDContact = i.Id;
			this.formGroup.controls.IDContact.setValue(i.Id);
			this.formGroup.controls.IDContact.markAsDirty();
			if (this._contactDataSource.selected.findIndex((d) => d.Id == i.Id) == -1) {
				this._contactDataSource.selected.push(i);
				// this.contactSearch();
				this._contactDataSource.initSearch();
			}
			this.saveChange();
		}
	}

	segmentView = 's1';
	segmentChanged(ev: any) {
		this.segmentView = ev.detail.value;
	}

	// contactSearchLocal(term: string, i) {
	//     term = term.toLowerCase();
	//     return i.Name.toLowerCase().indexOf(term) > -1
	//         || i.Id == term
	//         || i.WorkPhone.toLowerCase().indexOf(term) > -1;
	// }

	IDItemChange(selectedItem, line) {
		if (selectedItem) {
			if (line.controls._IDItemDataSource.value.selected.findIndex((d) => d.Id == selectedItem.Id) == -1) {
				line.controls._IDItemDataSource.value.selected.push(selectedItem);
				line.controls._IDItemDataSource.value.initSearch();
			}
			line.controls._IDUoMDataSource.setValue(selectedItem.UoMs);
			// this.resetLine(line);

			line.controls._Item.setValue(selectedItem);
			line.controls.TaxRate.setValue(selectedItem.SalesTaxInPercent); //Tax by Item

			this.item.OriginalPromotion = this.item.OriginalPromotion ? parseFloat(this.item.OriginalPromotion) : 0;
			line.controls.OriginalPromotion.setValue(this.item.OriginalPromotion); //Lấy theo order
			this.IDUoMChange(line);

			// if (this.item.OrderLines.findIndex(d => !d.IDItem) == -1) {
			//     this.addOrderLine();
			// }
		}
	}

	IDUoMChange(line) {
		let idUoM = line.controls._Item.value?.SalesUoM;

		let UoMs = line.controls._IDUoMDataSource?.value;
		let u = UoMs.find((d) => d.Id == idUoM);
		if (u && u.PriceList) {
			line.controls.IDUoM.setValue(idUoM);
			line.controls.IDUoM.markAsDirty();
			let salePrice = u.PriceList.find((d) => d.IDPriceList == 1 || d.Type == 'PriceListForCustomerAndVendor');
			let buyPrice = u.PriceList.find((d) => d.IDPriceList == 2 || d.Type == 'PriceListForCustomerAndVendor');

			line._UoMPrice = salePrice ? salePrice.Price : 0;
			line._BuyPrice = buyPrice ? buyPrice.Price : 0;

			if (this.item.IsSampleOrder) {
				line._UoMPrice = line._BuyPrice;
			}

			if (!line.controls.Quantity.value) {
				line.controls.Quantity.setValue(u.MinQuantity); //Item min Qty by UoM
				line.controls.Quantity.markAsDirty();
			}

			line.controls._ProductWeight.setValue(u.Weight);
			line.controls._ProductDimensions.setValue(u.Length * u.Width * u.Height);
			line.controls.UoMPrice.setValue(line._UoMPrice);
			line.controls.UoMPrice.markAsDirty();
		}

		if (line.controls.IDItem.value && line.controls.IDUoM.value && line.controls.Quantity.value) {
			this.pageProvider.calcOrderLine(line).then(() => {
				this.pageProvider.calcOrder(this.item, this.env, this.formGroup);
				this.saveChange();
			});
		}
	}

	addOrderLine() {
		// this.item.OrderLines.push({
		// 	IDOrder: this.item.Id,
		// 	Id: 0,
		// 	Quantity: 0,
		// });
		this.addOrderLineForm({});
	}

	setOrderLines() {
		this.formGroup.controls.OrderLines = new FormArray([]);
		if (this.item?.OrderLines?.length)
			this.item?.OrderLines.forEach((i) => {
				this.addOrderLineForm(i);
			});
	}

	addOrderLineForm(orderLine) {
		let groups = <FormArray>this.formGroup.controls.OrderLines;
		let selectedItem = orderLine._Item;
		let newFormGroup = this.formBuilder.group({
			_IDItemDataSource: this.buildSelectDataSource((term) => {
				return this.itemProvider.search({
					IDSO: this.item.Id,
					Take: 20,
					Skip: 0,
					Term: term,
				});
			}),
			_IDUoMDataSource: [selectedItem ? selectedItem.UoMs : []],
			Id: new FormControl({ value: orderLine.Id, disabled: true }),
			IDOrder: [orderLine.IDOrder],
			ExpectedDeliveryDate: [orderLine.ExpectedDeliveryDate],
			ShippedDate: [orderLine.ShippedDate],
			IDItem: [orderLine.IDItem, Validators.required],
			IDUoM: [orderLine.IDUoM, Validators.required],
			ProductStatus: [''],
			UoMPrice: [orderLine.UoMPrice],
			Quantity: [orderLine.Quantity, Validators.required],
			UoMSwap: [orderLine.UoMSwap],
			IDBaseUoM: [orderLine.IDBaseUoM],
			BaseQuantity: [orderLine.BaseQuantity],
			ProductWeight: [orderLine.ProductWeight],
			ProductDimensions: [orderLine.ProductDimensions],
			IDPromotion: [orderLine.IDPromotion],
			IDTax: [orderLine.IDTax],
			TaxRate: [orderLine.TaxRate],
			OriginalTotalBeforeDiscount: [orderLine.OriginalTotalBeforeDiscount],
			OriginalPromotion: [orderLine.OriginalPromotion],
			OriginalDiscount1:new FormControl({ value: orderLine.OriginalDiscount1, disabled: !this.pageConfig.canEdit || orderLine.IsPromotionItem || this.submitAttempt }), 
			OriginalDiscount2:new FormControl({ value: orderLine.OriginalDiscount2, disabled: !this.pageConfig.canEdit || orderLine.IsPromotionItem || this.submitAttempt }) ,

			OriginalDiscountByItem: [orderLine.OriginalDiscountByItem],
			OriginalDiscountByGroup: [orderLine.OriginalDiscountByGroup],
			OriginalDiscountByLine: [orderLine.OriginalDiscountByLine],
			OriginalDiscountByOrder: [orderLine.OriginalDiscountByOrder],
			OriginalDiscountFromSalesman: new FormControl({
				value: orderLine.OriginalDiscountFromSalesman,
				disabled: !(this.pageConfig.canEdit || (this.pageConfig.canUseDiscountFromSalesman && this.item.Status == 'Submitted')) || this.submitAttempt,
			}),
			OriginalTotalDiscount: [orderLine.OriginalTotalDiscount],
			OriginalTotalAfterDiscount: [orderLine.OriginalTotalAfterDiscount],
			OriginalTax: [orderLine.OriginalTax],
			OriginalTotalAfterTax: [orderLine.OriginalTotalAfterTax],
			ShippedQuantity: [orderLine.ShippedQuantity],
			ReturnedQuantity: [orderLine.ReturnedQuantity],
			TotalBeforeDiscount: [orderLine.TotalBeforeDiscount],
			Promotion: [orderLine.Promotion],
			Discount1: [orderLine.Discount1],
			Discount2: [orderLine.Discount2],
			DiscountByItem: [orderLine.DiscountByItem],
			DiscountByGroup: [orderLine.DiscountByGroup],
			DiscountByLine: [orderLine.DiscountByLine],
			DiscountByOrder: [orderLine.DiscountByOrder],
			DiscountFromSalesman: [orderLine.DiscountFromSalesman],
			TotalDiscount: [orderLine.TotalDiscount],
			TotalAfterDiscount: [orderLine.TotalAfterDiscount],
			IsPromotionItem: [orderLine.IsPromotionItem],
			Tax: [orderLine.Tax],
			TotalAfterTax: [orderLine.TotalAfterTax],
			_Item: [orderLine._Item],
			_ProductWeight: [orderLine._ProductWeight],
			_ProductDimensions: [orderLine._ProductDimensions],
			_ShowPriceWarning: [orderLine._ShowPriceWarning || null],
			SalesmanPrice: new FormControl({
				value: orderLine.SalesmanPrice,
				disabled: !(this.pageConfig.canEdit || (this.pageConfig.canUseDiscountFromSalesman && this.item.Status == 'Submitted')) || this.submitAttempt,
			}),
			OriginalTotalAfterDiscountFromSalesman: new FormControl({
				value: orderLine.OriginalTotalAfterDiscountFromSalesman,
				disabled: !(this.pageConfig.canEdit || (this.pageConfig.canUseDiscountFromSalesman && this.item.Status == 'Submitted')) || this.submitAttempt,
			}),
		});

		// newFormGroup.patchValue(orderLine);
		groups.push(newFormGroup);
		if (selectedItem) newFormGroup.controls._IDItemDataSource.value.selected.push(selectedItem);
		newFormGroup.controls._IDItemDataSource?.value.initSearch();
	}

	changedSampleOrder() {
		this.formGroup.controls.IsSampleOrder.setValue(this.item.IsSampleOrder);
		this.formGroup.controls.IsSampleOrder.markAsDirty();
		let groups = <FormArray>this.formGroup.controls.OrderLines;
		for (let idx = 0; idx < groups.length; idx++) {
			const line = groups.controls[idx];
			this.IDUoMChange(line);
		}
	}
	changeUrgent(){
		this.formGroup.controls.IsUrgentOrders.setValue(this.item.IsUrgentOrders);
		this.formGroup.controls.IsUrgentOrders.markAsDirty();
		this.saveChange();
	}

	changeWholesale(){
		this.formGroup.controls.IsWholeSale.setValue(this.item.IsWholeSale);
		this.formGroup.controls.IsWholeSale.markAsDirty();
		this.saveChange();
	}

	changeCoverage(){
		this.formGroup.controls.IsShipBySaleMan.setValue(this.item.IsShipBySaleMan);
		this.formGroup.controls.IsShipBySaleMan.markAsDirty();
		this.saveChange();
	}

	resetLine(line) {
		line.controls?._Item?.setValue(null);
		line.controls?.IDUoM?.setValue(null);
		line.controls?.TaxRate?.setValue(0);
		line.controls?.ProductWeight?.setValue(0);
		line.controls?.ProductDimensions?.setValue(0);
		line.controls?.Quantity?.setValue(0);

		line.controls?.OriginalTotalBeforeDiscount?.setValue(0);
		line.controls?.OriginalPromotion?.setValue(0);
		line.controls?.OriginalDiscount1?.setValue(0);
		line.controls?.OriginalDiscount2?.setValue(0);

		line.controls?.OriginalDiscountByItem?.setValue(0);
		line.controls?.OriginalDiscountByGroup?.setValue(0);
		line.controls?.OriginalDiscountByLine?.setValue(0);
		line.controls?.OriginalDiscountByOrder?.setValue(0);
		line.controls?.OriginalDiscountFromSalesman?.setValue(0);
		line.controls?.OriginalTotalDiscount?.setValue(0);
		line.controls?.OriginalTotalAfterDiscount?.setValue(0);

		line.controls?.OriginalTax?.setValue(0);
		line.controls?.OriginalTotalAfterTax?.setValue(0);
		line.controls?.OriginalTotalAfterDiscountFromSalesman?.setValue(0);
		line.controls?.SalesmanPrice?.setValue(0);

		line.controls?.ShippedQuantity?.setValue(0);
		line.controls?.ReturnedQuantity?.setValue(0);

		line.controls?.TotalBeforeDiscount?.setValue(0);
		line.controls?.Promotion?.setValue(0);
		line.controls?.Discount1?.setValue(0);
		line.controls?.Discount2?.setValue(0);

		line.controls?.DiscountByItem?.setValue(0);
		line.controls?.DiscountByGroup?.setValue(0);
		line.controls?.DiscountByLine?.setValue(0);
		line.controls?.DiscountByOrder?.setValue(0);
		line.controls?.DiscountFromSalesman?.setValue(0);
		line.controls?.TotalDiscount?.setValue(0);
		line.controls?.TotalAfterDiscount?.setValue(0);
		line.controls?.Tax?.setValue(0);
		line.controls?.TotalAfterTax?.setValue(0);
	}

	changedOriginalTotalAfterDiscountFromSalesman(line) {
		line.controls.SalesmanPrice.setValue(line.controls.OriginalTotalAfterDiscountFromSalesman.value / line.controls.Quantity.value);
		line.controls.OriginalDiscountFromSalesman.setValue(line.controls.OriginalTotalAfterTax.value - line.controls.OriginalTotalAfterDiscountFromSalesman.value);
		this.IDUoMChange(line);
	}

	changedSalesmanPrice(line) {
		line.controls.OriginalTotalAfterDiscountFromSalesman.setValue(line.controls.SalesmanPrice.value * line.controls.Quantity.value);
		line.controls.OriginalDiscountFromSalesman.setValue(line.controls.OriginalTotalAfterTax.value - line.controls.OriginalTotalAfterDiscountFromSalesman.value);
		this.IDUoMChange(line);
	}

	changeIsPromotion(line) {
		this.cdr.detach();
		line.controls.OriginalDiscountFromSalesman.setValue(0);
		line.controls.OriginalTotalAfterDiscountFromSalesman.setValue(0);
		line.controls.SalesmanPrice.setValue(0);
		this.cdr.markForCheck();
		setTimeout(() => {
			this.cdr.reattach();

			setTimeout(() => {
				this.IDUoMChange(line);
			}, 0);
		}, 0);
	}

	deleteOrderLine(line) {
		let groups = <FormArray>this.formGroup.controls.OrderLines;
		let Ids =[line.controls.Id?.value];
		if (Ids && Ids.length > 0) {
			this.formGroup.get('DeletedLines').setValue(Ids);
			this.formGroup.get('DeletedLines').markAsDirty();
			this.saveChange().then((s) => {
				Ids.forEach((id) => {
					let index = groups.controls.findIndex((x) => x.get('Id').value == id);
					if (index >= 0) groups.removeAt(index);
					this.pageProvider.calcOrder(this.item, this.env, this.formGroup);
				});
			});
		}

		// const index = this.item.OrderLines.indexOf(line);
		// if (index > -1) {
		// 	this.item.OrderLines.splice(index, 1);
		// }
		// this.pageProvider.calcOrder(this.item, this.env, this.formGroup);
		// this.saveChange();
	}

	saveChange() {
		if (this.submitAttempt) {
			return;
		}
		// this.pageProvider.apiPath.postItem.url = function () {
		// 	return ApiSetting.apiDomain('SALE/Order/Add');
		// };
		// this.pageProvider.apiPath.putItem.url = function (id) {
		// 	return ApiSetting.apiDomain('SALE/Order/Update/') + id;
		// };
		if (
			this.pageConfig.canEdit ||
			((this.pageConfig.canChangeTypeOfReviewOrder || this.pageConfig.canChangeTypeOfReviewOrder || this.pageConfig.canUseDiscountFromSalesman) &&
				this.item.Status == 'Submitted')
		) {
			return super.saveChange2();
		} else {
			return null;
		}
	}

	savedChange(savedItem = null, form = this.formGroup) {
		super.savedChange(savedItem, form);
		if (!this.item.OrderLines || this.item.OrderLines.length == 0) {
			this.refresh();
		}
	}

	async addContact() {
		// const modal = await this.modalController.create({
		//     component: SaleOrderMobileAddContactModalPage,
		//     cssClass: 'my-custom-class',
		//     componentProps: {
		//         'firstName': 'Douglas',
		//         'lastName': 'Adams',
		//         'middleInitial': 'N'
		//     }
		// });
		// return await modal.present();
	}

	newSaleOrder() {
		this.id = 0;
		this.item = {};
		this.pageConfig.canEdit = true;
		this.formGroup?.enable();
		let newURL = window.location.hash.substring(0, window.location.hash.lastIndexOf('/')) + '/0';
		history.pushState({}, null, newURL);
		this.preLoadData(null);
	}

	async createARInvoice(o) {
		let Status = this.selectedItems[0].Status;

		if (Status == 'New' || Status == 'Unapproved' || Status == 'Submitted' || Status == 'Redelivery' || Status == 'Splitted' || Status == 'Merged' || Status == 'Canceled') {
			this.env.showMessage('Cannot generate invoice with this orders status', 'warning');
			return;
		}

		let ids = this.selectedItems.map((m) => m.Id);

		ids.forEach((id, index) => {
			this.arInvoiceProvider.read({ IDSaleOrder: id }).then((ar) => {
				ids.splice(index, id);
			});
		});

		if ((ids.length = 0)) {
			this.env.showMessage('Your chosen orders have their invoices generated. Please check again!', 'warning');
		} else {
			this.EInvoiceServiceProvider.CreateARInvoiceFromSOs(ids).then((resp: any) => {
				console.log(resp);
				this.env.showMessage('Invoice created!', 'success');
			});
		}

		// const modal = await this.modalController.create({
		//     component: SaleOrderARInvoiceModalPage,
		//     cssClass: 'modal90',
		//     componentProps: {
		//         'selectedOrder': this.selectedItems[0]
		//     }
		// });
		// await modal.present();
		// const { data } = await modal.onWillDismiss();

		// this.selectedItems = [];
		// this.refresh();
	}

	closeOrder() {
		this.nav('sale-order/close-order/' + this.item.Id);
	}
}
