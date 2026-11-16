import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaleOrder3Page } from './sale-order3.page';
import { SaleOrder3NewOrderModalComponent } from './new-order-modal/new-order-modal.component';
import { SaleOrder3ProductCategoryModalComponent } from './product-category-modal/product-category-modal.component';
import { SaleOrder3CartModalComponent } from './cart-modal/cart-modal.component';
import { ShareModule } from 'src/app/share.module';
import { POSInvoiceModalPageModule } from '../../POS/pos-invoice-modal/pos-invoice-modal.module';

@NgModule({
	imports: [
		IonicModule,
		CommonModule,
		FormsModule,
		ShareModule,
		POSInvoiceModalPageModule,
		RouterModule.forChild([{ path: '', component: SaleOrder3Page }]),
	],
	declarations: [
		SaleOrder3Page,
		SaleOrder3NewOrderModalComponent,
		SaleOrder3ProductCategoryModalComponent,
		SaleOrder3CartModalComponent,
	],
})
export class SaleOrder3PageModule {}
