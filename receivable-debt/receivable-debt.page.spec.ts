import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ReceivableDebtPage } from './receivable-debt.page';

describe('ReceivableDebtPage', () => {
	let component: ReceivableDebtPage;
	let fixture: ComponentFixture<ReceivableDebtPage>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ReceivableDebtPage],
			imports: [IonicModule.forRoot()],
		}).compileComponents();

		fixture = TestBed.createComponent(ReceivableDebtPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
