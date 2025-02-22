import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ShareModule } from 'src/app/share.module';
import { SaleOrderMobileViewerPage } from './sale-order-mobile-viewer.page';

const routes: Routes = [
	{
		path: '',
		component: SaleOrderMobileViewerPage,
	},
];

@NgModule({
	imports: [CommonModule, FormsModule, IonicModule, ReactiveFormsModule, ShareModule, RouterModule.forChild(routes)],
	declarations: [SaleOrderMobileViewerPage],
})
export class SaleOrderMobileViewerPageModule {}
