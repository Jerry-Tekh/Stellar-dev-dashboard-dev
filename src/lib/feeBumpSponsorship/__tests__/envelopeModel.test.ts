import { describe, it, expect } from 'vitest';
import {
  validateFeeBumpEnvelope,
  buildInnerTransaction,
  buildCompleteEnvelope,
  verifyXdrRoundTrip,
} from '../envelopeModel';
import type { FeeBumpEnvelopeModel } from '../../../types/feeBumpSponsorship';

describe('Fee-Bump Envelope Model', () => {
  const validSource = 'GANIOWIIIQ4XECWLM3BOLMDX7UWAEKKPRHAMOAOJPZ3CFGBXUQFRGMXA';
  const validFeeSource = 'GCB6LGWDIPB53EGK2BRA43I6VXUYT2A4KZODT7FGFM2FUGO2BAUHLWCN';

  const validModel: FeeBumpEnvelopeModel = {
    isFeeBump: true,
    feeSource: validFeeSource,
    maxFee: '500',
    innerTransaction: {
      sourceAccount: validSource,
      sequenceNumber: '1000',
      baseFee: '100',
      operations: [
        {
          id: 'op1',
          type: 'payment',
          params: { destination: validFeeSource, amount: '10', assetType: 'native' },
        },
      ],
      signatures: [],
    },
    outerSignatures: [],
  };

  it('validates a correct fee-bump envelope', () => {
    const res = validateFeeBumpEnvelope(validModel);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('rejects fee-bump envelope with insufficient max fee', () => {
    // 1 op requires baseFee * (1 + 1) = 200 stroops minimum
    const badModel: FeeBumpEnvelopeModel = {
      ...validModel,
      maxFee: '150',
    };
    const res = validateFeeBumpEnvelope(badModel);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('must be at least 200 stroops'))).toBe(true);
  });

  it('rejects empty operations list in inner transaction', () => {
    const emptyOpsModel: FeeBumpEnvelopeModel = {
      ...validModel,
      innerTransaction: {
        ...validModel.innerTransaction,
        operations: [],
      },
    };
    const res = validateFeeBumpEnvelope(emptyOpsModel);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('at least one operation'))).toBe(true);
  });

  it('verifies XDR round-trip serialization', () => {
    const res = verifyXdrRoundTrip(validModel, 'testnet');
    expect(res.success).toBe(true);
    expect(res.xdr).toBeTruthy();
    expect(res.parsedBack).toBeDefined();
  });
});
