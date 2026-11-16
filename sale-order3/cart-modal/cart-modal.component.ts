import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { POSInvoiceModalPage } from 'src/app/pages/POS/pos-invoice-modal/pos-invoice-modal.page';
import { EnvService } from 'src/app/services/core/env.service';
import {
	CartSummary,
	buildCartSummary,
	cartLineCount,
	lineHasAdjustedUnitPrice,
	lineListUnitPrice,
	parseQtyInput,
	patchCartLine,
	recalcCartLine,
	setCartQty,
} from '../cart.util';
import { DemoCartLine, DemoOrderMeta, DemoOutlet, emptyOrderMeta, formatVnd, normalizeOrderMeta } from '../demo-data';
import { SaleOrder3OfflineService } from '../sale-order3-offline.service';
import { customerPickTypeIcon, formatDistanceM } from '../new-order-modal/new-order-modal.util';
import {
	allCartLinesExpanded,
	pruneExpandedLineIds,
	toggleAllCartLinesExpanded,
	toggleExpandedLineId,
} from './cart-expand.util';
import { invoiceMetaFromSelection } from './cart-invoice.util';

@Component({
	selector: 'app-sale-order3-cart-modal',
	templateUrl: './cart-modal.component.html',
	styleUrls: ['./cart-modal.component.scss'],
	standalone: false,
})
export class SaleOrder3CartModalComponent implements OnInit {
	@Input() customer: DemoOutlet | null = null;
	@Input() cart: DemoCartLine[] = [];
	@Input() orderMeta: DemoOrderMeta | null = null;

	/** ItemIds with advanced controls expanded under the −/+ row. */
	expandedLineIds: number[] = [];
	/** Expand discount breakdown above footer (Shopee-style). */
	showDiscountDetail = false;
	meta: DemoOrderMeta = emptyOrderMeta();

	formatVnd = formatVnd;
	formatDistanceM = formatDistanceM;
	customerTypeIcon = customerPickTypeIcon;
	listUnitPrice = lineListUnitPrice;
	hasAdjustedUnitPrice = lineHasAdjustedUnitPrice;
	trackByLine = (_: number, line: DemoCartLine) => line.ItemId;

	get cartCount(): number {
		return cartLineCount(this.cart || []);
	}

	get summary(): CartSummary {
		return buildCartSummary(this.cart || [], {
			serviceCharge: this.meta?.ServiceCharge,
			received: this.meta?.Received,
		});
	}

	get cartSum(): number {
		return this.summary.amountDue;
	}

	get discountTotal(): number {
		const s = this.summary;
		return Math.max(0, s.beforeDiscount - s.total);
	}

	get allLinesExpanded(): boolean {
		return allCartLinesExpanded(
			this.expandedLineIds,
			(this.cart || []).map((l) => l.ItemId)
		);
	}

	constructor(
		private modalCtrl: ModalController,
		private so3Offline: SaleOrder3OfflineService,
		private env: EnvService
	) {}

	ngOnInit() {
		this.meta = normalizeOrderMeta(this.orderMeta);
		this.cart = (this.cart || []).map((l) => recalcCartLine(this.ensureFullFields(l)));
	}

	isLineExpanded(line: DemoCartLine): boolean {
		return this.expandedLineIds.includes(line.ItemId);
	}

	/** Tap row (not −/+/trash) → toggle advanced for that line only. */
	toggleLineAdvanced(line: DemoCartLine) {
		this.expandedLineIds = toggleExpandedLineId(this.expandedLineIds, line.ItemId);
	}

	/** Footer Advanced/Simple → expand or collapse every line. */
	toggleFullControls() {
		this.expandedLineIds = toggleAllCartLinesExpanded(
			this.expandedLineIds,
			(this.cart || []).map((l) => l.ItemId)
		);
	}

	private syncExpandedIds() {
		this.expandedLineIds = pruneExpandedLineIds(
			this.expandedLineIds,
			(this.cart || []).map((l) => l.ItemId)
		);
	}

	toggleDiscountDetail() {
		if (this.cartCount === 0) return;
		this.showDiscountDetail = !this.showDiscountDetail;
	}

	onMetaChange() {
		void this.persist();
	}

	toggleFlag(key: 'IsSampleOrder' | 'IsUrgentOrders' | 'IsWholeSale' | 'IsShipBySaleMan') {
		this.meta = { ...this.meta, [key]: !this.meta[key] };
		void this.persist();
	}

