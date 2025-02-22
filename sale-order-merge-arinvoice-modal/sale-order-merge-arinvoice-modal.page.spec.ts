import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleOrderMergeARInvoiceModalPage } from './sale-order-merge-arinvoice-modal.page';

describe('SaleOrderMergeModalPage', () => {
	let component: SaleOrderMergeARInvoiceModalPage;
	let fixture: ComponentFixture<SaleOrderMergeARInvoiceModalPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SaleOrderMergeARInvoiceModalPage],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SaleOrderMergeARInvoiceModalPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
