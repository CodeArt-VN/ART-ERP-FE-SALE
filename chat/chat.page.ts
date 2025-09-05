import { Component } from '@angular/core';
import { PageBase } from 'src/app/page-base';
import { CustomService } from 'src/app/services/custom/custom.service';
import { EnvService } from 'src/app/services/core/env.service';
import { NavController } from '@ionic/angular';

@Component({
	selector: 'app-chat',
	templateUrl: 'chat.page.html',
	styleUrls: ['chat.page.scss'],
	standalone: false,
})
export class ChatPage extends PageBase {
	constructor(
		public pageProvider: CustomService,
		public env: EnvService,
		public navCtrl: NavController
	) {
		super();
		this.items = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
	}
	myHeaderFn(record, recordIndex, records) {
		if (recordIndex % 20 === 0) {
			return 'Header ' + recordIndex;
		}
		return null;
	}
}
