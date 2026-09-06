from eth_account import Account
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from app.config import get_settings

s = get_settings()
w3 = Web3(Web3.HTTPProvider(s.bridge_bsc_rpc_url, request_kwargs={"timeout": 30}))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
acct = Account.from_key(s.bridge_bsc_private_key)
abi = [
    {"inputs": [], "name": "maxSingleMint", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "mintCapPerDay", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
]
gw = w3.eth.contract(address=Web3.to_checksum_address(s.bridge_gateway_contract), abi=abi)
bal = w3.eth.get_balance(acct.address)
print("signer", acct.address)
print("bnb_wei", bal)
print("maxSingleMint", gw.functions.maxSingleMint().call())
print("mintCapPerDay", gw.functions.mintCapPerDay().call())
print("need", 25200000000000000000000000)
