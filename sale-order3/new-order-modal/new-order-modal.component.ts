import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subject, of, timer } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { CommonService } from 'src/app/services/core/common.service';
import { EnvService } from 'src/app/services/core/env.service';
import { listCacheScope, readCachedList, writeCachedList } from './new-order-modal.cache';
import { readCachedGeo, resolveGeo } from './new-order-modal.geo';
import { SaleOrder3OfflineService } from '../sale-order3-offline.service';
import {
	CustomerPickRow,
	customerPickTrackId,
	customerPickTypeIcon,
	formatDistanceM,
	isSameCustomerPick,
	mapCustomerPickerRows,
	matchCustomerLocal,
	pinSelectedCustomer,
	sortCustomerPickerRows,
} from './new-order-modal.util';

@Component({
	selector: 'app-sale-order3-new-order-modal',
	templateUrl: './new-order-modal.component.html',
	styleUrls: ['./new-order-modal.component.scss'],
	standalone: false,
})
export class SaleOrder3NewOrderModalComponent implements OnInit, OnDestroy {
	/** Current catalog customer — pinned + highlighted when reopening the picker. */
	@Input() selectedOutlet: { Id?: number; IDAddress?: number; TrackId?: string } | null = null;
	/** Who opened the picker: add | category | cart — page routes after select. */
	@Input() openedFrom: 'add' | 'category' | 'cart' = 'add';

	outletSearch = '';
	trackByCustomer = (_: number, row: CustomerPickRow) => row.TrackId || customerPickTrackId(row);
	formatDistanceM = formatDistanceM;
	customerTypeIcon = customerPickTypeIcon;
	isSelected = (row: CustomerPickRow) => isSameCustomerPick(row, this.selectedOutlet);

	mcpOutlets: CustomerPickRow[] = [];
	loading = false;
	originLat: number | null = null;
	originLng: number | null = null;
	loadError = false;

	private destroy$ = new Subject<void>();
	private search$ = new Subject<string>();
	/** Full default list (empty Keyword) — kept for cache + local filter. */
	private fullRows: CustomerPickRow[] = [];
	private reloadSeq = 0;
	private cacheScope = '';

	constructor(
		private modalCtrl: ModalController,
		private commonService: CommonService,
		private env: EnvService,
		private so3Offline: SaleOrder3OfflineService
	) {}

	get showSpinner(): boolean {
		return this.loading;
	}

	/** MCP title when rows have visit days; otherwise order-for-customer label. */
	get listSectionKey(): string {
		return this.mcpOutlets.some((o) => o.McpDays?.length) ? 'MCP' : 'Create order for customer';
	}

	ngOnInit() {
		this.cacheScope = listCacheScope(this.env.selectedBranch, this.env.user?.StaffID);

		const cachedGeo = readCachedGeo() || readCachedGeo(Date.now(), Number.MAX_SAFE_INTEGER);
		if (cachedGeo) {
			this.originLat = cachedGeo.lat;
			this.originLng = cachedGeo.lng;
		}

		const cachedRows = readCachedList(this.cacheScope);
		if (cachedRows?.length) {
			this.fullRows = cachedRows;
			this.applySortAndFilter();
		}

		this.search$
			.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				tap((term) => {
					this.outletSearch = term;
					this.loadError = false;
					if (this.fullRows.length) this.applySortAndFilter();
					this.loading = !this.fullRows.length;
				}),
				switchMap((term) => {
					const soft = !!this.fullRows.length;
					// Default list: refresh/cache. Keyword: API search (local filter already shown).
					return this.fetchPicker(term).pipe(
						tap((result) => {
							if (!term && !result.error) {
								this.fullRows = result.rows;
								writeCachedList(this.cacheScope, result.rows);
							}
						}),
						map((result) => ({ ...result, soft, term }))
					);
				}),
				takeUntil(this.destroy$)
			)
			.subscribe((result) => {
				this.loading = false;
				if (result.error) {
					if (!this.fullRows.length) this.loadError = true;
					return;
				}
				this.loadError = false;
				if (!result.term) {
					this.fullRows = result.rows;
				} else if (result.rows.length) {
					// Server keyword hit — show API rows for this search (does not wipe full cache).
					this.mcpOutlets = this.withSelectedPinned(sortCustomerPickerRows(result.rows, this.originLat, this.originLng));
					return;
				}
				this.applySortAndFilter();
			});

