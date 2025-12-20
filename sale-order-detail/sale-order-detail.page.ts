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

import { EInvoiceService } from 'src/app/services/custom/einvoice.service';

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
	saller = null;
	branch = null;
	billOfLanding: any = {};
	disableCustomerChange = true;

	constructor(
		public pageProvider: SALE_OrderProvider,
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
		this.formGroup = formBuilder.group({
			Id: new FormControl({ value: '', disabled: true }),
			RefID: new FormControl({ value: '', disabled: true }),
			IDBranch: new FormControl({ value: '', disabled: false }),
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

			IDTaxInfo: [''],
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
			_idTaxInfo: [],
			//OrderLines: new FormArray([])
		});

		//https://github.com/ng-select/ng-select
		this.config.notFoundText = 'Không tìm thấy dữ liệu phù hợp...';
		this.config.clearAllText = 'Xóa hết';
	}

	// get orderLineFormGroups() {
	//     return this.formGroup.get('OrderLines') as FormArray;
	// }

	// addOrderLineForm(orderLine) {
	//     let newFormGroup = this.formBuilder.group({
	//         Id: new FormControl({ value: '', disabled: true }),
	//         IDOrder: [''],
	//         ExpectedDeliveryDate: [''],
	//         ShippedDate: [''],
	//         IDItem: ['', Validators.required],
	//         IDUoM: ['', Validators.required],
	//         ProductStatus: [''],
	//         UoMPrice: [''],
	//         Quantity: ['', Validators.required],
	//         UoMSwap: [''],
	//         IDBaseUoM: [''],
	//         BaseQuantity: [''],
	//         ProductWeight: [''],
	//         ProductDimensions: [''],
	//         IDPromotion: [''],
	//         IDTax: [''],
	//         TaxRate: [''],
	//         OriginalTotalBeforeDiscount: [''],
	//         OriginalPromotion: [''],
	//         OriginalDiscount1: [''],
	//         OriginalDiscount2: [''],
	//
	//         OriginalDiscountByItem: [''],
	//         OriginalDiscountByGroup: [''],
	//         OriginalDiscountByLine: [''],
	//         OriginalDiscountByOrder: [''],
	//         OriginalDiscountFromSalesman: [''],
	//         OriginalTotalDiscount: [''],
	//         OriginalTotalAfterDiscount: [''],
	//         OriginalTax: [''],
	//         OriginalTotalAfterTax: [''],
	//         ShippedQuantity: [''],
	//         ReturnedQuantity: [''],
	//         TotalBeforeDiscount: [''],
	//         Promotion: [''],
	//         Discount1: [''],
	//         Discount2: [''],
	//         DiscountByItem: [''],
	//         DiscountByGroup: [''],
	//         DiscountByLine: [''],
	//         DiscountByOrder: [''],
	//         DiscountFromSalesman: [''],
	//         TotalDiscount: [''],
	//         TotalAfterDiscount: [''],
	//         Tax: [''],
	//         TotalAfterTax: [''],

	//     });

	//     newFormGroup.patchValue(orderLine);
	//     this.orderLineFormGroups.push(newFormGroup);
	// }

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

			// if(this.pageConfig.canChangeTypeOfReviewOrder && this.item.IDStatus == 103){
			//     this.pageConfig.canEdit = false;
			//     this.pageConfig.canDelete = false;
			//     //this.formGroup.get('IDAddress').enable();
			// }

			// if (this.pageConfig.canUseDiscountFromSalesman && this.item.IDStatus == 103) {
			//     this.pageConfig.canEdit = false;
			//     this.pageConfig.canDelete = false;
			//     this.formGroup.get('OriginalDiscountFromSalesman').enable();
			// }

			this.item.OrderDateText = lib.dateFormat(this.item.OrderDate, 'hh:MM dd/mm/yyyy');
			//this.orderLineFormGroups.clear();

			this.LoadTaxCodeDataSource(this.item._Customer);

			this.orderDetailProvider.read({ IDOrder: this.id }).then((result: any) => {
				this.item.OrderLines = result.data;
				let count = 0;
				this.item.OrderLines.forEach((line) => {
					line._UoMPrice = line.UoMPrice;
					this.submitAttempt = true;
					this.calcOrderLine(line).then(() => {
						count++;
						if (count >= this.item.OrderLines.length) {
							this.calcOrder();
							setTimeout(() => {
								this.submitAttempt = false;
							}, 0);
						}
					});
				});
				super.loadedData(event, true);
				// for (let idx = 0; idx < this.item.OrderLines.length; idx++) {
				//     const orderLine = this.item.OrderLines[idx];
				//     this.addOrderLineForm(orderLine);
				// }

				let ids = this.item.OrderLines.map((i) => i.IDItem);
				if (ids.length) {
					this.itemProvider
						.search({
							IDSO: this.item.Id,
							IgnoredBranch: true,
							AllUoM: true,
							Id: JSON.stringify(ids),
						})
						.toPromise()
						.then((result: any) => {
							result.forEach((i) => {
								if (this.itemListSelected.findIndex((d) => d.Id == i.Id) == -1) {
									this.itemListSelected.push(i);
								}
								let lines = this.item.OrderLines.filter((d) => d.IDItem == i.Id);
								lines.forEach((line) => {
									line._itemData = i;
								});
							});
						})
						.finally(() => {
							this.itemSearch();
							this.cdr.detectChanges();
						});
				} else {
					this.itemSearch();
					this.addOrderLine();
				}
			});
		} else {
			if (!this.pageConfig.canEdit) {
				this.pageConfig.canEdit = this.pageConfig.canAdd;
			}
			this.item.Type = 'FMCGSalesOrder';
			this.item.SubType = 'PreSales';
			this.item.OrderLines = [];
			super.loadedData(event, true);
		}

		if (this.item._Customer) {
			this.contactProvider
				.search({
					Take: 20,
					Skip: 0,
					SkipMCP: true,
					Term: 'BP:' + this.item.IDContact,
				})
				.subscribe((data: any) => {
					this.contactListSelected.push(this.item._Customer);
					this.contactSearch();
					this.cdr.detectChanges();
				});
		} else {
			this.contactSearch();
		}

		if (this.item.IDOwner) {
			this.staffPovider.getAnItem(this.item.IDOwner).then((seller: any) => {
				this.saller = seller;
			});
		}

		if (!this.item.IDTaxInfo) {
			this.formGroup.controls._idTaxInfo.setValue(-2);
		} else {
			this.formGroup.controls._idTaxInfo.setValue(this.item.IDTaxInfo);
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
		this.contactSelected = i;
		if (i?.TaxAddresses) {
			this.TaxCodeDataSource = i.TaxAddresses;
		}
		this.TaxCodeDataSource.unshift({
			CompanyName: '----------',
			disabled: true,
		});
		this.TaxCodeDataSource.unshift({
			Id: -2,
			TaxCode: '-1',
			CompanyName: 'Xuất khách vãng lai',
		});
		this.TaxCodeDataSource.unshift({
			Id: -1,
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
			if (this.contactListSelected.findIndex((d) => d.Id == i.Id) == -1) {
				this.contactListSelected.push(i);
				this.contactSearch();
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

	contactList$;
	contactListLoading = false;
	contactListInput$ = new Subject<string>();
	contactListSelected = [];
	contactSelected = null;
	contactSearch() {
		this.contactListLoading = false;
		this.contactList$ = concat(
			of(this.contactListSelected),
			this.contactListInput$.pipe(
				distinctUntilChanged(),
				tap(() => (this.contactListLoading = true)),
				switchMap((term) =>
					this.contactProvider
						.search({
							Take: 20,
							Skip: 0,
							SkipMCP: term ? false : true,
							Keywork: term,
						})
						.pipe(
							catchError(() => of([])), // empty list on error
							tap(() => (this.contactListLoading = false))
						)
				)
			)
		);
	}

	itemList$;
	itemListLoading = false;
	itemListInput$ = new Subject<string>();
	itemListSelected = [];

	itemSearch() {
		this.itemListLoading = false;
		this.itemList$ = concat(
			of(this.itemListSelected),
			this.itemListInput$.pipe(
				distinctUntilChanged(),
				tap(() => (this.itemListLoading = true)),
				switchMap((term) =>
					this.pageProvider.commonService
						.connect('GET', 'SALE/Order/ItemSearch/', {
							IDSO: this.item.Id,
							Take: 20,
							Skip: 0,
							Keyword: term,
						})
						.pipe(
							catchError(() => of([])), // empty list on error
							tap(() => (this.itemListLoading = false))
						)
				)
			)
		);
	}

	changedIDItem(selectedItem, line) {
		if (selectedItem) {
			if (this.itemListSelected.findIndex((d) => d.Id == selectedItem.Id) == -1) {
				this.itemListSelected.push(selectedItem);
				this.itemSearch();
			}

			this.resetLine(line);

			line._itemData = selectedItem;
			line.TaxRate = selectedItem.SalesTaxInPercent; //Tax by Item

			this.item.OriginalPromotion = this.item.OriginalPromotion ? parseFloat(this.item.OriginalPromotion) : 0;
			line.OriginalPromotion = this.item.OriginalPromotion; //Lấy theo order
			this.changedItemUoM(line);

			// if (this.item.OrderLines.findIndex(d => !d.IDItem) == -1) {
			//     this.addOrderLine();
			// }
		}
	}

	changedSampleOrder() {
		for (let idx = 0; idx < this.item.OrderLines.length; idx++) {
			const line = this.item.OrderLines[idx];
			this.changedItemUoM(line);
		}
	}

	resetLine(line) {
		line._itemData = null;
		line.IDUoM = null;
		line.TaxRate = 0;
		line.ProductWeight = 0;
		line.ProductDimensions = 0;
		line.Quantity = 0;

		line.OriginalTotalBeforeDiscount = 0;
		line.OriginalPromotion = 0;
		line.OriginalDiscount1 = 0;
		line.OriginalDiscount2 = 0;

		line.OriginalDiscountByItem = 0;
		line.OriginalDiscountByGroup = 0;
		line.OriginalDiscountByLine = 0;
		line.OriginalDiscountByOrder = 0;
		line.OriginalDiscountFromSalesman = 0;
		line.OriginalTotalDiscount = 0;
		line.OriginalTotalAfterDiscount = 0;

		line.OriginalTax = 0;
		line.OriginalTotalAfterTax = 0;
		line.OriginalTotalAfterDiscountFromSalesman = 0;
		line.SalesmanPrice = 0;

		line.ShippedQuantity = 0;
		line.ReturnedQuantity = 0;

		line.TotalBeforeDiscount = 0;
		line.Promotion = 0;
		line.Discount1 = 0;
		line.Discount2 = 0;

		line.DiscountByItem = 0;
		line.DiscountByGroup = 0;
		line.DiscountByLine = 0;
		line.DiscountByOrder = 0;
		line.DiscountFromSalesman = 0;
		line.TotalDiscount = 0;
		line.TotalAfterDiscount = 0;
		line.Tax = 0;
		line.TotalAfterTax = 0;
	}

	changedOriginalTotalAfterDiscountFromSalesman(line) {
		line.SalesmanPrice = line.OriginalTotalAfterDiscountFromSalesman / line.Quantity;
		line.OriginalDiscountFromSalesman = line.OriginalTotalAfterTax - line.OriginalTotalAfterDiscountFromSalesman;
		this.changedItemUoM(line);
	}

	changedSalesmanPrice(line) {
		line.OriginalTotalAfterDiscountFromSalesman = line.SalesmanPrice * line.Quantity;
		line.OriginalDiscountFromSalesman = line.OriginalTotalAfterTax - line.OriginalTotalAfterDiscountFromSalesman;
		this.changedItemUoM(line);
	}

	changeIsPromotion(line) {
		this.cdr.detach();
		line.OriginalDiscountFromSalesman = 0;
		line.OriginalTotalAfterDiscountFromSalesman = 0;
		line.SalesmanPrice = 0;
		this.cdr.markForCheck();
		setTimeout(() => {
			this.cdr.reattach();

			setTimeout(() => {
				this.changedItemUoM(line);
			}, 0);
		}, 0);
	}

	changedItemUoM(line) {
		let idUoM = line.IDUoM || line._itemData.SalesUoM;

		let u = line._itemData.UoMs.find((d) => d.Id == idUoM);
		if (u && u.PriceList.length) {
			line.IDUoM = idUoM;
			line._UoM = u;

			let salePrice = u.PriceList.find((d) => d.IDPriceList == 1 || d.Type == 'PriceListForCustomerAndVendor');
			let buyPrice = u.PriceList.find((d) => d.IDPriceList == 2 || d.Type == 'PriceListForCustomerAndVendor');

			line._UoMPrice = salePrice ? salePrice.Price : 0;
			line._BuyPrice = buyPrice ? buyPrice.Price : 0;

			if (this.item.IsSampleOrder) {
				line._UoMPrice = line._BuyPrice;
			}

			if (!line.Quantity) {
				line.Quantity = u.MinQuantity; //Item min Qty by UoM
			}

			line._ProductWeight = u.Weight;
			line._ProductDimensions = u.Length * u.Width * u.Height;

			// u.Id,
			// u.Name,
			// u.LengthUnit,
			// u.Length,
			// u.WidthUnit,
			// u.Width,
			// u.HeightUnit,
			// u.Height,
			// u.WeightUnit,
			// u.Weight,
			// u.MinQuantity = 1,
			// u.MaxQuantity = 999,

			if (!line._UoMPrice) line._UoMPrice = 0;
			if (!line._BuyPrice) line._BuyPrice = 0;

			if (this.pageConfig.canEditPrice && line.UoMPrice) {
				line.BuyPrice = 0;
			} else {
				line.UoMPrice = line._UoMPrice;
				line.BuyPrice = line._BuyPrice;
			}
		} else {
			line.IDUoM = null;
			line._UoMPrice = 0;
			line._BuyPrice = 0;

			line.UoMPrice = 0;
			line.BuyPrice = 0;
		}

		if (line.IDItem && line.IDUoM && line.Quantity) {
			// if (line.Id == 0 && !this.submitAttempt) {
			//     this.submitAttempt = true;
			//     this.orderDetailProvider.save(line).then((response: any) => {
			//         this.submitAttempt = false;
			//         line.Id = response.Id;
			//         this.calcOrderLine(line).then(() => {
			//             this.calcOrder();
			//         });
			//     });
			// }
			// else {
			//     this.calcOrderLine(line).then(() => {
			//         this.calcOrder();
			//     });
			// }
			this.calcOrderLine(line).then(() => {
				this.calcOrder();
			});
		}
	}

	calcOrderLine(line) {
		return new Promise((resolve, reject) => {
			line.UoMPrice = line.IsPromotionItem ? 0 : parseFloat(line.UoMPrice) || 0;
			line.BuyPrice = parseFloat(line.BuyPrice) || 0;

			line.Quantity = parseFloat(line.Quantity) || 0;
			line.OriginalDiscount1 = line.IsPromotionItem ? 0 : parseFloat(line.OriginalDiscount1) || 0;
			line.OriginalDiscount2 = line.IsPromotionItem ? 0 : parseFloat(line.OriginalDiscount2) || 0;
			line.OriginalDiscountFromSalesman = parseFloat(line.OriginalDiscountFromSalesman) || 0;

			// if (!line.IsPromotionItem && line.OriginalDiscount1 > 0 && line.OriginalDiscount1 < 1000) {
			//     line.OriginalDiscount1 = line.OriginalDiscount1 * 1000;
			// }
			// if (!line.IsPromotionItem && line.OriginalDiscount2 > 0 && line.OriginalDiscount2 < 1000) {
			//     line.OriginalDiscount2 = line.OriginalDiscount2 * 1000;
			// }
			// if (!line.IsPromotionItem && line.OriginalDiscountFromSalesman > 0 && line.OriginalDiscountFromSalesman < 1000) {
			//     line.OriginalDiscountFromSalesman = line.OriginalDiscountFromSalesman * 1000;
			// }

			if (!line.IsPromotionItem && line.OriginalDiscount2 > (line.UoMPrice - line.BuyPrice) * line.Quantity) {
				line._ShowPriceWarning = true;
				//line.OriginalDiscount2 = (line.UoMPrice - line.BuyPrice) * line.Quantity;
			} else {
				line._ShowPriceWarning = false;
			}

			line.OriginalTotalBeforeDiscount = line.UoMPrice * line.Quantity;
			line.OriginalDiscountByItem = line.OriginalDiscount1 + line.OriginalDiscount2;

			// while (line.OriginalDiscountByItem > line.OriginalTotalBeforeDiscount) {
			//     if(line.OriginalDiscount1 > line.OriginalTotalBeforeDiscount){
			//         line.OriginalDiscount1 = line.OriginalTotalBeforeDiscount;
			//         line.OriginalDiscount2 = 0;
			//     }
			//     else if(line.OriginalDiscount1 > 0 && line.OriginalDiscount2 > 0 ){
			//         line.OriginalDiscount2 = line.OriginalTotalBeforeDiscount - line.OriginalDiscount1;
			//     }
			//     line.OriginalDiscountByItem = line.OriginalDiscount1 + line.OriginalDiscount2;
			// }

			if (line.OriginalDiscountByItem > line.OriginalTotalBeforeDiscount) {
				line.OriginalDiscount1 = 0;
				line.OriginalDiscount2 = 0;
				line.OriginalDiscountByItem = 0;
			}

			line.OriginalDiscountByGroup = 0;
			line.OriginalDiscountByLine = line.OriginalDiscountByItem + line.OriginalDiscountByGroup;
			line.OriginalDiscountByOrder = 0;
			line.OriginalTotalDiscount = line.OriginalDiscountByLine + line.OriginalDiscountByOrder;

			line.OriginalTotalAfterDiscount = line.OriginalTotalBeforeDiscount - line.OriginalTotalDiscount;
			line.OriginalTax = line.OriginalTotalAfterDiscount * (line.TaxRate / 100.0);
			line.OriginalTotalAfterTax = line.OriginalTotalAfterDiscount + line.OriginalTax;

			// if (line.OriginalDiscountFromSalesman > line.OriginalTotalAfterTax) {
			//     line.OriginalDiscountFromSalesman = line.OriginalTotalAfterTax;
			// }
			line.OriginalTotalAfterDiscountFromSalesman = line.OriginalTotalAfterTax - line.OriginalDiscountFromSalesman;
			line.SalesmanPrice = line.OriginalTotalAfterDiscountFromSalesman / line.Quantity;

			line.ProductWeight = line._ProductWeight * line.Quantity || 0;
			line.ProductDimensions = line._ProductDimensions * line.Quantity || 0;

			resolve(true);
		});
	}

	calcOrder() {
		this.item.TaxRate = 0;

		this.item.ProductWeight = 0;
		this.item.ProductDimensions = 0;

		this.item.OriginalTotalBeforeDiscount = 0;
		this.item.OriginalPromotion = this.item.OriginalPromotion ? parseFloat(this.item.OriginalPromotion) : 0;
		this.item.OriginalDiscount1 = 0;
		this.item.OriginalDiscount2 = 0;
		this.item.OriginalDiscountByItem = 0;
		this.item.OriginalDiscountByGroup = 0;
		this.item.OriginalDiscountByLine = 0;
		this.item.OriginalDiscountByOrder = 0;
		this.item.OriginalDiscountFromSalesman = 0;
		this.item.OriginalTotalDiscount = 0;
		this.item.OriginalTotalAfterDiscount = 0;
		this.item.OriginalTax = 0;
		this.item.OriginalTotalAfterTax = 0;
		this.item.OriginalTotalAfterDiscountFromSalesman = 0;

		this.item.TotalBeforeDiscount = 0;
		this.item.Promotion = 0;
		this.item.Discount1 = 0;
		this.item.Discount2 = 0;
		this.item.DiscountByItem = 0;
		this.item.DiscountByGroup = 0;
		this.item.DiscountByLine = 0;
		this.item.DiscountByOrder = 0;
		this.item.DiscountFromSalesman = 0;
		this.item.TotalDiscount = 0;
		this.item.TotalAfterDiscount = 0;
		this.item.Tax = 0;
		this.item.TotalAfterTax = 0;

		let validLines = this.item.OrderLines.filter((d) => d.IDItem && d.IDUoM);

		for (let idx = 0; idx < validLines.length; idx++) {
			const line = validLines[idx];

			this.item.ProductWeight += line.ProductWeight;
			this.item.ProductDimensions += line.ProductDimensions;

			this.item.OriginalTotalBeforeDiscount += line.OriginalTotalBeforeDiscount;

			this.item.OriginalDiscount1 += line.OriginalDiscount1;
			this.item.OriginalDiscount2 += line.OriginalDiscount2;
			this.item.OriginalDiscountByItem += line.OriginalDiscountByItem;
			this.item.OriginalDiscountByGroup += line.OriginalDiscountByGroup;
			this.item.OriginalDiscountByLine += line.OriginalDiscountByLine;
			this.item.OriginalDiscountByOrder += line.OriginalDiscountByOrder;
			this.item.OriginalDiscountFromSalesman += line.OriginalDiscountFromSalesman;
			this.item.OriginalTotalDiscount += line.OriginalTotalDiscount;
			this.item.OriginalTotalAfterDiscount += line.OriginalTotalAfterDiscount;
			this.item.OriginalTax += line.OriginalTax;
			this.item.OriginalTotalAfterTax += line.OriginalTotalAfterTax;
			this.item.OriginalTotalAfterDiscountFromSalesman += line.OriginalTotalAfterDiscountFromSalesman;

			this.item.TotalBeforeDiscount += line.TotalBeforeDiscount;
			//this.item.Promotion += line.Promotion;
			this.item.Discount1 += line.Discount1;
			this.item.Discount2 += line.Discount2;
			this.item.DiscountByItem += line.DiscountByItem;
			this.item.DiscountByGroup += line.DiscountByGroup;
			this.item.DiscountByLine += line.DiscountByLine;
			this.item.DiscountByOrder += line.DiscountByOrder;
			this.item.DiscountFromSalesman += line.DiscountFromSalesman;
			this.item.TotalDiscount += line.TotalDiscount;
			this.item.TotalAfterDiscount += line.TotalAfterDiscount;
			this.item.Tax += line.Tax;
			this.item.TotalAfterTax += line.TotalAfterTax;
		}

		this.item.ProductDimensionsM = this.item.ProductDimensions / 10 ** 6;

		if (this.item.OriginalTotalAfterDiscount) {
			this.item.TaxRate = (this.item.OriginalTax / this.item.OriginalTotalAfterDiscount) * 100;
		}

		if (this.item.OriginalDiscountFromSalesman < 0) {
			this.env.showMessage('Order not saved as discount from sales man less than 0', 'danger', null, 0, true);
		} else {
			this.formGroup.patchValue(this.item);
			this.saveChange();
		}
	}

	addOrderLine() {
		this.item.OrderLines.push({
			IDOrder: this.item.Id,
			Id: 0,
			Quantity: 0,
		});
	}

	deleteOrderLine(line) {
		const index = this.item.OrderLines.indexOf(line);
		if (index > -1) {
			this.item.OrderLines.splice(index, 1);
		}
		this.calcOrder();
	}

	saveChange() {
		if (this.submitAttempt) {
			return;
		}
		this.pageProvider.apiPath.postItem.url = function () {
			return ApiSetting.apiDomain('SALE/Order/Add');
		};
		this.pageProvider.apiPath.putItem.url = function (id) {
			return ApiSetting.apiDomain('SALE/Order/Update/') + id;
		};

		if (
			this.pageConfig.canEdit ||
			((this.pageConfig.canChangeTypeOfReviewOrder || this.pageConfig.canChangeTypeOfReviewOrder || this.pageConfig.canUseDiscountFromSalesman) &&
				this.item.Status == 'Submitted')
		) {
			if (this.formGroup.controls._idTaxInfo.dirty) {
				if (this.formGroup.controls._idTaxInfo.value == -2) {
					this.formGroup.controls.IDTaxInfo.setValue(null);
					this.formGroup.controls.IDTaxInfo.markAllAsDirty();
				} else {
					this.formGroup.controls.IDTaxInfo.setValue(this.formGroup.controls._idTaxInfo.value);
					this.formGroup.controls.IDTaxInfo.markAllAsDirty();
				}
			}
			return super.saveChange();
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
