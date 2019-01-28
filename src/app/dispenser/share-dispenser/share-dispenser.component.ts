import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Big } from 'big.js';

declare let require: any;

const AS_artifacts = require('../../../assets/contracts/Claimable.json');
const ASAddress = "0xf40c5e190a608B6F8C0bF2b38C9506b327941402";
const AS_artifacts2 = require('../../../assets/contracts/AlethenaShares.json');

@Component({
  selector: 'app-share-dispenser',
  templateUrl: './share-dispenser.component.html',
  styleUrls: ['./share-dispenser.component.css']
})
export class ShareDispenserComponent implements OnInit {
  accounts: string[];
  account: string;

  nonce: string = "Enter a nonce";
  claimedAddress: string = "0x";
  package: string = "";

  nonce2: string = "Enter a nonce";
  claimedAddress2: string = "0x";

  claimedAddress3: string = "0x";

  collateral = 0;

  SD: any;
  XCHF: any;
  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar, private matDividerModule: MatDividerModule) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {

    this.watchAccount();
  }


  setNonce(e) {
    this.nonce = e.target.value;
  }
  setNonce2(e) {
    this.nonce2 = e.target.value;
  }

  async setAddress(e) {
    this.claimedAddress = e.target.value;
    let ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts2);
    let ASInstance = await ASAbstraction.at(ASAddress);
    // let bal = await ASInstance.balanceOf.call(e.target.value);

    let bal = new Big(await ASInstance.balanceOf.call(e.target.value))
    // bal = this.web3Service.toBigNumber(bal);

    ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts);
    ASInstance = await ASAbstraction.at(ASAddress);
    let rate = new Big(await ASInstance.collateralRate.call());
    // rate = this.web3Service.toBigNumber(0.0 + rate).div(10**18);

    let price = rate.times(bal).div(10**18);
    this.web3Service.setStatus("Address " + e.target.value + " currently holds " + bal + " Alethena Shares. Making a claim will cost " + price + " Ether.")
  
  }

  async setAddress2(e) {
    this.claimedAddress2 = e.target.value;
    let ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts2);
    let ASInstance = await ASAbstraction.at(ASAddress);
    // let bal = await ASInstance.balanceOf.call(e.target.value);

    let bal = new Big(await ASInstance.balanceOf.call(e.target.value))
    // bal = this.web3Service.toBigNumber(bal);

    ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts);
    ASInstance = await ASAbstraction.at(ASAddress);
    let rate = new Big(await ASInstance.collateralRate.call());
    // rate = this.web3Service.toBigNumber(0.0 + rate).div(10**18);

    let price = rate.times(bal).div(10**18);
    this.collateral = new Big(price*10**18);
    this.web3Service.setStatus("Address " + e.target.value + " currently holds " + bal + " Alethena Shares. Making a claim will cost " + price + " Ether.")
  }

  async setAddress3(e) {
    this.claimedAddress3 = e.target.value;
    let ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts2);
    let ASInstance = await ASAbstraction.at(ASAddress);
    // let bal = await ASInstance.balanceOf.call(e.target.value);

    let bal = new Big(await ASInstance.balanceOf.call(e.target.value))
    // bal = this.web3Service.toBigNumber(bal);

    ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts);
    ASInstance = await ASAbstraction.at(ASAddress);
    let claimer = await ASInstance.getClaimant.call(e.target.value);
    // rate = this.web3Service.toBigNumber(0.0 + rate).div(10**18);

    // let price = rate.times(bal).div(10**18);
    if (claimer==0) {
      this.web3Service.setStatus("You don't have a claim on this address!");
    }
    else {
      this.web3Service.setStatus("Address " + claimer + " currently has a claim on " + e.target.value)
    }
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.account = accounts[0];
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 6000 });
  }

  async preclaim() {
    let res = await this.web3Service.computePackage(this.nonce, this.accounts[0].slice(2, 42), this.claimedAddress.slice(2, 42));
    this.package = res;

    try {
      let ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts);
      let ASInstance = await ASAbstraction.at(ASAddress);
      let answ = await ASInstance.prepareClaim.sendTransaction(res, { from: this.account, gas: 4000000 })
      console.log(answ);
    }
    catch (error) {
      console.log(error);
      this.web3Service.setStatus("An error occured during your transaction!")

    }
  }

  async claim() {

    try {
      let res = await this.web3Service.computePackage(this.nonce, this.accounts[0].slice(2, 42), this.claimedAddress.slice(2, 42));
      this.package = res;
      let hashedNonce = await this.web3Service.getHash(this.nonce2);
      
      let ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts);
      let ASInstance = await ASAbstraction.at(ASAddress);

      let answ = await ASInstance.declareLost.sendTransaction(this.claimedAddress2, hashedNonce, { from: this.account, gas: 4000000 , value: this.collateral})
      console.log(answ);
    }
    
    catch (error) {
      console.log(error);
      this.web3Service.setStatus("An error occured during your transaction!")
    }
  }

  async resolve() {

    try {
      let res = await this.web3Service.computePackage(this.nonce, this.accounts[0].slice(2, 42), this.claimedAddress.slice(2, 42));
      this.package = res;
      let hashedNonce = await this.web3Service.getHash(this.nonce2);

      let ASAbstraction = await this.web3Service.artifactsToContract(AS_artifacts);
      let ASInstance = await ASAbstraction.at(ASAddress);

      let answ = await ASInstance.resolveClaim.sendTransaction(this.claimedAddress3, { from: this.account, gas: 4000000 })
      console.log(answ);
    }

    catch (error) {
      console.log(error);
      this.web3Service.setStatus("An error occured during your transaction!")
    }
  }

}
