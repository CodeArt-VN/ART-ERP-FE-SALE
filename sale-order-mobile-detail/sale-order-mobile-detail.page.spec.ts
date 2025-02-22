import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleOrderMobileDetailPage } from './sale-order-mobile-detail.page';

describe('SaleOrderMobileDetailPage', () => {
	let component: SaleOrderMobileDetailPage;
	let fixture: ComponentFixture<SaleOrderMobileDetailPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SaleOrderMobileDetailPage],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SaleOrderMobileDetailPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
