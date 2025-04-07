import { Injectable } from '@angular/core';
import { SALE_OrderProvider } from 'src/app/services/static/services.service';

@Injectable({ providedIn: 'root' })
export class SALE_OrderService extends SALE_OrderProvider {
	calcOrderLine(line) {
		return new Promise((resolve, reject) => {
			line.controls.UoMPrice.setValue(line.controls.IsPromotionItem?.value ? 0 : parseFloat(line.controls.UoMPrice.value) || 0);

			line.controls.Quantity.setValue(parseFloat(line.controls.Quantity.value) || 0);
			line.controls.OriginalDiscount1.setValue(line.controls.IsPromotionItem.value ? 0 : parseFloat(line.controls.OriginalDiscount1.value) || 0);
			line.controls.OriginalDiscount2.setValue(line.controls.IsPromotionItem.value ? 0 : parseFloat(line.controls.OriginalDiscount2.value) || 0);
			line.controls.OriginalDiscountFromSalesman?.setValue(parseFloat(line.controls.OriginalDiscountFromSalesman.value) || 0);

			// if (!line.controls.IsPromotionItem && line.controls.OriginalDiscount1 > 0 && line.controls.OriginalDiscount1 < 1000) {
			//     line.controls.OriginalDiscount1 .setValue( line.controls.OriginalDiscount1 * 1000)
			// }
			// if (!line.controls.IsPromotionItem && line.controls.OriginalDiscount2 > 0 && line.controls.OriginalDiscount2 < 1000) {
			//     line.controls.OriginalDiscount2 .setValue( line.controls.OriginalDiscount2 * 1000)
			// }
			// if (!line.controls.IsPromotionItem && line.controls.OriginalDiscountFromSalesman > 0 && line.controls.OriginalDiscountFromSalesman < 1000) {
			//     line.controls.OriginalDiscountFromSalesman .setValue( line.controls.OriginalDiscountFromSalesman * 1000)
			// }

			if (!line.controls.IsPromotionItem.value && line.controls.OriginalDiscount2.value > line.controls.UoMPrice.value * line.controls.Quantity.value) {
				line.controls._ShowPriceWarning?.setValue(true);
				//line.controls.OriginalDiscount2 .setValue( (line.controls.UoMPrice - line.controls.BuyPrice) * line.controls.Quantity)
			} else {
				line.controls._ShowPriceWarning?.setValue(false);
			}

			line.controls.OriginalTotalBeforeDiscount.setValue(line.controls.UoMPrice.value * line.controls.Quantity.value);
			line.controls.OriginalDiscountByItem.setValue(line.controls.OriginalDiscount1.value + line.controls.OriginalDiscount2.value);

			// while (line.controls.OriginalDiscountByItem > line.controls.OriginalTotalBeforeDiscount) {
			//     if(line.controls.OriginalDiscount1 > line.controls.OriginalTotalBeforeDiscount){
			//         line.controls.OriginalDiscount1 .setValue( line.controls.OriginalTotalBeforeDiscount)
			//         line.controls.OriginalDiscount2 .setValue( 0)
			//     }
			//     else if(line.controls.OriginalDiscount1 > 0 && line.controls.OriginalDiscount2 > 0 ){
			//         line.controls.OriginalDiscount2 .setValue( line.controls.OriginalTotalBeforeDiscount - line.controls.OriginalDiscount1)
			//     }
			//     line.controls.OriginalDiscountByItem .setValue( line.controls.OriginalDiscount1 + line.controls.OriginalDiscount2)
			// }

			if (line.controls.OriginalDiscountByItem.value > line.controls.OriginalTotalBeforeDiscount.value) {
				line.controls.OriginalDiscount1.setValue(0);
				line.controls.OriginalDiscount2.setValue(0);
				line.controls.OriginalDiscountByItem.setValue(0);
			}

			line.controls.OriginalDiscountByGroup.setValue(0);
			line.controls.OriginalDiscountByLine.setValue(line.controls.OriginalDiscountByItem.value + line.controls.OriginalDiscountByGroup.value);
			line.controls.OriginalDiscountByOrder.setValue(0);
			line.controls.OriginalTotalDiscount.setValue(line.controls.OriginalDiscountByLine.value + line.controls.OriginalDiscountByOrder.value);

			line.controls.OriginalTotalAfterDiscount.setValue(line.controls.OriginalTotalBeforeDiscount.value - line.controls.OriginalTotalDiscount.value);
			line.controls.OriginalTax.setValue(line.controls.OriginalTotalAfterDiscount.value * (line.controls.TaxRate.value / 100.0));
			line.controls.OriginalTotalAfterTax.setValue(line.controls.OriginalTotalAfterDiscount.value + line.controls.OriginalTax.value);

			// if (line.controls.OriginalDiscountFromSalesman?.value > line.controls.OriginalTotalAfterTax.value) {
			// 	line.controls.OriginalDiscountFromSalesman.setValue(line.controls.OriginalTotalAfterTax.value);
			// }
			line.controls.OriginalTotalAfterDiscountFromSalesman.setValue(line.controls.OriginalTotalAfterTax.value - line.controls.OriginalDiscountFromSalesman.value);
			line.controls.SalesmanPrice.setValue(line.controls.OriginalTotalAfterDiscountFromSalesman.value / line.controls.Quantity.value);

			line.controls.ProductWeight.setValue(line.controls._ProductWeight.value * line.controls.Quantity.value || 0);
			line.controls.ProductDimensions.setValue(line.controls._ProductDimensions.value * line.controls.Quantity.value || 0);

			resolve(true);
		});
	}

