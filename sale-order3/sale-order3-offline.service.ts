import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EnvService } from 'src/app/services/core/env.service';
import { StorageService } from 'src/app/services/core/storage.service';
import { DemoCartLine, DemoOrderMeta, DemoOutlet, emptyOrderMeta, normalizeOrderMeta } from './demo-data';
import { CatalogL1, CatalogProduct } from './product-category-modal/product-category-modal.mock';

export const SO3_DRAFT_KEY = 'sale-order3.offline.draft';
export const SO3_CATALOG_KEY = 'sale-order3.offline.catalog';

export interface So3OfflineDraft {
	outlet: DemoOutlet | null;
	cart: DemoCartLine[];
	orderMeta: DemoOrderMeta;
	updatedAt: number;
}

export interface So3CatalogCache {
	categories: CatalogL1[];
	products: CatalogProduct[];
	updatedAt: number;
}

export function parseSo3Draft(raw: any): So3OfflineDraft | null {
	if (!raw || typeof raw !== 'object') return null;
	const cart = Array.isArray(raw.cart) ? raw.cart.filter((l) => l && l.ItemId != null && l.Qty > 0) : [];
	const outlet = raw.outlet && raw.outlet.Id != null ? raw.outlet : null;
	return {
		outlet,
		cart,
		orderMeta: normalizeOrderMeta(raw.orderMeta),
		updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
	};
}

export function parseSo3CatalogCache(raw: any): So3CatalogCache | null {
	if (!raw || typeof raw !== 'object') return null;
	if (!Array.isArray(raw.categories) || !Array.isArray(raw.products)) return null;
	if (!raw.categories.length || !raw.products.length) return null;
	return {
		categories: raw.categories,
		products: raw.products,
		updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
	};
}

@Injectable({ providedIn: 'root' })
export class SaleOrder3OfflineService {
	private readonly draftSubject = new BehaviorSubject<So3OfflineDraft | null>(null);
	private readonly catalogSubject = new BehaviorSubject<So3CatalogCache | null>(null);
	private draftHydrated = false;
	private catalogHydrated = false;

	readonly draft$ = this.draftSubject.asObservable();
	readonly catalog$ = this.catalogSubject.asObservable();

	constructor(
		private storage: StorageService,
		private env: EnvService
	) {}

	isOnline(): boolean {
		if (this.env?.app && typeof this.env.app.isOnline === 'boolean') {
			return !!this.env.app.isOnline;
		}
		return typeof navigator === 'undefined' ? true : !!navigator.onLine;
	}

	/** Notify and return true when offline (caller should skip network refresh). */
	warnIfOffline(keepCached = true): boolean {
		if (this.isOnline()) return false;
		this.env.showMessage(
			keepCached
				? 'No internet connection. Keeping current data.'
				: 'No internet connection.',
			'warning'
		);
		return true;
	}

	getDraftSnapshot(): So3OfflineDraft | null {
		return this.draftSubject.value;
	}

	getCatalogSnapshot(): So3CatalogCache | null {
		return this.catalogSubject.value;
	}

	async loadDraft(): Promise<So3OfflineDraft | null> {
		if (this.draftHydrated && this.draftSubject.value) {
			return this.draftSubject.value;
		}
		try {
			const raw = await this.storage.get(SO3_DRAFT_KEY);
			const draft = parseSo3Draft(raw);
			this.draftSubject.next(draft);
			this.draftHydrated = true;
			return draft;
		} catch {
			this.draftHydrated = true;
			return this.draftSubject.value;
		}
	}

	async saveDraft(
		outlet: DemoOutlet | null,
		cart: DemoCartLine[],
		orderMeta?: DemoOrderMeta | null
	): Promise<So3OfflineDraft> {
		const prevMeta = this.draftSubject.value?.orderMeta;
		const draft: So3OfflineDraft = {
			outlet: outlet ? { ...outlet } : null,
			cart: (cart || []).map((l) => ({ ...l })),
			orderMeta: normalizeOrderMeta(orderMeta != null ? orderMeta : prevMeta || emptyOrderMeta()),
			updatedAt: Date.now(),
		};
		this.draftSubject.next(draft);
		this.draftHydrated = true;
		try {
			await this.storage.set(SO3_DRAFT_KEY, draft);
		} catch {
			/* quota / storage init */
		}
		return draft;
	}

	async clearDraft(): Promise<void> {
		this.draftSubject.next(null);
		this.draftHydrated = true;
		try {
			await this.storage.remove(SO3_DRAFT_KEY);
		} catch {
			/* ignore */
		}
	}

	async loadCatalogCache(): Promise<So3CatalogCache | null> {
		if (this.catalogHydrated && this.catalogSubject.value) {
			return this.catalogSubject.value;
		}
		try {
			const raw = await this.storage.get(SO3_CATALOG_KEY);
			const cache = parseSo3CatalogCache(raw);
			this.catalogSubject.next(cache);
			this.catalogHydrated = true;
			return cache;
		} catch {
			this.catalogHydrated = true;
			return this.catalogSubject.value;
		}
	}

	async saveCatalogCache(categories: CatalogL1[], products: CatalogProduct[]): Promise<So3CatalogCache | null> {
		const cache = parseSo3CatalogCache({
			categories,
			products,
			updatedAt: Date.now(),
		});
		if (!cache) return null;
		this.catalogSubject.next(cache);
		this.catalogHydrated = true;
		try {
			await this.storage.set(SO3_CATALOG_KEY, cache);
		} catch {
			/* ignore */
		}
		return cache;
	}
}
