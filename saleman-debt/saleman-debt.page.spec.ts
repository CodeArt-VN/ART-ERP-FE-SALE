import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SalemanDebtPage } from './saleman-debt.page';

describe('SalemanDebtPage', () => {
	let component: SalemanDebtPage;
	let fixture: ComponentFixture<SalemanDebtPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SalemanDebtPage],
			imports: [IonicModule.forRoot()],
		}).compileComponents();

		fixture = TestBed.createComponent(SalemanDebtPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
