import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonContent, ModalController } from '@ionic/angular';
import { VirtualViewportComponent } from 'src/app/components/virtual-scroll/virtual-viewport.component';
import { addToCart, cartLineCount, cartQty } from '../cart.util';
import { DemoCartLine, DemoOutlet, DemoProduct } from '../demo-data';
import {
	CatalogL1,
	CatalogProduct,
	MOCK_CATALOG_L1,
	MOCK_CATALOG_PRODUCTS,
	SUGGEST_L1_ID,
} from './product-category-modal.mock';
import {
	CatalogVirtualRow,
	activeL1FromSectionTops,
	buildCatalogVirtualRows,
	filterCatalogProducts,
	firstRowIdForL1,
	formatCatalogPrice,
	formatStockSplits,
} from './product-category-modal.util';
import { SaleOrder3OfflineService } from '../sale-order3-offline.service';
import { EnvService } from 'src/app/services/core/env.service';

@Component({
	selector: 'app-sale-order3-product-category-modal',
	templateUrl: './product-category-modal.component.html',
	styleUrls: ['./product-category-modal.component.scss'],
	standalone: false,
})
export class SaleOrder3ProductCategoryModalComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() customer: DemoOutlet | null = null;
	@Input() cart: DemoCartLine[] = [];
	/** Hardcoded off for now — wire to config later (POSIsShowItemImage). */
	showItemImage = false;

	@ViewChild(IonContent, { static: false }) content?: IonContent;
	@ViewChild('catalogHeader', { static: false, read: ElementRef }) headerRef?: ElementRef<HTMLElement>;
	@ViewChild('rail', { static: false }) railRef?: ElementRef<HTMLElement>;
	@ViewChild('catalogMain', { static: false }) catalogMainRef?: ElementRef<HTMLElement>;
	@ViewChild('vp', { static: false }) vp?: VirtualViewportComponent;

	categories: CatalogL1[] = MOCK_CATALOG_L1;
	products: CatalogProduct[] = MOCK_CATALOG_PRODUCTS;
	rows: CatalogVirtualRow[] = [];
	visibleCategories: CatalogL1[] = MOCK_CATALOG_L1;
	productSearch = '';
	activeL1Id = SUGGEST_L1_ID;
	refreshing = false;
	scrollToRowId: string | null = null;
	scrollTick = 0;
	/** Header (title + search) height — subtracted from scroll target so L2 sits under it. */
	scrollInsetTop = 0;
	formatPrice = formatCatalogPrice;
	formatStock = formatStockSplits;
	trackByRow = (_: number, row: CatalogVirtualRow) => row.TrackId;
	trackByCat = (_: number, c: CatalogL1) => c.Id;
	trackByProduct = (_: number, p: CatalogProduct) => p.Id;

	private syncingFromClick = false;
	private scrollRaf = 0;
	private scrollEl?: HTMLElement;
	private nativeScrollHandler?: () => void;
	private searchRaf = 0;

	get customerName(): string {
		return this.customer?.Name || 'Catalog';
	}

	get cartCount(): number {
		return cartLineCount(this.cart || []);
	}

	/**
	 * Trailing scroll room so the last product card can sit fully above the fold.
	 * Applied both as a virtual end-spacer row (measured) and VP endSpacerPx.
	 */
	get endSpacerPx(): number {
		const inset = Number(this.scrollInsetTop) || 0;
		const vh = typeof window !== 'undefined' ? window.innerHeight || 0 : 0;
		// ≥ half viewport so under-measured rows above still leave room to scroll into measure.
		return Math.max(360, inset + 200, Math.round(vh * 0.45));
	}

	async ngOnInit() {
		this.cart = (this.cart || []).map((l) => ({ ...l }));
		await this.hydrateCatalog();
		this.applyProductFilter();
		void this.persistCartDraft();
	}

	ngAfterViewInit() {
		this.bindNativeScroll().then(() => this.refreshScrollInset());
	}

	ngOnDestroy() {
		if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
		if (this.searchRaf) cancelAnimationFrame(this.searchRaf);
		this.unbindNativeScroll();
	}

	onSearchInput(ev?: any) {
		this.productSearch = (ev?.detail?.value ?? this.productSearch ?? '').toString();
		if (this.searchRaf) cancelAnimationFrame(this.searchRaf);
		this.searchRaf = requestAnimationFrame(() => {
			this.ngZone.run(() => this.applyProductFilter());
		});
	}

	onSearchClear() {
		this.productSearch = '';
		this.applyProductFilter();
	}

	/** Reload catalog (API later). Offline → keep cache and warn; never clear old data. */
	async refreshCatalog() {
		if (this.refreshing) return;
		if (this.so3Offline.warnIfOffline(true)) return;
		this.refreshing = true;
		try {
			this.categories = this.cloneCategories(MOCK_CATALOG_L1);
			this.products = this.cloneProducts(MOCK_CATALOG_PRODUCTS);
			await this.so3Offline.saveCatalogCache(this.categories, this.products);
			this.applyProductFilter();
			await this.refreshScrollInset();
			setTimeout(() => this.vp?.invalidateHeights(), 0);
			const top = firstRowIdForL1(this.rows, this.activeL1Id) || this.rows[0]?.TrackId || null;
			if (top) {
				this.scrollToRowId = top;
				this.scrollTick++;
			}
			this.env.showMessage('Data loaded', 'success', null, 1200);
		} finally {
			setTimeout(() => {
				this.refreshing = false;
			}, 280);
		}
	}

	private async hydrateCatalog() {
		const cached = await this.so3Offline.loadCatalogCache();
		if (cached) {
			this.categories = cached.categories;
			this.products = cached.products;
			return;
		}
		this.categories = this.cloneCategories(MOCK_CATALOG_L1);
		this.products = this.cloneProducts(MOCK_CATALOG_PRODUCTS);
		await this.so3Offline.saveCatalogCache(this.categories, this.products);
	}

	private cloneCategories(list: CatalogL1[]): CatalogL1[] {
		return (list || []).map((c) => ({
			...c,
			Children: c.Children?.map((ch) => ({ ...ch, ProductIds: [...(ch.ProductIds || [])] })),
			ProductIds: c.ProductIds ? [...c.ProductIds] : undefined,
		}));
	}

	private cloneProducts(list: CatalogProduct[]): CatalogProduct[] {
		return (list || []).map((p) => ({
			...p,
			Stock: p.Stock?.map((s) => ({ ...s, Splits: s.Splits.map((x) => ({ ...x })) })),
		}));
	}

	private persistCartDraft() {
		return this.so3Offline.saveDraft(this.customer, this.cart);
	}

	private applyProductFilter() {
		const filtered = filterCatalogProducts(this.products, this.productSearch);
		this.rows = buildCatalogVirtualRows(this.categories, filtered, { endSpacerPx: this.endSpacerPx });
		const l1Ids = new Set(this.rows.filter((r) => r.Kind !== 'end-spacer').map((r) => r.L1Id));
		this.visibleCategories = this.productSearch.trim()
			? this.categories.filter((c) => l1Ids.has(c.Id))
			: this.categories;
		if (!l1Ids.has(this.activeL1Id)) {
			this.activeL1Id = this.visibleCategories[0]?.Id || this.categories[0]?.Id || SUGGEST_L1_ID;
		}
		setTimeout(() => this.vp?.invalidateHeights(), 0);
	}

	qtyOf(p: CatalogProduct): number {
		return cartQty(this.cart, p.Id);
	}

	close() {
		void this.persistCartDraft();
		return this.modalCtrl.dismiss({ cart: this.cart }, 'back');
	}

	/** Re-open customer picker (keep cart draft). */
	pickAgain() {
		return this.close();
	}

	/** Close catalog first — page opens cart alone (no stacked modals). */
	openCart() {
		if (this.cartCount === 0) return;
		void this.persistCartDraft();
		return this.modalCtrl.dismiss({ cart: this.cart }, 'cart');
	}

	plus(p: CatalogProduct) {
		const asDemo: DemoProduct = {
			Id: p.Id,
			Name: p.Name,
			Price: p.Price,
			UoM: p.UoM,
			CategoryId: 0,
			ImageColor: p.ImageColor,
			Favorite: p.Favorite,
		};
		this.cart = addToCart(this.cart, asDemo, 1);
		void this.persistCartDraft();
	}

	async selectL1(cat: CatalogL1) {
		if (!cat?.Id) return;
		this.activeL1Id = cat.Id;
		const target = firstRowIdForL1(this.rows, cat.Id);
		if (!target) return;
		await this.refreshScrollInset();
		this.syncingFromClick = true;
		this.scrollToRowId = target;
		this.scrollTick++;
		// Hold through scrollDurationMs (300) + settle; re-pin so end position does not fall to n-1.
		setTimeout(() => {
			this.activeL1Id = cat.Id;
			this.syncingFromClick = false;
		}, 400);
		this.scrollRailIntoView(cat.Id);
	}

	/** Measure sticky header so scroll target = rowOffset + viewportOffset - headerHeight. */
	private async refreshScrollInset() {
		const header = this.headerRef?.nativeElement;
		const scrollEl = this.scrollEl || (await this.content?.getScrollElement());
		if (!header || !scrollEl) return;
		this.scrollEl = scrollEl;
		const next = Math.max(0, Math.round(header.getBoundingClientRect().bottom - scrollEl.getBoundingClientRect().top));
		const prevSpacer = this.endSpacerPx;
		this.scrollInsetTop = next;
		// Rebuild trailing spacer once header inset is known (first open).
		if (Math.abs(this.endSpacerPx - prevSpacer) >= 8) {
			this.applyProductFilter();
		}
	}

	onContentScroll() {
		this.scheduleActiveSync();
	}

	private scheduleActiveSync() {
		if (this.syncingFromClick) return;
		if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
		this.scrollRaf = requestAnimationFrame(() => {
			this.ngZone.run(() => this.syncActiveFromScroll());
		});
	}

	private async bindNativeScroll() {
		const el = await this.content?.getScrollElement();
		if (!el || this.nativeScrollHandler) return;
		this.scrollEl = el;
		this.nativeScrollHandler = () => this.scheduleActiveSync();
		this.ngZone.runOutsideAngular(() => {
			el.addEventListener('scroll', this.nativeScrollHandler!, { passive: true });
		});
	}

	private unbindNativeScroll() {
		if (this.scrollEl && this.nativeScrollHandler) {
			this.scrollEl.removeEventListener('scroll', this.nativeScrollHandler);
		}
		this.scrollEl = undefined;
		this.nativeScrollHandler = undefined;
	}

	private async syncActiveFromScroll() {
		// Light DOM lives outside ion-content shadow scrollEl — query catalog-main, not scrollEl.
		const root = this.catalogMainRef?.nativeElement;
		if (!root) return;
		const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-row-anchor][data-l1]'));
		if (!nodes.length) return;
		// Sticky line = bottom of header (title + search). Fixed 56px was wrong after search toolbar.
		const headerBottom = this.headerRef?.nativeElement?.getBoundingClientRect().bottom;
		const scrollEl = this.scrollEl || (await this.content?.getScrollElement());
		const stickyY = headerBottom ?? (scrollEl?.getBoundingClientRect().top ?? 0) + 96;
		const tops = nodes
			.map((el) => ({
				L1Id: el.getAttribute('data-l1') || '',
				top: el.getBoundingClientRect().top - stickyY,
			}))
			.filter((t) => t.L1Id);
		// Band below header: click-scroll often lands section a bit under stickyY.
		const next = activeL1FromSectionTops(tops, 0, 56);
		if (next && next !== this.activeL1Id) {
			this.activeL1Id = next;
			this.scrollRailIntoView(next);
		}
	}

	private scrollRailIntoView(l1Id: string) {
		const rail = this.railRef?.nativeElement;
		if (!rail) return;
		const btn = rail.querySelector(`[data-rail-id="${l1Id}"]`) as HTMLElement | null;
		btn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	constructor(
		private modalCtrl: ModalController,
		private ngZone: NgZone,
		private so3Offline: SaleOrder3OfflineService,
		private env: EnvService
	) {}
}
