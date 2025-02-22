import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleOrderMergeModalPage } from './sale-order-merge-modal.page';

describe('SaleOrderMergeModalPage', () => {
	let component: SaleOrderMergeModalPage;
	let fixture: ComponentFixture<SaleOrderMergeModalPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SaleOrderMergeModalPage],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SaleOrderMergeModalPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
