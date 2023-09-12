import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import escrowJson from '../src/artifacts/contracts/Escrow.sol/Escrow.json';

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

const contractABI = escrowJson.abi;

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();

    function deserializeEscrow(escrowObj) {
      const escrowContract = new ethers.Contract(escrowObj.address, contractABI, provider);
      escrowObj.handleApprove = async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });
  
        await approve(escrowContract, signer);
      };
      return escrowObj;
    }  

    async function getContracts() {
      let response = await fetch("http://localhost:3030/contracts");
      response = await response.json();
      const deEscrows = response.map(contract => deserializeEscrow(contract))
      setEscrows(deEscrows);
    }
    getContracts();
  }, [account]);

  async function saveEscrowContract(escrow) {
    const escrowString = serializeEscrow(escrow);

    await fetch("http://localhost:3030/contracts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: escrowString
    });
  }

  function serializeEscrow(escrow) {
    return JSON.stringify({
      address: escrow.address,
      arbiter: escrow.arbiter,
      beneficiary: escrow.beneficiary,
      value: escrow.value,
    });
  }

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.utils.parseEther(document.getElementById('eth').value)
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);


    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    saveEscrowContract(escrow)
    setEscrows([...escrows, escrow]);
  }

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Eth)
          <input type="text" id="eth" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
