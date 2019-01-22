import {Injectable} from '@angular/core';
import contract from 'truffle-contract';
import { MatSnackBar } from '@angular/material';

import {Subject} from 'rxjs';
declare let require: any;
const Web3 = require('web3');


declare let window: any;

@Injectable()
export class Web3Service {
  private web3: any;
  private accounts: string[];
  public ready = false;
  public metaMask: boolean;

  public accountsObservable = new Subject<string[]>();

  constructor(private matSnackBar: MatSnackBar) {
    window.addEventListener('load', (event) => {
      this.bootstrapWeb3();
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 6000, verticalPosition: 'top'});
  }

  public async bootstrapWeb3() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    // console.log("ETHEREUM:",window.ethereum);
    if (typeof window.ethereum !== 'undefined') {
      // Use Mist/MetaMask's provider
      this.web3 = new Web3(window.ethereum);
      console.log("WEB3:", this.web3)
      try {
        let MM = await window.ethereum.enable();
        this.setStatus('MetaMask enabled!');
      }
      catch{
        this.setStatus('There was an error enabling MetaMask');
      }
          
    } else {
      this.setStatus('Please use MetaMask if you want to buy shares');

      // Hack to provide backwards compatibility for Truffle, which uses web3js 0.20.x
      Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      this.web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/2a59f4ddc9b14dd5b321f5fbee33f77d"));
      this.metaMask = false;
      console.log("MM", this.metaMask);
    }

    setInterval(() => this.refreshAccounts(), 100);
  }

  public async computePackage(nonce, claimerAddress, claimedAddress){
    return this.web3.utils.sha3(this.web3.utils.toHex(this.web3.utils.sha3(nonce)) + claimerAddress + claimedAddress, {encoding:"hex"});
  };

  public async getHash(nonce) {
    return this.web3.utils.sha3(nonce, {encoding:"hex"});
  };

  public async artifactsToContract(artifacts) {
    if (!this.web3) {
      const delay = new Promise(resolve => setTimeout(resolve, 100));
      await delay;
      return await this.artifactsToContract(artifacts);
    }

    const contractAbstraction = contract(artifacts);
    contractAbstraction.setProvider(this.web3.currentProvider);
    return contractAbstraction;

  }

  public async createBatch() {
    return await this.web3.createBatch();
  }

  public toBigNumber (number){
    return this.web3.utils.toBN(number);
  }

  private refreshAccounts() {
    this.web3.eth.getAccounts((err, accs) => {
      console.log('Refreshing accounts');
      if (err != null) {
        console.warn('There was an error fetching your accounts.');
        return;
      }

      // Get the initial account balance so it can be displayed.
      if (accs.length === 0) {
        console.warn('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
        return;
      }

      if (!this.accounts || this.accounts.length !== accs.length || this.accounts[0] !== accs[0]) {
        console.log('Observed new accounts');

        this.accountsObservable.next(accs);
        this.accounts = accs;
      }

      this.ready = true;
    });
  }


}
