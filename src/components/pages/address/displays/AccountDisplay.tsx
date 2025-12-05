import type React from "react";
import type {
  Address,
  AddressTransactionsResult,
  DecodedContenthash,
  ENSRecords,
  ENSReverseResult,
  RPCMetadata,
  Transaction,
} from "../../../../types";
import ENSRecordsDetails from "../shared/ENSRecordsDisplay";
import { AddressHeader, BalanceSection, TransactionHistory } from "../shared";

interface AccountDisplayProps {
  address: Address;
  addressHash: string;
  networkId: string;
  transactionsResult?: AddressTransactionsResult | null;
  transactionDetails: Transaction[];
  loadingTxDetails: boolean;
  metadata?: RPCMetadata;
  selectedProvider?: string | null;
  onProviderSelect?: (provider: string) => void;
  // ENS props
  ensName?: string | null;
  reverseResult?: ENSReverseResult | null;
  ensRecords?: ENSRecords | null;
  decodedContenthash?: DecodedContenthash | null;
  ensLoading?: boolean;
  isMainnet?: boolean;
}

const AccountDisplay: React.FC<AccountDisplayProps> = ({
  address,
  addressHash,
  networkId,
  transactionsResult,
  transactionDetails,
  loadingTxDetails,
  metadata,
  selectedProvider,
  onProviderSelect,
  ensName,
  reverseResult,
  ensRecords,
  decodedContenthash,
  ensLoading = false,
  isMainnet = true,
}) => {
  return (
    <div className="block-display-card">
      <AddressHeader
        addressHash={addressHash}
        addressType="account"
        ensName={ensName || reverseResult?.ensName}
        metadata={metadata}
        selectedProvider={selectedProvider}
        onProviderSelect={onProviderSelect}
      />

      <div className="address-section-content">
        {/* Balance Section */}
        <BalanceSection address={address} />

        {/* ENS Records Section */}
        {(ensName || reverseResult?.ensName || ensLoading) && (
          <ENSRecordsDetails
            ensName={ensName || null}
            reverseResult={reverseResult}
            records={ensRecords}
            decodedContenthash={decodedContenthash}
            loading={ensLoading}
            isMainnet={isMainnet}
          />
        )}

        {/* Transaction History */}
        <TransactionHistory
          networkId={networkId}
          addressHash={addressHash}
          transactionsResult={transactionsResult}
          transactionDetails={transactionDetails}
          loadingTxDetails={loadingTxDetails}
        />
      </div>
    </div>
  );
};

export default AccountDisplay;
