import { Component } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { BancoService } from '../service/banco.service';

// teste
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { ToastController, AlertController } from '@ionic/angular';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { File } from '@ionic-native/file/ngx';
// -----------------------------------

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  public romaneio: string;
  public almoxarifado: string;
  public empreiteira: string;
  public lista = new Array();
  public liberadoLeitura: Boolean = true;
  public texto: string;
  public materialSeries = new Array();
  public materialgediss = new Array();
  public series = new Array();
  public gediss = new Array();
  public mensagem = new Array();
  public usuario = new Array();

  constructor(
    private bd: BancoService,
    private barcodeScanner: BarcodeScanner,
    private toastController: ToastController,
    private file: File,
    private fileChooser: FileChooser,
    private actionSheet: ActionSheetController,
    private emailComposer: EmailComposer,
    private alertCtrl: AlertController,
  ) {
    this.bd.banco
      .getItem('myitem')
      .then(data => (this.usuario = data), error => console.error(error));
  }

  // ------------------------------------
  public async opcoes() {
    let action = await this.actionSheet.create({
      header: 'OPÇÕES',
      buttons: [
        {
          text: 'CARREGA ARQUIVO ROMANEIO',
          icon: 'ios-download-outline',
          role: 'destructive',
          handler: () => {
            if (this.liberadoLeitura) {
              // escolhe arquivo e fornece endereço formato uri
              this.fileChooser.open().then(uri => {
                // transforma do formato uri para url
                this.file.resolveLocalFilesystemUrl(uri).then(url => {
                  // pega somente ao nome do arquivo
                  this.file
                    .readAsText(this.file.externalRootDirectory, 'Download/' + url.name)
                    .then(value => {
                      this.texto = value;
                      // tratamento do texto para descobrir o Almoxarifado.
                      let alm1 = this.texto.split('Almoxarifado');
                      let alm2 = alm1[1].split('DIS');
                      this.almoxarifado = alm2[0];

                      // tratamento do texto para descobrir o nome da empreiteira.
                      let emp1 = this.texto.split('Empreiteira');
                      let emp2 = emp1[1].split('Nro.');
                      this.empreiteira = emp2[0];

                      // tratamento do texto para descobrir o numero do romaneio.
                      let rom1 = this.texto.split('Nro.');
                      let rom2 = rom1[1];
                      let rom3 = rom2.split(' ');
                      let rom4 = rom3[2].split('D');
                      this.romaneio = rom4[0];

                      // começo do tratamento para pegar apenas os materiais liberados.

                      let ped1: string[] = this.texto.split('Peso|');
                      let ped2: string = ped1[1];
                      let novo: string = ped2.replace(/\s/g, '#');
                      let novo2: string[] = novo.split('--##|#');
                      let novo3: string = novo2[1];
                      let ped3: string[] = novo3.split('#|##|#');

                      // neste ponto temos todos os materiais gravados na variavel ped3. Vamos continuar o tratamento.
                      let linha: string[];

                      // tratamento de pontos e virgulas
                      ped3.forEach(element => {
                        let linha2 = element.replace(/#/g, ' ');
                        linha = linha2.split('|');
                        let corrigePonto = linha[5].replace('.', '');
                        let corrigePonto2 = linha[3].replace('.', '');
                        let corrige: string[] = corrigePonto.split(',');
                        let corrige2: string[] = corrigePonto2.split(',');

                        let linhaCorrigida: string;
                        let linhaCorrigida2: string;

                        if (corrige[1] == '000 ') {
                          linhaCorrigida = corrige[0];
                        } else {
                          let numero: any = corrige[0] + '.' + corrige[1];
                          linhaCorrigida = numero;
                        }

                        if (corrige2[1] == '000 ') {
                          linhaCorrigida2 = corrige2[0];
                        } else {
                          let numero: any = corrige2[0] + '.' + corrige2[1];
                          linhaCorrigida2 = numero;
                        }

                        this.lista.push({
                          codigo: linha[0],
                          nome: linha[1],
                          prateleira: linha[2],
                          quantidade: linhaCorrigida,
                          qtd_separada: 0,
                          qtd_estoqueTotal: linhaCorrigida2,
                          lidoManual: false
                        });
                      });
                      // -----------------------------GRAVANDO LISTA NO STORAGE------------------------------------------------------
                      this.bd.banco
                        .setItem('LISTA', this.lista)
                        .then(
                          () => console.log('Stored item!'),
                          error => alert('Lista não gravada na memória interna -> ' + error)
                        );

                      this.bd.banco
                        .setItem('ROMANEIO', this.romaneio)
                        .then(
                          () => console.log('Stored item!'),
                          error => alert('Lista não gravada na memória interna -> ' + error)
                        );

                      this.bd.banco
                        .setItem('ALMOXARIFADO', this.almoxarifado)
                        .then(
                          () => console.log('Stored item!'),
                          error => alert('Lista não gravada na memória interna -> ' + error)
                        );

                      this.bd.banco
                        .setItem('EMPREITEIRA', this.empreiteira)
                        .then(
                          () => console.log('Stored item!'),
                          error => alert('Lista não gravada na memória interna -> ' + error)
                        );

                      // fim teste storage----------------------------------------------------------------

                      this.liberadoLeitura = false;
                    })
                    .catch(async err => {
                      const toast = await this.toastController.create({
                        message: 'NÃO FOI POSSIVEL LER O ARQUIVO!!!!',
                        duration: 2000,
                        position: 'top'
                      });
                      toast.present();
                    });
                });
              });
            }
          }
        },

        {
          text: 'ZERAR LISTA',
          icon: 'trash',
          role: 'destructive',
          handler: async () => {
            //-----inicio do alert---
            let alert = await this.alertCtrl.create({
              header: 'CONFIRMAÇÃO DE ZERAR LISTA',
              message:
                'Você tem certeza de que deseja zerar a listagem? Todos os materiais e a contagem serão perdidos permanentemente.',
              buttons: [
                //---botao 1
                {
                  text: 'CANCELAR',
                  role: 'calcel',
                  handler: () => {}
                },
                //---botao 2
                {
                  text: 'CONFIRMAR',
                  role: 'calcel',
                  handler: () => {
                    let tamanho: number = this.lista.length;
                    this.lista.splice(0, tamanho);

                    this.romaneio = '';

                    this.liberadoLeitura = true;

                    let tam: number = this.materialSeries.length;
                    this.materialSeries.splice(0, tam);

                    let tama: number = this.materialgediss.length;
                    this.materialgediss.splice(0, tama);

                    // zera os Storages--------------------------------------------------------------
                    this.bd.banco.clear();
                  }
                }
              ]
            });
            await alert.present();
          }
        },

        {
          text: 'ENVIAR CONTAGEM',
          icon: 'ios-send-outline',
          role: 'destructive',
          handler: async () => {
            let contagemTerminada: boolean = true;
            let materialDivergente = new Array();

            this.lista.forEach(element => {
              if (element.quantidade != 0) {
                contagemTerminada = false;
                materialDivergente.push(element);
              }
            });

            if (contagemTerminada) {
              // trabalhando com a promisse do materialSeries
              let temMatSerie: number = this.materialSeries.length;
              let mensagemNovaSeries: string;
              let temMatGedis: number = this.materialgediss.length;
              let mensagemNovaGedis: string;
              let mensagemMateriaisTotaisSeparados: string;
              let materiaisLidosManualmente: string;

              if (temMatSerie > 0) {
                this.materialSeries.forEach(element => {
                  this.mensagem.push(
                    '\n------------SERIES-----------------\nCódigo: ' + element.codigo + ' .\n'
                  );
                  let mensSerie = element.series.split(',');
                  mensSerie.forEach(element2 => {
                    this.mensagem.push(element2 + '\n');
                  });
                });
                // transforma um array em uma única string para ser enviado pelo email
                mensagemNovaSeries = this.mensagem.join(' ');
                // zera mensagem
                let tam: number = this.mensagem.length;
                this.mensagem.splice(0, tam);
              }

              // trabalhando com a promisse do materialGedis

              if (temMatGedis > 0) {
                this.materialgediss.forEach(element => {
                  this.mensagem.push(
                    '\n------------GEDIS-----------------\nMATERIAL código: ' +
                      element.codigo +
                      ' .\n\n'
                  );
                  let mensGedis = element.gedis.split(',');
                  mensGedis.forEach(element2 => {
                    this.mensagem.push(element2 + '\n');
                  });
                });
                // transforma um array em uma única string para ser enviado pelo email
                mensagemNovaGedis = this.mensagem.join(' ');
                // zera mensagem
                let tam: number = this.mensagem.length;
                this.mensagem.splice(0, tam);
              }

              // trabalhando com a lista para enviar mensagem de todos materiais que foram separados e suas quantidades
              this.lista.forEach(element => {
                this.mensagem.push(
                  '\n\n' +
                    element.codigo +
                    ' ' +
                    element.nome +
                    '\n quantidade separada -> ' +
                    element.qtd_separada
                );
              });
              // transforma um array em uma única string para ser enviado pelo email
              mensagemMateriaisTotaisSeparados = this.mensagem.join(' ');
              // zera mensagem
              let tam: number = this.mensagem.length;
              this.mensagem.splice(0, tam);

              // trabalhando com a lista para enviar mensagem de todos materiais que foram lidos manualmente
              this.lista.forEach(element => {
                if (element.lidoManual == true) {
                  this.mensagem.push(
                    '\n\n' + element.codigo + '  ' + element.nome + ' foi lido de maneira manual'
                  );
                }
              });
              // transforma um array em uma única string para ser enviado pelo email
              materiaisLidosManualmente = this.mensagem.join(' ');
              // zera mensagem
              tam = this.mensagem.length;
              this.mensagem.splice(0, tam);

              // tratando gedis e series vazios
              if (mensagemNovaSeries == undefined) {
                mensagemNovaSeries = '\nNão existem materiais que tenham n° de série';
              }
              if (mensagemNovaGedis == undefined) {
                mensagemNovaGedis = '\nNão existem materiais que tenham n° de gedis';
              }
              if (materiaisLidosManualmente == undefined) {
                materiaisLidosManualmente = '\n\nTodos os materiais foram lidos pelo QR-CODE.';
              }

              // função de envio de email.....................................
              let email = {
                to: this.usuario[0].email,
                cc: '',
                bcc: [],
                attachments: [],
                subject:
                  'Romaneio n°' +
                  this.romaneio +
                  '  separado com sucesso ' +
                  ' Colaborador: ' +
                  this.usuario[0].usuario +
                  '\n' +
                  ' Registro: ' +
                  this.usuario[0].registro,
                body:
                  'Todos os materiais foram separados na sua totalidade co sucesso!!!!' +
                  '\n\n____________________________________________________________________________________________' +
                  '\n\n\n\nRelação de materiais separados:\n' +
                  mensagemMateriaisTotaisSeparados +
                  '\n\n---------------------------------------------------------------' +
                  '\n\n---------------------------------------------------------------' +
                  +'\n\n\nLista de Gedis/Series dos materiais separados: \n\n\n\n' +
                  mensagemNovaSeries +
                  mensagemNovaGedis +
                  '\n\n\n\nMateriais lidos de forma manual:\n' +
                  materiaisLidosManualmente,
                isHtml: false,
                app: 'Gmail'
              };
              this.emailComposer.open(email);
              // fim função email....................................................
            } else {
              // ----------------------------- ENVIA EMAIL SEM TERMINO--------------------------------------------
              let alert = await this.alertCtrl.create({
                header: 'OS PEDIDOS DESSE ROMANEIO NÃO ESTÃO ZERADOS',
                message:
                  'Você tem certeza de que deseja enviar email sem término da contagem? Existem materiais que  foram separados em quantidades diferentes a do romaneio.',
                buttons: [
                  //---botao 1
                  {
                    text: 'CANCELAR',
                    role: 'calcel',
                    handler: () => {}
                  },
                  //---botao 2
                  {
                    text: 'CONFIRMAR',
                    role: 'calcel',
                    handler: () => {
                      // trabalhando com a promisse do materialSeries
                      let temMatSerie: number = this.materialSeries.length;
                      let mensagemNovaSeries: string;
                      let temMatGedis: number = this.materialgediss.length;
                      let mensagemNovaGedis: string;
                      let mensagem_Material_inferior;
                      let mensagem_Material_superior;
                      let mensagemMateriaisTotaisSeparados: string;
                      let materiaisLidosManualmente: string;

                      if (temMatSerie > 0) {
                        this.materialSeries.forEach(element => {
                          this.mensagem.push(
                            '\n------------SERIES-----------------\n\nCódigo: ' +
                              element.codigo +
                              ' .\n'
                          );
                          let mensSerie = element.series.split(',');
                          mensSerie.forEach(element2 => {
                            this.mensagem.push(element2 + '\n');
                          });
                        });
                        // transforma um array em uma única string para ser enviado pelo email
                        mensagemNovaSeries = this.mensagem.join(' ');
                        // zera mensagem
                        let tam: number = this.mensagem.length;
                        this.mensagem.splice(0, tam);
                      }

                      // trabalhando com a promisse do materialGedis

                      if (temMatGedis > 0) {
                        this.materialgediss.forEach(element => {
                          this.mensagem.push(
                            '\n------------GEDIS-----------------\n\nMATERIAL código: ' +
                              element.codigo +
                              ' .\n\n'
                          );
                          let mensGedis = element.gedis.split(',');
                          mensGedis.forEach(element2 => {
                            this.mensagem.push(element2 + '\n');
                          });
                        });
                        // transforma um array em uma única string para ser enviado pelo email
                        mensagemNovaGedis = this.mensagem.join(' ');
                        // zera mensagem
                        let tam: number = this.mensagem.length;
                        this.mensagem.splice(0, tam);
                      }

                      // trabalhando com a lista para enviar mensagem de todos materiais que foram lidos manualmente
                      this.lista.forEach(element => {
                        if (element.lidoManual == true) {
                          this.mensagem.push(
                            '\n\n' +
                              element.codigo +
                              '  ' +
                              element.nome +
                              ' foi lido de maneira manual'
                          );
                        }
                      });
                      // transforma um array em uma única string para ser enviado pelo email
                      materiaisLidosManualmente = this.mensagem.join(' ');
                      // zera mensagem
                      let tam: number = this.mensagem.length;
                      this.mensagem.splice(0, tam);

                      // tratando gedis e series vazios
                      if (mensagemNovaSeries == undefined) {
                        mensagemNovaSeries = '\nNão existem materiais que tenham n° de série\n\n';
                      }
                      if (mensagemNovaGedis == undefined) {
                        mensagemNovaGedis = '\nNão existem materiais que tenham n° de gedis\n\n\n';
                      }
                      if (materiaisLidosManualmente == undefined) {
                        materiaisLidosManualmente =
                          '\n\nTodos os materiais foram lidos pelo QR-CODE.';
                      }

                      // trabalhando com materiais com quantidades faltantes
                      materialDivergente.forEach(element => {
                        if (element.quantidade > 0) {
                          let falta = element.quantidade;
                          this.mensagem.push(
                            '\nCódigo: ' +
                              element.codigo +
                              ' faltou -> ' +
                              falta +
                              ' unidade(s) .\n\n'
                          );
                        }
                      });
                      // transforma um array em uma única string para ser enviado pelo email
                      mensagem_Material_inferior = this.mensagem.join(' ');
                      // zera mensagem
                      tam = this.mensagem.length;
                      this.mensagem.splice(0, tam);

                      // trabalhando com materiais com quantidades sobrando
                      materialDivergente.forEach(element => {
                        if (element.quantidade < 0) {
                          let sobra = element.quantidade * -1;
                          this.mensagem.push(
                            '\nCódigo: ' +
                              element.codigo +
                              '  separados à mais -> ' +
                              sobra +
                              ' unidade(s) .\n\n'
                          );
                        }
                      });
                      // transforma um array em uma única string para ser enviado pelo email
                      mensagem_Material_superior = this.mensagem.join(' ');
                      // zera mensagem
                      tam = this.mensagem.length;
                      this.mensagem.splice(0, tam);

                      // trabalhando com a lista para enviar mensagem de todos materiais que foram separados e suas quantidades
                      this.lista.forEach(element => {
                        this.mensagem.push(
                          '\n\n' +
                            element.codigo +
                            ' ' +
                            element.nome +
                            '\n quantidade separada -> ' +
                            element.qtd_separada
                        );
                      });
                      // transforma um array em uma única string para ser enviado pelo email
                      mensagemMateriaisTotaisSeparados = this.mensagem.join(' ');
                      // zera mensagem
                      tam = this.mensagem.length;
                      this.mensagem.splice(0, tam);

                      // função de envio de email.....................................
                      let email = {
                        to: this.usuario[0].email,
                        cc: '',
                        bcc: [],
                        attachments: [],
                        subject:
                          'Romaneio n°' +
                          this.romaneio +
                          ' COM DIVERGÊNCIAS ' +
                          ' Colaborador: ' +
                          this.usuario[0].usuario +
                          '\n' +
                          ' Registro: ' +
                          this.usuario[0].registro,
                        body:
                          'Lista de materiais separados:\n' +
                          mensagemMateriaisTotaisSeparados +
                          '\n\n____________________________________________________________________________________________' +
                          '\n\n\n\nFaltou realizar a separação dos seguintes materiais :\n\n' +
                          mensagem_Material_inferior +
                          '\n\n____________________________________________________________________________________________' +
                          '\n\n\nMateriais separados com quantidade superior à do ROMANEIO:\n' +
                          mensagem_Material_superior +
                          '\n\n____________________________________________________________________________________________' +
                          '\n\n\nLista de Gedis/Series dos materiais separados: \n' +
                          mensagemNovaSeries +
                          mensagemNovaGedis +
                          '\n\n\n\nMateriais lidos de forma manual:\n' +
                          materiaisLidosManualmente,
                        isHtml: false,
                        app: 'Gmail'
                      };
                      this.emailComposer.open(email);
                      // fim função email....................................................
                    }
                  }
                ]
              });
              await alert.present();
              // ---------------------------FIM ENVIA EMAIL SEM TERMINO-----------------------------------------
            }
          }
        },

        {
          text: 'RECARREGA',
          icon: 'ios-refresh-outline',
          role: 'destructive',
          handler: () => {
            // -----------------------------------RECARREGA ÚLTIMA ATUALIZAÇÃO DA LISTA NO STORAGE-------------------------
            this.bd.banco
              .getItem('LISTA')
              .then(data => (this.lista = data), error => console.error(error));

            this.bd.banco
              .getItem('SERIE')
              .then(data => (this.materialSeries = data), error => console.error(error));

            this.bd.banco
              .getItem('GEDIS')
              .then(data => (this.materialgediss = data), error => console.error(error));

            this.bd.banco
              .getItem('ROMANEIO')
              .then(data => (this.romaneio = data), error => console.error(error));

            this.bd.banco
              .getItem('ALMOXARIFADO')
              .then(data => (this.almoxarifado = data), error => console.error(error));

            this.bd.banco
              .getItem('EMPREITEIRA')
              .then(data => (this.empreiteira = data), error => console.error(error));

            // -----------------------------------------------FIM RECARREGA STORAGE-------------------------------------------------------
          }
        },

        {
          text: 'CANCELAR',
          role: 'cancel'
        }
      ]
    });
    await action.present();
  }

  // -------------------------------------------------FUNÇÃO PARA LER OS QR-CODES--------------------------------
  // -----------------------------------------------------------------------------------------------------------

  public lerQr(item) {
    let itemClicado = item;
    let codigoClicado = itemClicado.codigo;
    let qtdClicado = itemClicado.quantidade;
    let qtdEstoqueTotal_clicado = itemClicado.qtd_estoqueTotal;
    let prateleira_clicada = itemClicado.prateleira;

    let codigoQrcode: string;
    let qtdQrcode: number;
    let serieQrcode: string;
    let gedisQrcode: string;

    let temCodigo: boolean = false;
    let temSerie: boolean = false;
    let temGedis: boolean = false;
    let temQuantidade: boolean = false;

    let repete: boolean = true;

    // começo do scaner
    this.barcodeScanner
      .scan()
      .then(async barcodeData => {
        let lido: string = barcodeData.text;

        // pega apenas codigo
        let verificaCodigo: number = lido.indexOf('codigo:');
        if (verificaCodigo != -1) {
          let cod1: string[] = lido.split('odigo:"');
          let cod2: string = cod1[1];
          let cod3: string[] = cod2.split('",');
          let cod4: string = cod3[0];
          let cod: string = cod4.replace(/\s/g, '');
          codigoQrcode = cod; // Variavel que vai carregar o código lido no QrCode
          temCodigo = true;
        } else {
          temCodigo = false;
          alert('NÃO FOI POSSIVEL LER O CÓDIGO DO MATERIAL NESSE FORMATO DE QR CODE');
        }

        // pega apenas quantidade
        let verificaQuantidade: number = lido.indexOf('quantidade:');
        if (verificaQuantidade != -1) {
          let qtd1: string[] = lido.split('uantidade:"');
          let qtd2: string = qtd1[1];
          let qtd3: string[] = qtd2.split('"');
          let qtd4: string = qtd3[0];
          let qtdQr: string = qtd4.replace(/\s/g, '');
          qtdQrcode = parseFloat(qtdQr); // Variavel que vai carregar a quantidade lida no QrCode
          temQuantidade = true;
        } else {
          temQuantidade = false;
        }

        // pega apenas o n° de serie
        let verificaSerie: number = lido.indexOf('serie:');
        if (verificaSerie != -1) {
          let ser1: string[] = lido.split('erie:"');
          let ser2: string = ser1[1];
          let ser3: string[] = ser2.split('"');
          let ser4: string = ser3[0];
          let serieQr: string = ser4.replace(/\s/g, '');
          serieQrcode = serieQr; // Variavel que vai carregar o numero de serie lido no QrCode
          temSerie = true;
        } else {
          temSerie = false;
        }

        // pega apenas o n° do gedis
        let verificaGedis: number = lido.indexOf('gedis:');
        if (verificaGedis != -1) {
          let ged1: string[] = lido.split('edis:"');
          let ged2: string = ged1[1];
          let ged3: string[] = ged2.split('"');
          let ged4: string = ged3[0];
          let gedisQr: string = ged4.replace(/\s/g, '');
          gedisQrcode = gedisQr; // Variavel que vai carregar o numero do Gedis lido no QrCode
          temGedis = true;
        } else {
          temGedis = false;
        }
        /// ---------------------------------------------------------------------------------------------------
        // verifica se o material lido é o que foi clicado na lista de materiais e se a quantidade ja foi pega

        if (temCodigo) {
          if (temQuantidade) {
            if (temSerie) {
              if (temGedis) {
                /// inicio do tem gedis--------------------------------------------------------------------------------------------------

                if (codigoClicado.replace(/\s/g, '') == codigoQrcode) {
                  if (qtdEstoqueTotal_clicado >= qtdQrcode) {
                    let gedisNovo: boolean = true;

                    this.gediss.forEach(element => {
                      // verifica se existe um numero de gedis igual ja lido
                      if (element == gedisQrcode) {
                        gedisNovo = false;
                      }
                    });

                    // inicio do se o qr não ultrapassa o pedido
                    if (qtdClicado >= qtdQrcode) {
                      if (gedisNovo) {
                        this.lista.forEach(async element => {
                          if (
                            element.codigo.replace(/\s/g, '') == codigoQrcode &&
                            element.prateleira.replace(/\s/g, '') == prateleira_clicada
                          ) {
                            let valorNovo: number = element.quantidade - qtdQrcode;
                            let valorTotalSeparado: number = element.qtd_separada + qtdQrcode;
                            let valorEstoqueNovo: number = element.qtd_estoqueTotal - qtdQrcode;
                            element.quantidade = valorNovo;
                            element.qtd_separada = valorTotalSeparado;
                            element.qtd_estoqueTotal = valorEstoqueNovo;
                            this.gediss.push(gedisQrcode);

                            if (element.quantidade == 0) {
                              /// grava todas os Gedis do mesmo material em materialGedis e  zera gediss
                              let codigo: string = element.codigo;
                              let gedisSTRING: string = this.gediss.join(',');
                              this.materialgediss.push({ codigo: codigo, gedis: gedisSTRING });
                              let tamanho: number = this.gediss.length;
                              this.gediss.splice(0, tamanho);

                              // impede que leia outro material com mesmo código
                              repete = false;
                              alert('MATERIAL ' + element.codigo + ' SEPARADO COM SUCESSO!!!!');

                              // -----gravando alteração no storage----------------------------------------------------------

                              this.bd.banco
                                .setItem('LISTA', this.lista)
                                .then(
                                  () => console.log('Stored item!'),
                                  error => alert('Lista não gravada na memória interna -> ' + error)
                                );
                              // ---------------------------------------------------------------------------------------------
                              // -----------------------------GRAVANDO MaterialGedis NO STORAGE--------------------------------
                              this.bd.banco
                                .setItem('GEDIS', this.materialgediss)
                                .then(
                                  () => console.log('Stored item!'),
                                  error => alert('Lista não gravada na memória interna -> ' + error)
                                );
                              // fim teste storage----------------------------------------------------------------
                            }
                            if (element.quantidade > 0) {
                              repete = false;
                              let alert = await this.alertCtrl.create({
                                header: element.nome,
                                message: 'Faltam separar ' + element.quantidade + ' unidades',
                                buttons: [
                                  // ---botao 1
                                  {
                                    text: 'GRAVAR E FINALIZAR',
                                    role: 'calcel',
                                    handler: () => {
                                      /// grava todas os Gedis do mesmo material em materialGedis e  zera gediss
                                      let codigo: string = element.codigo;
                                      let gedisSTRING: string = this.gediss.join(',');
                                      this.materialgediss.push({
                                        codigo: codigo,
                                        gedis: gedisSTRING
                                      });
                                      let tamanho: number = this.gediss.length;
                                      this.gediss.splice(0, tamanho);

                                      // impede que leia outro material com mesmo código
                                      repete = false;

                                      // -----gravando alteração no storage----------------------------------------------------------

                                      this.bd.banco
                                        .setItem('LISTA', this.lista)
                                        .then(() => console.log('Stored item!'));
                                      // ---------------------------------------------------------------------------------------------
                                      // -----------------------------GRAVANDO MaterialGedis NO STORAGE--------------------------------
                                      this.bd.banco
                                        .setItem('GEDIS', this.materialgediss)
                                        .then(() => console.log('Stored item!'));
                                      // fim teste storage----------------------------------------------------------------
                                    }
                                  },
                                  // ---botao 2
                                  {
                                    text: 'CONTINUAR SEPARANDO',
                                    role: 'calcel',
                                    handler: () => {
                                      repete = true;
                                      if (repete) {
                                        this.lerQr(item);
                                      }
                                    }
                                  }
                                ]
                              });
                              await alert.present();
                            }
                          }
                        });
                      } else {
                        alert('NUMERO DO GEDIS JÁ FOI LIDO, MATERIAL NÃO CONTABILIZADO');
                        repete = false;
                      }
                    } /// fim do qtdClicado maior q do qr

                    /// inicio qtd clicado maior q do qr
                    if (qtdClicado < qtdQrcode) {
                      repete = false;
                      let alert = await this.alertCtrl.create({
                        header: codigoClicado,
                        message: 'Quantidade ultrapassa pedido',
                        buttons: [
                          // ---botao 1
                          {
                            text: 'CANCELA',
                            role: 'calcel',
                            handler: () => {
                              repete = false;
                            }
                          },
                          // ---botao 2
                          {
                            text: 'CONFIRMAR ',
                            role: 'calcel',
                            handler: () => {
                              // ----------------------------------------------------------------------------------------

                              if (gedisNovo) {
                                this.lista.forEach(element => {
                                  if (
                                    element.codigo.replace(/\s/g, '') == codigoQrcode &&
                                    element.prateleira.replace(/\s/g, '') == prateleira_clicada
                                  ) {
                                    let valorNovo: number = element.quantidade - qtdQrcode;
                                    let valorTotalSeparado: number =
                                      element.qtd_separada + qtdQrcode;
                                    let valorEstoqueNovo: number =
                                      element.qtd_estoqueTotal - qtdQrcode;
                                    element.quantidade = valorNovo;
                                    element.qtd_separada = valorTotalSeparado;
                                    element.qtd_estoqueTotal = valorEstoqueNovo;
                                    this.gediss.push(gedisQrcode);

                                    /// grava todas os Gedis do mesmo material em materialGedis e  zera gediss
                                    let codigo: string = element.codigo;
                                    let gedisSTRING: string = this.gediss.join(',');
                                    this.materialgediss.push({
                                      codigo: codigo,
                                      gedis: gedisSTRING
                                    });
                                    let tamanho: number = this.gediss.length;
                                    this.gediss.splice(0, tamanho);

                                    // impede que leia outro material com mesmo código
                                    repete = false;

                                    // -----gravando alteração no storage----------------------------------------------------------

                                    this.bd.banco
                                      .setItem('LISTA', this.lista)
                                      .then(() => console.log('Stored item!'));
                                    //---------------------------------------------------------------------------------------------
                                    //-----------------------------GRAVANDO MaterialGedis NO STORAGE--------------------------------
                                    this.bd.banco
                                      .setItem('GEDIS', this.materialgediss)
                                      .then(() => console.log('Stored item!'));
                                    // fim teste storage------------------------------------
                                  }
                                });
                              }

                              // ---------------------------------------------------------------------------------
                            }
                          }
                        ]
                      });
                      await alert.present();
                    }

                    // -----FIM DO QUANTIDADE ESTOQUE MAIOR QUE QR-------------------------------------------------
                  } else {
                    alert('QUANTIDADE ULTRAPASSA O ESTOQUE TOTAL DO DEPÓSITO');
                  }
                  if (repete) {
                    this.lerQr(item);
                  }
                } else {
                  alert('CODIGO LIDO NÃO CONFERE');
                  repete = false;
                }
                /// fim do com gedis-------------------------------------------------------------------------------------------------
              } else {
                /// começo tem serie e não tem gedis

                if (codigoClicado.replace(/\s/g, '') == codigoQrcode) {
                  if (qtdEstoqueTotal_clicado >= qtdQrcode) {
                    let serieNova: boolean = true;

                    this.series.forEach(element => {
                      // verifica se existe um numero de serie igual ja lido

                      if (element == serieQrcode) {
                        serieNova = false;
                      }
                    });

                    // inicio do se o qr não ultrapassa o pedido
                    if (qtdClicado >= qtdQrcode) {
                      if (serieNova) {
                        this.lista.forEach(async element => {
                          if (
                            element.codigo.replace(/\s/g, '') == codigoQrcode &&
                            element.prateleira.replace(/\s/g, '') == prateleira_clicada
                          ) {
                            let valorNovo: number = element.quantidade - qtdQrcode;
                            let valorTotalSeparado: number = element.qtd_separada + qtdQrcode;
                            let valorEstoqueNovo: number = element.qtd_estoqueTotal - qtdQrcode;
                            element.quantidade = valorNovo;
                            element.qtd_separada = valorTotalSeparado;
                            element.qtd_estoqueTotal = valorEstoqueNovo;
                            this.series.push(serieQrcode);

                            /// quando termina a contagem do material em questão
                            if (element.quantidade == 0) {
                              /// grava todas as series do mesmo material em materialSeries e  zera series
                              let codigo: string = element.codigo;
                              let serieSTRING: string = this.series.join(',');
                              this.materialSeries.push({ codigo: codigo, series: serieSTRING });
                              let tamanho: number = this.series.length;
                              this.series.splice(0, tamanho);
                              // impede que leia outro material com mesmo código
                              repete = false;
                              alert('MATERIAL ' + element.codigo + ' SEPARADO COM SUCESSO!!!!');
                              // -----gravando alteração no storage
                              this.bd.banco
                                .setItem('LISTA', this.lista)
                                .then(
                                  () => console.log('Stored item!'),
                                  error => alert('Lista não gravada na memória interna -> ' + error)
                                );
                              // -------------------------------------------
                              // -----------------------------GRAVANDO MaterialSeries NO STORAGE--------------------------------
                              this.bd.banco
                                .setItem('SERIE', this.materialSeries)
                                .then(
                                  () => console.log('Stored item!'),
                                  error => alert('Lista não gravada na memória interna -> ' + error)
                                );
                              // fim teste storage----------------------------------------------------------------
                            }
                            if (element.quantidade > 0) {
                              repete = false;
                              let alert = await this.alertCtrl.create({
                                header: element.nome,
                                message: 'Faltam separar ' + element.quantidade + ' unidades',
                                buttons: [
                                  // ---botao 1
                                  {
                                    text: 'GRAVAR E FINALIZAR',
                                    role: 'calcel',
                                    handler: () => {
                                      /// grava todas as series do mesmo material em materialSeries e  zera series
                                      let codigo: string = element.codigo;
                                      let serieSTRING: string = this.series.join(',');
                                      this.materialSeries.push({
                                        codigo: codigo,
                                        series: serieSTRING
                                      });
                                      let tamanho: number = this.series.length;
                                      this.series.splice(0, tamanho);
                                      // impede que leia outro material com mesmo código
                                      repete = false;
                                      // ----gravando alteração no storage
                                      this.bd.banco
                                        .setItem('LISTA', this.lista)
                                        .then(() => console.log('Stored item!'));
                                      // -------------------------------------------
                                      // -----------------------------GRAVANDO MaterialSeries NO STORAGE--------------------------------
                                      this.bd.banco
                                        .setItem('SERIE', this.materialSeries)
                                        .then(() => console.log('Stored item!'));
                                      // fim teste storage----------------------------------------------------------------
                                    }
                                  },
                                  // ---botao 2
                                  {
                                    text: 'CONTINUAR SEPARAÇÃO',
                                    role: 'calcel',
                                    handler: () => {
                                      repete = true;
                                      if (repete) {
                                        this.lerQr(item);
                                      }
                                    }
                                  }
                                ]
                              });
                              await alert.present();
                            }
                          }
                        });
                      } else {
                        alert('NUMERO DE SÉRIE JÁ FOI LIDO, MATERIAL NÃO CONTABILIZADO');
                        repete = false;
                      }
                    } /// fim do qtdClicado maior q do qr DO COM  SÉRIE

                    /// inicio qtd clicado maior q do qr DO COM SÉRIE
                    if (qtdClicado < qtdQrcode) {
                      repete = false;
                      let alert = await this.alertCtrl.create({
                        header: codigoClicado,
                        message: 'Quantidade ultrapassa pedido',
                        buttons: [
                          // ---botao 1
                          {
                            text: 'CANCELA',
                            role: 'calcel',
                            handler: () => {
                              repete = false;
                            }
                          },
                          // ---botao 2
                          {
                            text: 'CONFIRMAR ',
                            role: 'calcel',
                            handler: () => {
                              // ----------------------------------------------------------------------------------------
                              if (serieNova) {
                                this.lista.forEach(element => {
                                  if (
                                    element.codigo.replace(/\s/g, '') == codigoQrcode &&
                                    element.prateleira.replace(/\s/g, '') == prateleira_clicada
                                  ) {
                                    let valorNovo: number = element.quantidade - qtdQrcode;
                                    let valorTotalSeparado: number =
                                      element.qtd_separada + qtdQrcode;
                                    let valorEstoqueNovo: number =
                                      element.qtd_estoqueTotal - qtdQrcode;
                                    element.quantidade = valorNovo;
                                    element.qtd_separada = valorTotalSeparado;
                                    element.qtd_estoqueTotal = valorEstoqueNovo;
                                    this.series.push(serieQrcode);

                                    /// grava todas as series do mesmo material em materialSeries e  zera series
                                    let codigo: string = element.codigo;
                                    let serieSTRING: string = this.series.join(',');
                                    this.materialSeries.push({
                                      codigo: codigo,
                                      series: serieSTRING
                                    });
                                    let tamanho: number = this.series.length;
                                    this.series.splice(0, tamanho);
                                    // impede que leia outro material com mesmo código
                                    repete = false;

                                    // -----gravando alteração no storage
                                    this.bd.banco
                                      .setItem('LISTA', this.lista)
                                      .then(() => console.log('Stored item!'));
                                    // -------------------------------------------
                                    // -----------------------------GRAVANDO MaterialSeries NO STORAGE--------------------------------
                                    this.bd.banco
                                      .setItem('SERIE', this.materialSeries)
                                      .then(() => console.log('Stored item!'));
                                    // fim teste storage------------------------------------
                                  }
                                });
                              }
                              // ---------------------------------------------------------------------------------
                            }
                          }
                        ]
                      });
                      await alert.present();
                    }
                    // -----FIM DO QUANTIDADE ESTOQUE MAIOR QUE QR-------------------------------------------------
                  } else {
                    alert('QUANTIDADE DE ' + qtdQrcode + ' MAIOR QUE A DO ESTOQUE DO DEPÓSITO.');
                    repete = false;
                  }
                  if (repete) {
                    this.lerQr(item);
                  }
                } else {
                  alert('CODIGO LIDO NÃO CONFERE');
                  repete = false;
                }
              } /// fim tem serie e não tem gedis
            } else {
              /// inicio tem código e quantidade apenas

              if (codigoClicado.replace(/\s/g, '') == codigoQrcode) {
                if (qtdEstoqueTotal_clicado >= qtdQrcode) {
                  if (qtdClicado >= qtdQrcode) {
                    this.lista.forEach(async element => {
                      if (
                        element.codigo.replace(/\s/g, '') == codigoQrcode &&
                        element.prateleira.replace(/\s/g, '') == prateleira_clicada
                      ) {
                        let valorNovo: number = element.quantidade - qtdQrcode;
                        let valorTotalSeparado: number = element.qtd_separada + qtdQrcode;
                        let valorEstoqueNovo: number = element.qtd_estoqueTotal - qtdQrcode;
                        element.quantidade = valorNovo;
                        element.qtd_separada = valorTotalSeparado;
                        element.qtd_estoqueTotal = valorEstoqueNovo;
                        if (element.quantidade == 0) {
                          alert('MATERIAL ' + element.codigo + ' SEPARADO COM SUCESSO!!!!');
                          repete = false;
                        }
                        if (element.quantidade > 0) {
                          repete = false;
                          let alert = await this.alertCtrl.create({
                            header: element.nome,
                            message: 'Faltam separar ' + element.quantidade + ' unidades',
                            buttons: [
                              // ---botao 1
                              {
                                text: 'CANCELAR',
                                role: 'calcel',
                                handler: () => {
                                  repete = false;
                                }
                              },
                              // ---botao 2
                              {
                                text: 'CONTINUAR',
                                role: 'calcel',
                                handler: () => {
                                  repete = true;
                                  if (repete) {
                                    this.lerQr(item);
                                  }
                                }
                              }
                            ]
                          });
                          await alert.present();
                        }
                      }
                    });

                    // -----gravando alteração no storage
                    this.bd.banco
                      .setItem('LISTA', this.lista)
                      .then(
                        () => console.log('Stored item!'),
                        error => alert('Lista não gravada na memória interna -> ' + error)
                      );
                    // -------------------------------------------
                  }

                  /// inicio qtd clicado maior q do qr so com codigo e qtd
                  if (qtdClicado < qtdQrcode) {
                    repete = false;
                    let alert = await this.alertCtrl.create({
                      header: codigoClicado,
                      message: 'Quantidade ultrapassa pedido',
                      buttons: [
                        // ---botao 1
                        {
                          text: 'CANCELA',
                          role: 'calcel',
                          handler: () => {
                            repete = false;
                          }
                        },
                        // ---botao 2
                        {
                          text: 'CONFIRMAR ',
                          role: 'calcel',
                          handler: () => {
                            this.lista.forEach(element => {
                              if (
                                element.codigo.replace(/\s/g, '') == codigoQrcode &&
                                element.prateleira.replace(/\s/g, '') == prateleira_clicada
                              ) {
                                let valorNovo: number = element.quantidade - qtdQrcode;
                                let valorTotalSeparado: number = element.qtd_separada + qtdQrcode;
                                let valorEstoqueNovo: number = element.qtd_estoqueTotal - qtdQrcode;
                                element.quantidade = valorNovo;
                                element.qtd_separada = valorTotalSeparado;
                                element.qtd_estoqueTotal = valorEstoqueNovo;
                              }
                            });
                            // -----gravando alteração no storage
                            this.bd.banco
                              .setItem('LISTA', this.lista)
                              .then(() => console.log('Stored item!'));
                          }
                        }
                      ]
                    });
                    await alert.present();
                  }

                  // ------------------------------------------------------------------------------------------------------------------
                } else {
                  alert('QUANTIDADE DE ' + qtdQrcode + ' MAIOR QUE A DO ESTOQUE DO DEPÓSITO.');
                  repete = false;
                }
                if (repete) {
                  this.lerQr(item);
                }
              } else {
                alert('CODIGO LIDO NÃO CONFERE');
                repete = false;
              }
            }

            /// fim tem código e tem quantidade--------------------------------------------------------------------------------------------------------------
          } else {
            if (codigoClicado.replace(/\s/g, '') == codigoQrcode) {
              /// inicio tem código e não tem quantidade
              let alertQuantidade = await this.alertCtrl.create({
                header: 'QUANTIDADE DO MATERIAL ' + codigoClicado,
                message:
                  'Insira manualmente a quantidade do material . Atenção, faltam separar ' +
                  qtdClicado +
                  ' unidade(s)',
                inputs: [
                  {
                    name: 'quantiadde',
                    placeholder: 'quantidade',
                    type: 'number'
                  }
                ],
                buttons: [
                  {
                    text: 'confirmar',
                    role: 'cancel',
                    handler: async data => {
                      let qtdDigitado: any = parseFloat(data.quantiadde);

                      if (qtdEstoqueTotal_clicado >= qtdDigitado) {
                        if (qtdClicado >= qtdDigitado) {
                          this.lista.forEach(async element => {
                            if (
                              element.codigo.replace(/\s/g, '') == codigoQrcode &&
                              element.prateleira.replace(/\s/g, '') == prateleira_clicada
                            ) {
                              let valorNovo: number = element.quantidade - qtdDigitado;
                              let valorTotalSeparado: number = element.qtd_separada + qtdDigitado;
                              let valorEstoqueNovo: number = element.qtd_estoqueTotal - qtdDigitado;
                              element.quantidade = valorNovo;
                              element.qtd_separada = valorTotalSeparado;
                              element.qtd_estoqueTotal = valorEstoqueNovo;
                              element.lidoManual = true;

                              if (element.quantidade == 0) {
                                alert('MATERIAL ' + element.codigo + ' SEPARADO COM SUCESSO!!!!');
                                repete = false;
                              }

                              if (element.quantidade > 0) {
                                repete = false;
                                let alert = await this.alertCtrl.create({
                                  header: element.nome,
                                  message: 'Faltam separar ' + element.quantidade + ' unidades',
                                  buttons: [
                                    // ---botao 1
                                    {
                                      text: 'CANCELAR',
                                      role: 'calcel',
                                      handler: () => {
                                        repete = false;
                                      }
                                    },
                                    // ---botao 2
                                    {
                                      text: 'CONTINUAR',
                                      role: 'calcel',
                                      handler: () => {
                                        repete = true;
                                        if (repete) {
                                          this.lerQr(item);
                                        }
                                      }
                                    }
                                  ]
                                });
                                await alert.present();
                              }
                            }
                          });

                          // -----gravando alteração no storage

                          this.bd.banco
                            .setItem('LISTA', this.lista)
                            .then(
                              () => console.log('Stored item!'),
                              error => alert('Lista não gravada na memória interna -> ' + error)
                            );
                        }
                        // -------------------------------------------------------------------------------
                        /// inicio qtd clicado maior q do qr so com codigo e qtd
                        if (qtdClicado < qtdDigitado) {
                          repete = false;
                          let alert = await this.alertCtrl.create({
                            header: codigoClicado,
                            message: 'Quantidade ultrapassa pedido',
                            buttons: [
                              // ---botao 1
                              {
                                text: 'CANCELA',
                                role: 'calcel',
                                handler: () => {
                                  repete = false;
                                }
                              },
                              // ---botao 2
                              {
                                text: 'CONFIRMAR ',
                                role: 'calcel',
                                handler: () => {
                                  this.lista.forEach(element => {
                                    if (
                                      element.codigo.replace(/\s/g, '') == codigoQrcode &&
                                      element.prateleira.replace(/\s/g, '') == prateleira_clicada
                                    ) {
                                      let valorNovo: number = element.quantidade - qtdDigitado;
                                      let valorTotalSeparado: number =
                                        element.qtd_separada + qtdDigitado;
                                      let valorEstoqueNovo: number =
                                        element.qtd_estoqueTotal - qtdDigitado;
                                      element.quantidade = valorNovo;
                                      element.qtd_separada = valorTotalSeparado;
                                      element.qtd_estoqueTotal = valorEstoqueNovo;
                                      element.lidoManual = true;
                                    }
                                  });
                                  // -----gravando alteração no storage
                                  this.bd.banco
                                    .setItem('LISTA', this.lista)
                                    .then(() => console.log('Stored item!'));
                                }
                              }
                            ]
                          });
                          await alert.present();
                        }

                        // -------------------------------------------
                      } else {
                        alert(
                          'QUANTIDADE DE ' + qtdDigitado + ' MAIOR QUE A DISPONIVEL NO DEPÓSITO.'
                        );
                        repete = false;
                      }
                      if (repete) {
                        this.lerQr(item);
                      }
                    }
                  }
                ]
              });
              await alertQuantidade.present();
            } else {
              alert('CODIGO LIDO NÃO CONFERE');
              repete = false;
            }
          } // fim tem código e não tem quantidade
        } // fim tem codigo
        // fim do scanner
      })
      .catch(err => {
        /// não usa.
      });
  } /// fim função ler qrcode

  // funçao para apagar dados de um item--------------------------------------------------------

  public async apaga(item) {
    let itemClicado = item;
    let codigoClicado = itemClicado.codigo;
    let prateleiraClicada = itemClicado.prateleira;

    let alert = await this.alertCtrl.create({
      header: codigoClicado,
      message: 'Deseja zerar contagem deste item?',
      buttons: [
        // ---botao 1
        {
          text: 'CANCELA',
          role: 'calcel',
          handler: () => {}
        },
        // ---botao 2
        {
          text: 'CONFIRMAR ',
          role: 'calcel',
          handler: () => {
            // zerando a quantidade contada
            this.lista.forEach(element => {
              if (
                element.codigo == codigoClicado &&
                element.prateleira == prateleiraClicada &&
                element.qtd_separada > 0
              ) {
                let quantidadeInicio = element.quantidade + element.qtd_separada;
                let estoqueInicio = element.qtd_estoqueTotal + element.qtd_separada;

                element.quantidade = quantidadeInicio;
                element.qtd_estoqueTotal = estoqueInicio;
                element.qtd_separada = 0;
                element.lidoManual = false;
              }
            });

            // zerandoseries e gedis
            // zerandoseries e gedis
            let contador: number = 0;
            this.materialSeries.forEach(elementS => {
              if (elementS.codigo == codigoClicado) {
                this.materialSeries.splice(contador, 1);
              }
              contador = contador + 1;
            });

            let contador2: number = 0;
            this.materialgediss.forEach(elementG => {
              if (elementG.codigo == codigoClicado) {
                this.materialgediss.splice(contador2, 1);
              }
              contador2 = contador2 + 1;
            });

            // zerando series e gedis já contados no volatil
            let tam: number = this.series.length;
            this.series.splice(0, tam);
            tam = this.gediss.length;
            this.gediss.splice(0, tam);

            // grava lista storage
            this.bd.banco.setItem('LISTA', this.lista).then(() => console.log('Stored item!'));
          }
        }
      ]
    });
    await alert.present();
  }
}

