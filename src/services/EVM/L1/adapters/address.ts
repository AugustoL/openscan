// src/services/EVM/L1/adapters/address.ts
import type { Address } from '../../../../types';

export class AddressAdapter {
  static fromRawData(
    address: string,
    balance: bigint,
    code: string,
    txCount: number,
    chainId: number
  ): Address {
    return {
      address,
      balance: balance.toString(),
      txCount: txCount.toString(),
      code: code,
      storeageAt: {},
    };
  }
}
