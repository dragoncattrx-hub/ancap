export type MobileConfig = {
  minAppVersion: string;
  maintenance: boolean;
  maintenanceMessage: string | null;
  acpDecimals: number;
  wacpDecimals: number;
  acpRpcStatus: string;
  bridgeStatus: string;
  bridgeEnabled: boolean;
  bridgePaused: boolean;
  bridgeReverseEnabled: boolean;
  wacpContract: string;
  bscChainId: number;
  acpRpcUrl: string;
  bscRpcUrl: string;
  acpExplorerTxBase: string;
  bscExplorerBase: string;
  supportUrl: string;
  docs: {
    bridge: string;
    risks: string;
    reserve: string;
    contracts: string;
    walletSecurity: string;
  };
};

export type MobileBalance = {
  address: string;
  units: string;
  acp: string;
  utxo_count: number;
};

export type AcpTransaction = {
  txid: string;
  block_height: number;
  block_time: string;
  confirmations: number;
  direction: "in" | "out" | "self";
  sent_units: string;
  sent_acp: string;
  received_units: string;
  received_acp: string;
  net_units: string;
  net_acp: string;
};

export type BroadcastResult = {
  accepted: boolean;
  txid: string | null;
  reason: string | null;
};
