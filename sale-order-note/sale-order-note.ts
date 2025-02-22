import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, CRM_ContactProvider, SALE_OrderDetailProvider, SALE_OrderProvider, SYS_ConfigProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import QRCode from 'qrcode';
import { lib } from 'src/app/services/static/global-functions';
import { printData, PrintingService } from 'src/app/services/printing.service';

@Component({
	selector: 'app-sale-order-note',
	templateUrl: 'sale-order-note.page.html',
	styleUrls: ['sale-order-note.page.scss'],
	standalone: false,
})
export class SaleOrderNotePage extends PageBase {
	statusList = [];
	branch;
	customer;

	constructor(
		public pageProvider: SALE_OrderProvider,
		public saleOrderDetailProvider: SALE_OrderDetailProvider,
		public contactProvider: CRM_ContactProvider,
		public sysConfigProvider: SYS_ConfigProvider,
		public branchProvider: BRA_BranchProvider,
		public printingService: PrintingService,
		public modalController: ModalController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location,
		public route: ActivatedRoute
	) {
		super();

		this.pageConfig.pageName = 'sale-order-note';
		this.id = this.route.snapshot.paramMap.get('id');
		this.pageConfig.isShowFeature = this.id ? false : true;

		this.query.IDStatus = '[104, 105, 109, 113, 114]'; // đã duyệt/đã giao việc/đã giao hàng/done/còn nợ
	}

	isShowPackingUoM = true;

	preLoadData(event) {
		let sysConfigQuery = ['SOIsRemoveItemsWithZeroPriceOnOrderNote'];
		Promise.all([
			this.env.getStatus('SalesOrder'),
			this.sysConfigProvider.read({
				Code_in: sysConfigQuery,
				IDBranch: this.env.selectedBranch,
			}),
		]).then((values: any) => {
			this.statusList = values[0];
			values[1]['data'].forEach((e) => {
				if ((e.Value == null || e.Value == 'null') && e._InheritedConfig) {
					e.Value = e._InheritedConfig.Value;
				}
				this.pageConfig[e.Code] = JSON.parse(e.Value);
			});
			super.preLoadData(event);
		});
	}

	loadedData(event) {
		if (window.location.host.indexOf('artlogistics') > -1) {
			this.isShowPackingUoM = false;
		}

		this.items.forEach((i) => {
			i.OrderDateText = lib.dateFormat(i.OrderDate, 'dd/mm/yy hh:MM');
			i.ExpectedReceiptDateText = lib.dateFormat(i.ExpectedReceiptDate, 'dd/mm/yy hh:MM');
			i.OrderTimeText = lib.dateFormat(i.OrderDate, 'hh:MM');
		});

		if (this.id) {
			this.loadSaleOrderNote({ Id: this.id });
		}

		super.loadedData(event);
	}

