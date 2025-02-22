import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalemanDebtModalPage } from './saleman-debt-modal.page';

describe('SalemanDebtModalPage', () => {
	let component: SalemanDebtModalPage;
	let fixture: ComponentFixture<SalemanDebtModalPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SalemanDebtModalPage],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SalemanDebtModalPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