		this.search$.next('');
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	onSearchInput(ev: any) {
		const term = (ev?.detail?.value ?? this.outletSearch ?? '').toString();
		this.search$.next(term.trim());
	}

	reload() {
		if (this.loading) return;
		if (!this.so3Offline.isOnline()) {
			const cached = readCachedList(this.cacheScope, Date.now(), Number.MAX_SAFE_INTEGER);
			if (cached?.length) {
				this.fullRows = cached;
				this.applySortAndFilter();
				this.env.showMessage('No internet connection. Showing cached data.', 'warning');
			} else if (this.fullRows.length) {
				this.env.showMessage('No internet connection. Keeping current data.', 'warning');
			} else {
				this.env.showMessage('No internet connection.', 'warning');
			}
			return;
		}

		const seq = ++this.reloadSeq;
		this.loading = true;
		this.loadError = false;
		// Keep current rows until fetch succeeds — never clear on failed/offline refresh.
		this.refreshGeoInBackground(true);

		const started = Date.now();
		const term = this.outletSearch.trim();
		this.fetchPicker(term)
			.pipe(
				switchMap((result) => {
					const remain = Math.max(0, 450 - (Date.now() - started));
					return timer(remain).pipe(map(() => result));
				}),
				takeUntil(this.destroy$),
				finalize(() => {
					if (seq === this.reloadSeq) this.loading = false;
				})
			)
			.subscribe((result) => {
				if (seq !== this.reloadSeq) return;
				this.loadError = result.error && !this.fullRows.length;
				if (!result.error) {
					if (!term) {
						this.fullRows = result.rows;
						writeCachedList(this.cacheScope, result.rows);
						this.applySortAndFilter();
					} else {
						this.mcpOutlets = this.withSelectedPinned(sortCustomerPickerRows(result.rows, this.originLat, this.originLng));
					}
					this.env.showMessage('Data loaded', 'success', null, 1200);
				} else {
					this.env.showMessage(
						this.fullRows.length
							? 'No internet connection. Keeping current data.'
							: 'Cannot connect to server.',
						this.fullRows.length ? 'warning' : 'danger'
					);
				}
			});
	}

	close() {
		return this.modalCtrl.dismiss(null, 'cancel');
	}

	pickOutlet(outlet: CustomerPickRow) {
		return this.modalCtrl.dismiss({ outlet }, 'select');
	}

	private refreshGeoInBackground(force: boolean) {
		resolveGeo(force)
			.then((geo) => {
				if (!geo) return;
				const changed = geo.lat !== this.originLat || geo.lng !== this.originLng;
				this.originLat = geo.lat;
				this.originLng = geo.lng;
				if (changed && this.fullRows.length && !this.loading) this.applySortAndFilter();
			})
			.catch(() => {});
	}

	private fetchPicker(keyword: string) {
		const query: any = { Take: 500, Skip: 0 };
		if (keyword) query.Keyword = keyword;
		if (this.originLat != null && this.originLng != null) {
			query.Lat = this.originLat;
			query.Long = this.originLng;
		}
		return this.commonService.connect('GET', 'SALE/Order/CustomerPicker', query).pipe(
			map((rows) => ({
				rows: mapCustomerPickerRows(Array.isArray(rows) ? rows : []),
				error: false,
			})),
			catchError(() => of({ rows: [] as CustomerPickRow[], error: true }))
		);
	}

	private applySortAndFilter() {
		const q = this.outletSearch.trim().toLowerCase();
		const sorted = sortCustomerPickerRows(this.fullRows, this.originLat, this.originLng);
		const filtered = q ? sorted.filter((o) => matchCustomerLocal(o, q)) : sorted;
		this.mcpOutlets = this.withSelectedPinned(filtered);
	}

	private withSelectedPinned(rows: CustomerPickRow[]): CustomerPickRow[] {
		return pinSelectedCustomer(rows, this.selectedOutlet);
	}
}