	selectedSaleOrderID = 0;
	sheets: any[] = [];
	loadSaleOrderNote(i) {
		this.selectedSaleOrderID = i.Id;
		this.id = this.selectedSaleOrderID;

		let newURL = `#/sale-order-note/${this.id}`;
		history.pushState({}, null, newURL);

		this.env.showLoading('Please wait for a few moments', this.pageProvider.read({ IDParent: this.id })).then((resp) => {
			let SOList = resp['data'];
			SOList = SOList.filter((d) => d.Status != 'Cancelled');

			let queryLines = SOList.map((m) => m.Id);
			queryLines.push(parseInt(this.id));

			this.saleOrderDetailProvider.read({ IDOrder: JSON.stringify(queryLines) }).then((rows) => {
				let allLines = rows['data'];
				if (this.pageConfig['SOIsRemoveItemsWithZeroPriceOnOrderNote']) {
					allLines = allLines.filter((line) => line.UoMPrice > 0);
				}
				let helper = {};

				allLines = allLines.reduce(function (r, o) {
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

				this.pageProvider
					.getAnItem(i.Id)
					.then((resp: any) => {
						SOList.push(resp);

						resp.Received = SOList?.map((x) => x.Received).reduce((a, b) => +a + +b, 0);
						console.log(resp);
						if (resp && resp.OrderLines) {
							resp.OrderLines = allLines;
						}
						this.sheets = [resp];

						this.branchProvider.getAnItem(resp['IDBranch']).then((branch: any) => {
							this.branch = branch;

							this.contactProvider.getAnItem(resp['IDContact']).then((customer: any) => {
								this.customer = customer;

								for (let si = 0; si < this.sheets.length; si++) {
									let o = this.sheets[si];
									o.BranchName = this.branch?.Name;
									o.BranchLogoURL = this.branch?.LogoURL;
									o.BranchAddress = this.branch?.Address;
									o.CustomerAddress = this.customer?.BillingAddress;

									o.CustomerName = this.customer?.CustomerName;
									o.WorkPhone = this.customer?.WorkPhone;

									o.OrderDateText = lib.dateFormat(o.OrderDate, 'dd/mm/yy hh:MM');
									o.StatusText = lib.getAttrib(o.IDStatus, this.env.statusList, 'Name', 'NA', 'Id');
									o._Status = this.statusList.find((d) => d.Id == o.IDStatsu || (o.Status && d.Code == o.Status));

									QRCode.toDataURL(
										'SO:' + o.Id,
										{
											errorCorrectionLevel: 'H',
											version: 2,
											width: 500,
											scale: 20,
											type: 'image/webp',
										},
										function (err, url) {
											o.QRC = url;
										}
									);

									o.OrderLines = allLines;
									this.calcOrder(o);

									o.DocTienBangChu = this.DocTienBangChu(o.Debt);
								}

								setTimeout(() => {
									this.calcPageBreak();
								}, 100);
							});
						});
					})
					.catch((err) => {
						console.log(err);
						if (err.message != null) this.env.showMessage(err.message, 'danger');
						else this.env.showMessage('Không tạo được bảng kê, xin vui lòng kiểm tra lại.', 'danger');
					});

				// let itemIds = allLines.map(m => m.IDItem);
				// this.itemProvider.search({ Id: JSON.stringify(itemIds), IDSO: this.id }).toPromise().then((resp: any) => {
				//     this.preLoadItems = resp;

				//     super.preLoadData(event);
				// })
			});
		});
	}

	private calcOrder(o) {
		o.TotalBeforeDiscount = 0;
		o.TotalDiscount = 0;
		o.Tax = 0;
		o.TotalAfterTax = 0;
		o.CalcTotalAdditions = 0;
		o.CalcTotal = 0;
		o.DiscountFromSalesman = 0;
		o._TotalAfterDiscountFromSalesman = 0;

		for (let line of o.OrderLines) {
			line._serviceCharge = 0;
			if (
				o.IDBranch == 174 || //W-Cafe
				o.IDBranch == 17 || //The Log
				o.IDBranch == 416 //Gem Cafe && set menu  && line._item.IDMenu == 218
			) {
				line._serviceCharge = 5;
			}

			//Parse data + Tính total
			line.UoMPrice = line.IsPromotionItem ? 0 : parseFloat(line.UoMPrice) || 0;
			line.TaxRate = parseFloat(line.TaxRate) || 0;
			line.ShippedQuantity = parseFloat(line.ShippedQuantity) || 0;

			line.TotalBeforeDiscount = line.UoMPrice * line.ShippedQuantity;
			o.TotalBeforeDiscount += line.TotalBeforeDiscount;

			//line.Promotion
			line.Discount1 = line.IsPromotionItem ? 0 : parseFloat(line.Discount1) || 0;
			line.Discount2 = line.IsPromotionItem ? 0 : parseFloat(line.Discount2) || 0;
			line.DiscountByItem = line.Discount1 + line.Discount2;
			line.DiscountByGroup = 0;
			line.DiscountByLine = line.DiscountByItem + line.DiscountByGroup;
			line.DiscountByOrder = 0;
			line.TotalDiscount = line.DiscountByLine + line.DiscountByOrder;
			o.TotalDiscount += line.TotalDiscount;

			line.TotalAfterDiscount = line.TotalBeforeDiscount - line.TotalDiscount;
			line.Tax = line.TotalAfterDiscount * (line.TaxRate / 100.0);
			o.Tax += line.Tax;
			line.TotalAfterTax = line.TotalAfterDiscount + line.Tax;
			o.TotalAfterTax += line.TotalAfterTax;

			line.CalcTotalAdditions = line.TotalAfterDiscount * (line._serviceCharge / 100.0) * (1 + line.TaxRate / 100.0);
			o.CalcTotalAdditions += line.CalcTotalAdditions;

			line.CalcTotal = line.TotalAfterTax + line.CalcTotalAdditions;
			o.CalcTotal += line.CalcTotal;

			line.DiscountFromSalesman = parseFloat(line.DiscountFromSalesman) || 0;
			o.DiscountFromSalesman += line.DiscountFromSalesman;

			line._TotalAfterDiscountFromSalesman = line.CalcTotal - line.DiscountFromSalesman;
			o._TotalAfterDiscountFromSalesman += line._TotalAfterDiscountFromSalesman;
		}

		o.Debt = o._TotalAfterDiscountFromSalesman - o.Received;
	}

	printMode = 'A4';
	changePrintMode() {
		this.printMode = this.printMode == 'A4' ? 'A5' : 'A4';
		this.calcPageBreak();
	}

	calcPageBreak() {
		let sheets = document.querySelectorAll('.sheet');

		var e = document.createElement('div');
		e.style.position = 'absolute';
		e.style.width = '147mm';
		document.body.appendChild(e);
		var rect = e.getBoundingClientRect();
		document.body.removeChild(e);
		let A5Height = rect.width;

		if (this.printMode == 'A5') {
			sheets.forEach((s: any) => {
				s.style.pageBreakAfter = 'always';
				s.style.borderBottom = 'none';
				s.style.minHeight = '147mm';

				if (s.clientHeight > A5Height * 6 + 20) {
					s.style.minHeight = '1180mm';
				} else if (s.clientHeight > A5Height * 4 + 20) {
					s.style.minHeight = '885mm';
				} else if (s.clientHeight > A5Height * 2 + 20) {
					s.style.minHeight = '590mm';
				} else if (s.clientHeight > A5Height + 20) {
					s.style.minHeight = '295mm';
				}
			});
		} else {
			sheets.forEach((s: any) => {
				s.style.breakAfter = 'unset';
				s.style.minHeight = '148mm';
				//s.style.borderBottom = 'dashed 1px #ccc';

				if (s.clientHeight > A5Height * 6 + 20) {
					s.style.minHeight = '1180mm';
					s.style.pageBreakBefore = 'always';
					s.style.pageBreakAfter = 'always';
				} else if (s.clientHeight > A5Height * 4 + 20) {
					s.style.minHeight = '885mm';
					s.style.pageBreakBefore = 'always';
					s.style.pageBreakAfter = 'always';
				} else if (s.clientHeight > A5Height * 2 + 20) {
					s.style.minHeight = '590mm';
					s.style.pageBreakBefore = 'always';
					s.style.pageBreakAfter = 'always';
				} else if (s.clientHeight > A5Height + 20) {
					s.style.minHeight = '295mm';
					s.style.pageBreakBefore = 'always';
					s.style.pageBreakAfter = 'always';
				}
			});
		}
	}

	DocSo3ChuSo(baso) {
		var ChuSo = new Array(' không ', ' một ', ' hai ', ' ba ', ' bốn ', ' năm ', ' sáu ', ' bảy ', ' tám ', ' chín ');

		var tram;
		var chuc;
		var donvi;
		var KetQua = '';
		tram = parseInt(baso / 100 + '');
		chuc = parseInt((baso % 100) / 10 + '');
		donvi = baso % 10;
		if (tram == 0 && chuc == 0 && donvi == 0) return '';
		if (tram != 0) {
			KetQua += ChuSo[tram] + ' trăm ';
			if (chuc == 0 && donvi != 0) KetQua += ' linh ';
		}
		if (chuc != 0 && chuc != 1) {
			KetQua += ChuSo[chuc] + ' mươi';
			if (chuc == 0 && donvi != 0) KetQua = KetQua + ' linh ';
		}
		if (chuc == 1) KetQua += ' mười ';
		switch (donvi) {
			case 1:
				if (chuc != 0 && chuc != 1) {
					KetQua += ' mốt ';
				} else {
					KetQua += ChuSo[donvi];
				}
				break;
			case 5:
				if (chuc == 0) {
					KetQua += ChuSo[donvi];
				} else {
					KetQua += ' lăm ';
				}
				break;
			default:
				if (donvi != 0) {
					KetQua += ChuSo[donvi];
				}
				break;
		}
		return KetQua;
	}
	print() {
		let contents = document.getElementsByClassName('sheet');
		for (let content of [...Array.from(contents)]) {
			//let ele = this.printingService.applyAllStyles(content);
			let data: printData = {
				content: content.outerHTML,
				type: 'html',
				options: {
					// tray: '1',
					jobName: `PrintJob_${new Date().toISOString()}.pdf`,
					copies: 2,
					//orientation: 'landscape',
					duplex: 'duplex',
					autoStyle: content,
				},
			};
			this.printingService.print(data);
		}
	}
	DocTienBangChu(SoTien) {
		var Tien = new Array('', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ');

		var lan = 0;
		var i = 0;
		var so = 0;
		var KetQua = '';
		var tmp = '';
		var ViTri = new Array();
		if (SoTien < 0) return 'Số tiền âm !';
		if (SoTien == 0) return 'Không đồng !';
		if (SoTien > 0) {
			so = SoTien;
		} else {
			so = -SoTien;
		}
		if (SoTien > 8999999999999999) {
			//SoTien = 0;
			return 'Số quá lớn!';
		}
		ViTri[5] = Math.floor(so / 1000000000000000);
		if (isNaN(ViTri[5])) ViTri[5] = '0';
		so = so - parseFloat(ViTri[5].toString()) * 1000000000000000;
		ViTri[4] = Math.floor(so / 1000000000000);
		if (isNaN(ViTri[4])) ViTri[4] = '0';
		so = so - parseFloat(ViTri[4].toString()) * 1000000000000;
		ViTri[3] = Math.floor(so / 1000000000);
		if (isNaN(ViTri[3])) ViTri[3] = '0';
		so = so - parseFloat(ViTri[3].toString()) * 1000000000;
		ViTri[2] = parseInt(so / 1000000 + '');
		if (isNaN(ViTri[2])) ViTri[2] = '0';
		ViTri[1] = parseInt((so % 1000000) / 1000 + '');
		if (isNaN(ViTri[1])) ViTri[1] = '0';
		ViTri[0] = parseInt((so % 1000) + '');
		if (isNaN(ViTri[0])) ViTri[0] = '0';
		if (ViTri[5] > 0) {
			lan = 5;
		} else if (ViTri[4] > 0) {
			lan = 4;
		} else if (ViTri[3] > 0) {
			lan = 3;
		} else if (ViTri[2] > 0) {
			lan = 2;
		} else if (ViTri[1] > 0) {
			lan = 1;
		} else {
			lan = 0;
		}
		for (i = lan; i >= 0; i--) {
			tmp = this.DocSo3ChuSo(ViTri[i]);
			KetQua += tmp;
			if (ViTri[i] > 0) KetQua += Tien[i];
			if (i > 0 && tmp.length > 0) KetQua += ','; //&& (!string.IsNullOrEmpty(tmp))
		}
		if (KetQua.substring(KetQua.length - 1) == ',') {
			KetQua = KetQua.substring(0, KetQua.length - 1);
		}
		KetQua = KetQua.substring(1, 2).toUpperCase() + KetQua.substring(2) + ' đồng';
		return KetQua; //.substring(0, 1);//.toUpperCase();// + KetQua.substring(1);
	}

	toggleDateFilter() {
		// ["104, 105, 109, 113, 114"]; // đã duyệt/đã giao việc/đã giao hàng/done/còn nợ

		this.query.IDStatus = this.query.IDStatus == '[104, 105, 109, 113, 114]' ? '' : '[104, 105, 109, 113, 114]';
		if (this.query.IDStatus == '[104, 105, 109, 113, 114]') {
			this.query.OrderDate = '';
		} else {
			let today = new Date();
			this.query.OrderDate = lib.dateFormat(today.setDate(today.getDate()), 'yyyy-mm-dd');
		}

		this.refresh();
	}
}
