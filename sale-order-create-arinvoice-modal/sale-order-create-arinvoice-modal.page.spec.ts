import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleOrderARInvoiceModalPage } from './sale-order-create-arinvoice-modal.page';

describe('SaleOrderARInvoiceModalPage', () => {
	let component: SaleOrderARInvoiceModalPage;
	let fixture: ComponentFixture<SaleOrderARInvoiceModalPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SaleOrderARInvoiceModalPage],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SaleOrderARInvoiceModalPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
