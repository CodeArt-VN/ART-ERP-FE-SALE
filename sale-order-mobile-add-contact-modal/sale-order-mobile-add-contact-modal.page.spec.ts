import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SaleOrderMobileAddContactModalPage } from './sale-order-mobile-add-contact-modal.page';

describe('SaleOrderMobileAddContactModalPage', () => {
	let component: SaleOrderMobileAddContactModalPage;
	let fixture: ComponentFixture<SaleOrderMobileAddContactModalPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SaleOrderMobileAddContactModalPage],
			imports: [IonicModule.forRoot()],
		}).compileComponents();

		fixture = TestBed.createComponent(SaleOrderMobileAddContactModalPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