	calcOrder(item, env, formGroup) {
		formGroup.controls.TaxRate.setValue(0);

		formGroup.controls.ProductWeight.setValue(0);
		formGroup.controls.ProductDimensions.setValue(0);

		formGroup.controls.OriginalTotalBeforeDiscount.setValue(0);
		formGroup.controls.OriginalPromotion.setValue(formGroup.controls.OriginalPromotion ? parseFloat(formGroup.controls.OriginalPromotion) : 0);
		formGroup.controls.OriginalDiscount1.setValue(0);
		formGroup.controls.OriginalDiscount2.setValue(0);
		formGroup.controls.OriginalDiscountByItem.setValue(0);
		formGroup.controls.OriginalDiscountByGroup.setValue(0);
		formGroup.controls.OriginalDiscountByLine.setValue(0);
		formGroup.controls.OriginalDiscountByOrder.setValue(0);
		formGroup.controls.OriginalDiscountFromSalesman.setValue(0);
		formGroup.controls.OriginalTotalDiscount.setValue(0);
		formGroup.controls.OriginalTotalAfterDiscount.setValue(0);
		formGroup.controls.OriginalTax.setValue(0);
		formGroup.controls.OriginalTotalAfterTax.setValue(0);
		formGroup.controls.OriginalTotalAfterDiscountFromSalesman.setValue(0);

		formGroup.controls.TotalBeforeDiscount.setValue(0);
		formGroup.controls.Promotion.setValue(0);
		formGroup.controls.Discount1.setValue(0);
		formGroup.controls.Discount2.setValue(0);
		formGroup.controls.DiscountByItem.setValue(0);
		formGroup.controls.DiscountByGroup.setValue(0);
		formGroup.controls.DiscountByLine.setValue(0);
		formGroup.controls.DiscountByOrder.setValue(0);
		formGroup.controls.DiscountFromSalesman.setValue(0);
		formGroup.controls.TotalDiscount.setValue(0);
		formGroup.controls.TotalAfterDiscount.setValue(0);
		formGroup.controls.Tax.setValue(0);
		formGroup.controls.TotalAfterTax.setValue(0);

		let validLines = formGroup.controls.OrderLines.getRawValue().filter((d) => d.IDItem && d.IDUoM);

		for (let idx = 0; idx < validLines.length; idx++) {
			const line = validLines[idx];

			formGroup.controls.ProductWeight.setValue(formGroup.controls.ProductWeight.value + line.ProductWeight);
			formGroup.controls.ProductDimensions.setValue(formGroup.controls.ProductDimensions.value + line.ProductDimensions);

			formGroup.controls.OriginalTotalBeforeDiscount.setValue(formGroup.controls.OriginalTotalBeforeDiscount.value + line.OriginalTotalBeforeDiscount);

			formGroup.controls.OriginalDiscount1.setValue(formGroup.controls.OriginalDiscount1.value + line.OriginalDiscount1);
			formGroup.controls.OriginalDiscount2.setValue(formGroup.controls.OriginalDiscount2.value + line.OriginalDiscount2);
			formGroup.controls.OriginalDiscountByItem.setValue(formGroup.controls.OriginalDiscountByItem.value + line.OriginalDiscountByItem);
			formGroup.controls.OriginalDiscountByGroup.setValue(formGroup.controls.OriginalDiscountByGroup.value + line.OriginalDiscountByGroup);
			formGroup.controls.OriginalDiscountByLine.setValue(formGroup.controls.OriginalDiscountByLine.value + line.OriginalDiscountByLine);
			formGroup.controls.OriginalDiscountByOrder.setValue(formGroup.controls.OriginalDiscountByOrder.value + line.OriginalDiscountByOrder);
			formGroup.controls.OriginalDiscountFromSalesman.setValue(formGroup.controls.OriginalDiscountFromSalesman.value + line.OriginalDiscountFromSalesman);
			formGroup.controls.OriginalTotalDiscount.setValue(formGroup.controls.OriginalTotalDiscount.value + line.OriginalTotalDiscount);
			formGroup.controls.OriginalTotalAfterDiscount.setValue(formGroup.controls.OriginalTotalAfterDiscount.value + line.OriginalTotalAfterDiscount);
			formGroup.controls.OriginalTax.setValue(formGroup.controls.OriginalTax.value + line.OriginalTax);
			formGroup.controls.OriginalTotalAfterTax.setValue(formGroup.controls.OriginalTotalAfterTax.value + line.OriginalTotalAfterTax);

			formGroup.controls.TotalBeforeDiscount.setValue(formGroup.controls.TotalBeforeDiscount.value + line.TotalBeforeDiscount);
			//formGroup.controls.Promotion.setValue(line.Promotion);

			formGroup.controls.Discount1.setValue(formGroup.controls.Discount1.value + line.Discount1);
			formGroup.controls.Discount2.setValue(formGroup.controls.Discount2.value + line.Discount2);
			formGroup.controls.DiscountByItem.setValue(formGroup.controls.DiscountByItem.value + line.DiscountByItem);
			formGroup.controls.DiscountByGroup.setValue(formGroup.controls.DiscountByGroup.value + line.DiscountByGroup);
			formGroup.controls.DiscountByLine.setValue(formGroup.controls.DiscountByLine.value + line.DiscountByLine);
			formGroup.controls.DiscountByOrder.setValue(formGroup.controls.DiscountByOrder.value + line.DiscountByOrder);
			formGroup.controls.DiscountFromSalesman.setValue(formGroup.controls.DiscountFromSalesman.value + line.DiscountFromSalesman);
			formGroup.controls.TotalDiscount.setValue(formGroup.controls.TotalDiscount.value + line.TotalDiscount);
			formGroup.controls.TotalAfterDiscount.setValue(formGroup.controls.TotalAfterDiscount.value + line.TotalAfterDiscount);
			formGroup.controls.Tax.setValue(formGroup.controls.Tax.value + line.Tax);
			formGroup.controls.TotalAfterTax.setValue(formGroup.controls.TotalAfterTax.value + line.TotalAfterTax);
            formGroup.controls.OriginalTotalAfterDiscountFromSalesman.setValue(formGroup.controls.OriginalTotalAfterDiscountFromSalesman.value + line.OriginalTotalAfterDiscountFromSalesman);
		}

		formGroup.controls.ProductDimensions.setValue(formGroup.controls.ProductDimensions.value / 10 ** 6);

		if (formGroup.controls.OriginalTotalAfterDiscount.value) {
			formGroup.controls.TaxRate.setValue((formGroup.controls.OriginalTax.value / formGroup.controls.OriginalTotalAfterDiscount.value) * 100);
		}

		if (formGroup.controls.OriginalDiscountFromSalesman < 0) {
			env.showMessage('Order not saved as discount from sales man less than 0', 'danger', null, 0, true);
		}
	}
}
