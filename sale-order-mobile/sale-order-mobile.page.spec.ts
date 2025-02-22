import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SaleOrderMobilePage } from './sale-order-mobile.page';

describe('SaleOrderMobilePage', () => {
	let component: SaleOrderMobilePage;
	let fixture: ComponentFixture<SaleOrderMobilePage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SaleOrderMobilePage],
			imports: [IonicModule.forRoot()],
		}).compileComponents();

		fixture = TestBed.createComponent(SaleOrderMobilePage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
