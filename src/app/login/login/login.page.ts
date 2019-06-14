import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { BancoService } from 'src/app/service/banco.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements OnInit {
  autenticaForm: FormGroup; // Utilizado para criar um formulario
  public usuario = new Array();

  // Dentro do construtor criado o FormBuilder que facilita o pocesso de criar instancias de FormGroup
  constructor(private fb: FormBuilder, private nav: NavController, private bd: BancoService) {}

  ngOnInit() {
    this.createForm();
    this.bd.banco
      .getItem('myitem')
      .then(data => (this.usuario = data), error => console.error(error));
  }
  // Validators.required(serve para informar que o item e' obrigatorio )
  // Validators.email(serve para validar que o campo contenha um email valido)
  // Validators.minLength( serve para aceitar apenas palavras com um minimo de caracteres)

  private createForm(): void {
    this.autenticaForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      registro: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  get email(): FormControl {
    return this.autenticaForm.get('email') as FormControl;
  }
  get nome(): FormControl {
    return this.autenticaForm.get('nome') as FormControl;
  }
  get registro(): FormControl {
    return this.autenticaForm.get('registro') as FormControl;
  }

  onSubmit(): void {
    console.log(' autenticaForm: ', this.autenticaForm.value);
    this.bd.banco
      .setItem('myitem', this.autenticaForm.value)
      .then(() => console.log('Stored item!'), error => console.error('Error storing item', error));

    this.nav.navigateForward('/tabs/tab1');
  }
}