	async openInvoiceRequired() {
		if (!this.customer?.Id) return;
		const modal = await this.modalCtrl.create({
			component: POSInvoiceModalPage,
			canDismiss: true,
			showBackdrop: true,
			backdropDismiss: true,
			cssClass: 'so3-invoice-modal',
			componentProps: {
				id: this.customer.Id,
				defaultBusinessPartnerId: 0,
				canAddEInvoiceInfo: true,
				currentTaxInfoId: this.meta.IDTaxInfo,
				address: {
					Id: this.customer.Id,
					Name: this.customer.Name,
					WorkPhone: this.customer.Phone,
					AddressLine1: this.customer.Address,
				},
				onUpdateContact: () => {},
			},
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();
		if (data === undefined) return;
		this.meta = invoiceMetaFromSelection(this.meta, data);
		void this.persist();
	}

	closeModal() {
		void this.persist();
		return this.modalCtrl.dismiss(this.dismissPayload(), 'close');
	}

	pickAgain() {
		void this.persist();
		return this.modalCtrl.dismiss(this.dismissPayload(), 'pick-again');
	}

	addProducts() {
		void this.persist();
		return this.modalCtrl.dismiss(this.dismissPayload(), 'add-products');
	}

	async clearCart() {
		if (!this.cartCount) return;
		try {
			await this.env.showPrompt(
				'Are you sure you want to delete all products in the cart?',
				null,
				'Delete all'
			);
		} catch {
			return;
		}
		this.cart = [];
		this.expandedLineIds = [];
		this.showDiscountDetail = false;
		void this.persist();
	}

	changeLineQty(line: DemoCartLine, delta: number) {
		// − at Qty 1 asks confirm (same as trash); avoid silent remove.
		if (delta < 0 && line.Qty <= 1) {
			void this.removeLine(line);
			return;
		}
		this.cart = setCartQty(this.cart, line.ItemId, line.Qty + delta);
		this.syncExpandedIds();
		void this.persist();
	}

	onQtyChange(line: DemoCartLine, raw: string | number) {
		const qty = parseQtyInput(raw);
		if (qty == null || qty === line.Qty) return;
		if (qty <= 0) {
			void this.removeLine(line);
			return;
		}
		this.cart = setCartQty(this.cart, line.ItemId, qty);
		this.syncExpandedIds();
		void this.persist();
	}

	/** Empty / 0 on blur → confirm remove (same as trash). */
	onQtyBlur(line: DemoCartLine, raw: string | number) {
		const qty = parseQtyInput(raw) ?? 0;
		if (qty === line.Qty) return;
		if (qty <= 0) {
			void this.removeLine(line);
			return;
		}
		this.cart = setCartQty(this.cart, line.ItemId, qty);
		this.syncExpandedIds();
		void this.persist();
	}

	onLinePatch(line: DemoCartLine, patch: Partial<DemoCartLine>) {
		this.cart = patchCartLine(this.cart, line.ItemId, patch);
		void this.persist();
	}

	togglePromotion(line: DemoCartLine) {
		this.onLinePatch(line, { IsPromotionItem: !line.IsPromotionItem });
	}

	onUoMChange(line: DemoCartLine, id: string | number) {
		const IDUoM = Number(id);
		const u = (line.UoMs || []).find((x) => x.Id === IDUoM);
		this.onLinePatch(line, { IDUoM, UoM: u?.Name || line.UoM });
	}

	async removeLine(line: DemoCartLine) {
		try {
			await this.env.showPrompt(
				'Are you sure you want to delete the product?',
				line?.Name || null,
				'Remove'
			);
		} catch {
			return;
		}
		this.cart = setCartQty(this.cart, line.ItemId, 0);
		this.syncExpandedIds();
		void this.persist();
	}

	confirmOrder() {
		if (this.cartCount === 0) return;
		void this.persist();
		return this.modalCtrl.dismiss(this.dismissPayload(), 'submit');
	}

	private dismissPayload() {
		return { cart: this.cart, orderMeta: this.meta, customer: this.customer };
	}

	private ensureFullFields(line: DemoCartLine): DemoCartLine {
		const uomName = line.UoM || 'Thùng';
		return {
			...line,
			IDUoM: line.IDUoM ?? 1,
			UoMs: line.UoMs?.length
				? line.UoMs
				: [
						{ Id: 1, Name: uomName },
						{ Id: 2, Name: uomName === 'Hộp' ? 'Thùng' : 'Hộp' },
					],
			UoMPrice: line.UoMPrice ?? line.Price,
			OriginalDiscount1: line.OriginalDiscount1 ?? 0,
			OriginalDiscount2: line.OriginalDiscount2 ?? 0,
			IsPromotionItem: !!line.IsPromotionItem,
			OriginalDiscountFromSalesman: line.OriginalDiscountFromSalesman ?? 0,
			SalesmanPrice: line.SalesmanPrice ?? line.UoMPrice ?? line.Price,
		};
	}

	private persist() {
		return this.so3Offline.saveDraft(this.customer, this.cart, this.meta);
	}
}
