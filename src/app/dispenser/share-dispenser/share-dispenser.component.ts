import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { MatDividerModule} from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material';
import { FormsModule } from '@angular/forms';


declare let require: any;

const XCHF_artifacts = require('../../../assets/contracts/CryptoFranc.json');
const XCHFAddress = "0x297a9769cf6e0609503e11f224bb0c68689462ee";

const AS_artifacts = require('../../../assets/contracts/Claimable.json');
const ASAddress = "0xd0A570cc40b949230c76a3bB08dB15ee5755dAc0";

const SD_artifacts = require('../../../assets/contracts/AlethenaShares.json');
const SDAddress = "0xd0A570cc40b949230c76a3bB08dB15ee5755dAc01";



@Component({
  selector: 'app-share-dispenser',
  templateUrl: './share-dispenser.component.html',
  styleUrls: ['./share-dispenser.component.css']
})
export class ShareDispenserComponent implements OnInit {
  accounts: string[];
  account: string;

  SDTotalSupply: number = 0;
  SDAvailable: number = 0;
  totalPrice: number = 60;
  pricePerShare: number = 5;
  numberOfSharesToBuy: number = 12;


  shareTokenTerms: boolean = false;
  privacyPolicy: boolean = false;
  prospectus: boolean = false;

  nonce: string = "Enter a nonce";
  claimedAddress: string = "0x";
  package: string = "";

  nonce2: string = "Enter a nonce";
  claimedAddress2: string = "0x";

  claimedAddress3: string = "0x";

  SD: any;
  XCHF: any;
  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar, private matDividerModule: MatDividerModule) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);

    // this.web3Service.artifactsToContract(XCHF_artifacts).then(
    //   (XCHFAbstraction) => {
    //     console.log(XCHFAbstraction)
    //     XCHFAbstraction.at(XCHFAddress).then(
    //       (XCHFInstance => {
    //         console.log(XCHFInstance);
    //         XCHFInstance.totalSupply.call().then(
    //           (totSupp) => {
    //             // this.SDAvailable = totSupp.toString();
    //           }
    //         )
    //       })
    //     )
    //   }
    // )

    this.watchAccount();
  }

  setAmount(e) {
    console.log('Setting amount: ' + e.target.value);
    this.numberOfSharesToBuy = e.target.value;
    this.totalPrice = e.target.value * this.pricePerShare;
  }

  setNonce(e) {
    this.nonce = e.target.value;
  }
  setNonce2(e) {
    this.nonce2 = e.target.value;
  }

  setAddress(e) {
    this.claimedAddress = e.target.value;
  }
  setAddress2(e) {
    this.claimedAddress2 = e.target.value;
  }
  setAddress3(e) {
    this.claimedAddress3 = e.target.value;
  }
  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.account = accounts[0];
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 6000});
  }

  // async sendCoin() {
  //   if (!this.MetaCoin) {
  //     this.setStatus('Metacoin is not loaded, unable to send transaction');
  //     return;
  //   }

// web3.sha3(web3.toHex(web3.sha3(nonce)) + claimerAddress + claimedAddress, {encoding:"hex"})

  async preclaim() {
    console.log("Account:", this.accounts[0]);
    console.log("Parameters:",this.nonce, this.accounts[0].slice(2, 42), this.claimedAddress.slice(2, 42));
    let res = await this.web3Service.computePackage(this.nonce, this.accounts[0].slice(2, 42), this.claimedAddress.slice(2, 42));
    this.package = res;

    this.web3Service.artifactsToContract(AS_artifacts).then(
      (ASAbstraction) => {
        ASAbstraction.at(ASAddress).then(
          (ASInstance) => {
            ASInstance.prepareClaim.sendTransaction(res, { from: this.account, gas: 4000000 }).then(
              (err,answ)=> {
                console.log(err,answ);
              } 
            )
          }
        )
      }
    )

  }

  async claim() {
   
    let res = await this.web3Service.computePackage(this.nonce, this.accounts[0].slice(2, 42), this.claimedAddress.slice(2, 42));
    this.package = res;
    let hashedNonce = await this.web3Service.getHash(this.nonce2);
    console.log(hashedNonce);

    this.web3Service.artifactsToContract(AS_artifacts).then(
      (ASAbstraction) => {
        ASAbstraction.at(ASAddress).then(
          (ASInstance) => {
            ASInstance.declareLost.sendTransaction(this.claimedAddress2, hashedNonce, { from: this.account, gas: 4000000 }).then(
              (err,answ)=> {
                console.log(err,answ);
              } 
            )
          }
        )
      }
    )

  }

  async resolve() {
    this.web3Service.artifactsToContract(AS_artifacts).then(
      (ASAbstraction) => {
        ASAbstraction.at(ASAddress).then(
          (ASInstance) => {
            ASInstance.resolveClaim.sendTransaction(this.claimedAddress3, { from: this.account, gas: 4000000 }).then(
              (err,answ)=> {
                console.log(err,answ);
              } 
            )
          }
        )
      }
    )
  }

}
