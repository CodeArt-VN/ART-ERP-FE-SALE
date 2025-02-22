import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleOrderMobileViewerPage } from './sale-order-mobile-viewer.page';

describe('SaleOrderMobileViewerPage', () => {
	let component: SaleOrderMobileViewerPage;
	let fixture: ComponentFixture<SaleOrderMobileViewerPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SaleOrderMobileViewerPage],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SaleOrderMobileViewerPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
