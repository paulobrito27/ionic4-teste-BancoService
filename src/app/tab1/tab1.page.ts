import { Component } from '@angular/core';
import { BancoService } from '../service/banco.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  public usuario = new Array();
  constructor(private bd: BancoService) {
    this.bd.banco
      .getItem('myitem')
      .then(data => (this.usuario = data), error => console.error(error));
  }
}
