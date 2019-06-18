import { Component } from '@angular/core';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { BancoService } from '../service/banco.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
  public usuario = new Array();

  constructor(private emailComposer: EmailComposer, private bdUser: BancoService) {
    this.bdUser.banco
      .getItem('myitem')
      .then(data => (this.usuario.push(data)), error => console.error(error));
  }

  public teste(): void {
    this.emailComposer.isAvailable().then((available: boolean) => {
      if (available) {
        // Now we know we can send
      }
    });

    const email = {
      to: this.usuario[0].email,
      cc: 'erika@mustermann.de',
      bcc: ['john@doe.com', 'jane@doe.com'],
      attachments: [
        'file://img/logo.png',
        'res://icon.png',

        'base64:icon.png//iVBORw0KGgoAAAANSUhEUg...',
        'file://README.pdf'
      ],
      subject: 'Cordova Icons',
      body: this.usuario[0].nome,
      isHtml: true
    };

    // Send a text message using default options
    this.emailComposer.open(email);
  }
}
