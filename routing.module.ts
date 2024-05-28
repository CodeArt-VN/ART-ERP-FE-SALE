import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/guards/app.guard';

export const SALERoutes: Routes = [
    
    // { path: 'sale-order', loadChildren: () => import('./sale-order/sale-order.module').then(m => m.SaleOrderPageModule), canActivate: [AuthGuard] },
    // { path: 'sale-order/:id', loadChildren: () => import('./sale-order-detail/sale-order-detail.module').then(m => m.SaleOrderDetailPageModule), canActivate: [AuthGuard] },
    // { path: 'sale-order/close-order/:id', loadChildren: () => import('./close-order/close-order.module').then(m => m.CloseOrderPageModule), canActivate: [AuthGuard] },
  
    // { path: 'receivable-debt', loadChildren: () => import('./receivable-debt/receivable-debt.module').then(m => m.ReceivableDebtPageModule), canActivate: [AuthGuard] },
    // { path: 'saleman-debt', loadChildren: () => import('./saleman-debt/saleman-debt.module').then(m => m.SalemanDebtPageModule), canActivate: [AuthGuard] },
  
    // { path: 'sale-order-mobile', loadChildren: () => import('./sale-order-mobile/sale-order-mobile.module').then(m => m.SaleOrderMobilePageModule), canActivate: [AuthGuard] },
    // { path: 'sale-order-mobile/:id', loadChildren: () => import('./sale-order-mobile-detail/sale-order-mobile-detail.module').then(m => m.SaleOrderMobileDetailPageModule), canActivate: [AuthGuard] },
    // { path: 'sale-order-mobile-viewer/:id', loadChildren: () => import('./sale-order-mobile-viewer/sale-order-mobile-viewer.module').then(m => m.SaleOrderMobileViewerPageModule), canActivate: [AuthGuard] },
  
    // { path: 'sale-order-note', loadChildren: () => import('./sale-order-note/sale-order-note.module').then(m => m.SaleOrderNotePageModule), canActivate: [AuthGuard] },
    // { path: 'sale-order-note/:id', loadChildren: () => import('./sale-order-note/sale-order-note.module').then(m => m.SaleOrderNotePageModule), canActivate: [AuthGuard] },
  
];
