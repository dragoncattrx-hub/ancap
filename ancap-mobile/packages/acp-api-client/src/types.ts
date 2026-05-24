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

export type AcpNetworkStatus = {
  chain: "acp";
  rpcStatus: string;
  blockHeight: number | null;
  minFeeAcp: string;
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

export type AcpTransactionIo = {
  address: string | null;
  units: string;
  acp: string;
  vout: number | null;
};

export type AcpTransactionDetails = {
  txid: string;
  block_height: number;
  block_hash: string | null;
  block_time: string;
  confirmations: number;
  total_input_units: string;
  total_input_acp: string;
  total_output_units: string;
  total_output_acp: string;
  fee_units: string;
  fee_acp: string;
  inputs: AcpTransactionIo[];
  outputs: AcpTransactionIo[];
};

export type BroadcastResult = {
  accepted: boolean;
  txid: string | null;
  reason: string | null;
};

export type MobileDevicePlatform = "ios" | "android";

export type MobileDeviceRegisterInput = {
  deviceToken: string;
  platform: MobileDevicePlatform;
  appVersion?: string | null;
};

export type MobileDeviceRegisterResponse = {
  device_id: string;
  registered: boolean;
  message: string;
};

export type MobileDeviceUnregisterResponse = {
  ok: boolean;
  message: string;
};

export type MobileDeviceInfo = {
  device_id: string;
  platform: string;
  app_version: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
};

export type MobileDeviceListResponse = {
  devices: MobileDeviceInfo[];
};
