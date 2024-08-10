import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PageBase } from 'src/app/page-base';
import { ModalController, NavController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { CRM_ContactProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-sale-order-mobile-add-contact-modal',
  templateUrl: './sale-order-mobile-add-contact-modal.page.html',
  styleUrls: ['./sale-order-mobile-add-contact-modal.page.scss'],
})
export class SaleOrderMobileAddContactModalPage extends PageBase {
  SelectedContact;
  PhoneCheck;
  BPView = false;
  BPExist = false;
  formGroup: FormGroup;
  constructor(
    public pageProvider: CRM_ContactProvider,
    public env: EnvService,
    public navCtrl: NavController,

    public modalController: ModalController,
    public formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef,
    public loadingController: LoadingController,
  ) {
    super();
    this.id = 0;

    this.pageConfig.isDetailPage = true;

    this.formGroup = formBuilder.group({
      Id: [''],
      Code: [''],
      Name: ['', Validators.required],
      IsOutlets: [true],
      Remark: [''],
      Address: this.formBuilder.group({
        Id: [''],
        Phone1: ['', Validators.required],
        Contact: ['', Validators.required],
        Province: ['', Validators.required],
        District: ['', Validators.required],
        Ward: ['', Validators.required],
        AddressLine1: ['', Validators.required],
        AddressLine2: [''],
      }),
      Status: [''],
    });
  }

  loadedData() {
    super.loadedData();
    if (!this.item) {
      this.item = {};
    }
    this.item.IDOwner = this.env.user.StaffID;
    this.pageConfig.pageName = 'add-contact';
  }

  checkBPexist() {
    if (!this.PhoneCheck) {
      return;
    }
    this.pageProvider.read({ WorkPhone_eq: this.PhoneCheck }).then((results: any) => {
      if (results.data.length == 0) {
        this.BPView = true;
        this.BPExist = false;
        //this.env.showTranslateMessage("erp.app.pages.sale.add-contact-modal.message.business-partner-not-found", "warning");
        this.formGroup.controls.Address['controls'].Phone1.disable();
        this.formGroup.controls.Address['controls'].Phone1.setValue(this.PhoneCheck);
        this.formGroup.controls.Address['controls'].Phone1.markAsDirty();
        this.formGroup.controls.Status.setValue('New');
        this.formGroup.controls.Status.markAsDirty();
        this.PhoneCheck = null;
      } else {
        this.env.showMessage('Business Partner Exist, Please Confirm!', 'warning', null, null, true);
        // this.BPExist = true;
        // this.env.showTranslateMessage("erp.app.pages.sale.add-contact-modal.message.business-partner-existed", "warning");
        // let personalInfo = results[0];
        // this.SelectedContact = personalInfo;

        // this.formGroup.controls.Id.setValue(personalInfo.Id);
        // this.formGroup.controls.Code.setValue(personalInfo.Code);
        // this.formGroup.controls.Name.setValue(personalInfo.Name);
        // this.formGroup.controls.Remark.setValue(personalInfo.Remark);
        // this.formGroup.controls.Status.setValue(personalInfo.Status);

        // this.formGroup.controls.Address['controls'].Id.setValue(personalInfo.Address.Id);
        // this.formGroup.controls.Address['controls'].Phone1.setValue(personalInfo.Address.Phone1);
        // this.formGroup.controls.Address['controls'].Contact.setValue(personalInfo.Address.Contact);
        // this.formGroup.controls.Address['controls'].Province.setValue(personalInfo.Address.Province);
        // this.formGroup.controls.Address['controls'].District.setValue(personalInfo.Address.District);
        // this.formGroup.controls.Address['controls'].Ward.setValue(personalInfo.Address.Ward);
        // this.formGroup.controls.Address['controls'].AddressLine1.setValue(personalInfo.Address.AddressLine1);
        // this.formGroup.controls.Address['controls'].AddressLine2.setValue(personalInfo.Address.AddressLine2);

        // let data = this.formGroup.getRawValue();
        // console.log(data);
      }
    });
  }

  async saveChange() {
    super.saveChange2();
  }

  savedChange(savedItem = null, form = this.formGroup) {
    form.controls.Id.setValue(savedItem.Id);
    form.controls.Address['controls'].Id.setValue(savedItem.IDAddress);
    this.env.publishEvent({
      Code: this.pageConfig.pageName,
      data: form.getRawValue(),
    });
    this.modalController.dismiss();
  }

  applyBP(apply = false) {
    if (apply) {
      this.modalController.dismiss([this.SelectedContact, apply]);
    } else {
      this.modalController.dismiss([null, apply]);
    }
  }
}
