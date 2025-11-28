import { describe, it, expect } from 'vitest';
import {
	convertEthUnits,
	parseInputValue,
	computeKeccak,
	stringToHex,
	hexToString,
	isValidAddress,
	isValidHex,
	isValidSignature,
	detectMessageFormat,
	parseSignatureComponents,
	addressesMatch,
} from '../../utils/devtools';

describe('DevTools Utils', () => {
	describe('convertEthUnits', () => {
		it('should convert 1 ETH to all units', () => {
			const result = convertEthUnits('1', 'eth');
			expect(result).not.toBeNull();
			expect(result!.eth).toBe('1');
			expect(result!.gwei).toBe('1000000000');
			expect(result!.wei).toBe('1000000000000000000');
		});

		it('should convert 1 gwei to all units', () => {
			const result = convertEthUnits('1', 'gwei');
			expect(result).not.toBeNull();
			expect(result!.gwei).toBe('1');
			expect(result!.wei).toBe('1000000000');
			expect(result!.eth).toBe('0.000000001');
		});

		it('should return null for invalid input', () => {
			const result = convertEthUnits('invalid', 'eth');
			expect(result).toBeNull();
		});
	});

	describe('parseInputValue', () => {
		it('should parse string type', () => {
			expect(parseInputValue('hello', 'string')).toBe('hello');
		});

		it('should parse uint256 as bigint', () => {
			const result = parseInputValue('12345', 'uint256');
			expect(result).toBe(BigInt(12345));
		});

		it('should parse bool true', () => {
			expect(parseInputValue('true', 'bool')).toBe(true);
			expect(parseInputValue('1', 'bool')).toBe(true);
		});

		it('should parse bool false', () => {
			expect(parseInputValue('false', 'bool')).toBe(false);
			expect(parseInputValue('0', 'bool')).toBe(false);
		});

		it('should add 0x prefix to address without it', () => {
			const result = parseInputValue('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'address');
			expect(result).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
		});

		it('should keep 0x prefix for address that has it', () => {
			const result = parseInputValue('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'address');
			expect(result).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
		});

		it('should throw for invalid address', () => {
			expect(() => parseInputValue('invalid', 'address')).toThrow('Invalid address format');
		});
	});

	describe('computeKeccak', () => {
		it('should compute keccak256 for string input', () => {
			const result = computeKeccak('hello', 'string');
			expect(result.rawHash).toBeDefined();
			expect(result.rawHash).toMatch(/^0x[a-f0-9]{64}$/i);
		});

		it('should return empty object for empty input', () => {
			const result = computeKeccak('', 'string');
			expect(result).toEqual({});
		});

		it('should detect function signature pattern', () => {
			const result = computeKeccak('transfer(address,uint256)', 'string');
			expect(result.isFunctionSignature).toBe(true);
			expect(result.functionSelector).toBeDefined();
			expect(result.functionSelector).toMatch(/^0x[a-f0-9]{8}$/i);
		});

		it('should not detect function signature for regular string', () => {
			const result = computeKeccak('hello world', 'string');
			expect(result.isFunctionSignature).toBe(false);
			expect(result.functionSelector).toBeNull();
		});

		it('should compute correct transfer function selector', () => {
			// transfer(address,uint256) = 0xa9059cbb
			const result = computeKeccak('transfer(address,uint256)', 'string');
			expect(result.functionSelector).toBe('0xa9059cbb');
		});
	});

	describe('stringToHex', () => {
		it('should convert string to hex', () => {
			expect(stringToHex('hello')).toBe('0x68656c6c6f');
		});

		it('should return hex unchanged if already hex', () => {
			expect(stringToHex('0xabcdef')).toBe('0xabcdef');
		});
	});

	describe('hexToString', () => {
		it('should convert hex to string', () => {
			expect(hexToString('0x68656c6c6f')).toBe('hello');
		});

		it('should throw for invalid hex format', () => {
			expect(() => hexToString('invalid')).toThrow('Invalid hex format');
		});
	});

	describe('isValidAddress', () => {
		it('should return true for valid address', () => {
			expect(isValidAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true);
		});

		it('should return false for address without 0x', () => {
			expect(isValidAddress('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(false);
		});

		it('should return false for too short address', () => {
			expect(isValidAddress('0xd8dA6BF')).toBe(false);
		});

		it('should return false for invalid characters', () => {
			expect(isValidAddress('0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBe(false);
		});
	});

	describe('isValidHex', () => {
		it('should return true for valid hex', () => {
			expect(isValidHex('0xabcdef123')).toBe(true);
		});

		it('should return true for empty hex', () => {
			expect(isValidHex('0x')).toBe(true);
		});

		it('should return false for hex without 0x', () => {
			expect(isValidHex('abcdef')).toBe(false);
		});

		it('should return false for invalid characters', () => {
			expect(isValidHex('0xghijkl')).toBe(false);
		});
	});

	// ================================================
	// Signature Section Tests
	// ================================================

	// Test data from real signatures
	const TEST_PRIVATE_KEY = '0x59c6995e998f97a5a0044976f61d9e7e3a22c3f842dbe2bcb87f5f3afc5fdf26';
	const TEST_ADDRESS = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';

	// Test case 1: Simple string message (eth_sign style)
	const SIMPLE_MESSAGE = 'Hello Augusto!';
	const SIMPLE_MESSAGE_HASH = '0xccad321f97da4a306ba3a0a5bb26487d32f821a3a32bda39d4d8362c59811cb8';
	const SIMPLE_SIGNATURE = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd73254f82e26a591778e44c23bda32a0bc89a8a066e3884b27f4f449ac1f51eb2f9d81c';
	const SIMPLE_SIG_R = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd7325';
	const SIMPLE_SIG_S = '0x4f82e26a591778e44c23bda32a0bc89a8a066e3884b27f4f449ac1f51eb2f9d8';
	const SIMPLE_SIG_V = 28; // 0x1c

	// Test case 2: Raw hex hash signature
	const RAW_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	const RAW_HASH_SIGNATURE = '0x5d8bd006953f0e4e24843f6d70ac7100dfc272afbb7c6baedbcd8beeb7fdb94902d539f30fcb46a1ec63c6fdb8f9f51a9af1c2a01f8aaa1ed9f1a5c32f7b54fc1c';

	// Test case 3: EIP-191 arbitrary data (0x45 version)
	const EIP191_MESSAGE = '0x457468657265756d2d4c32';
	const EIP191_SIGNATURE = '0x80c65f13df0840455fe9194c7a8d17dfb2d9696dbb669f53b06ba7f3a8888f0b51612b97d37b5226f0a4dc7dcfe5e8ce7f6618c0a5b75e56200de6f0d773f98c1b';

	// Test case 4: EIP-712 Typed Data
	const EIP712_DATA = {
		domain: {
			name: 'ExplorerDevtools',
			version: '1',
			chainId: 1,
			verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
		},
		types: {
			Person: [
				{ name: 'name', type: 'string' },
				{ name: 'wallet', type: 'address' }
			],
			Mail: [
				{ name: 'from', type: 'Person' },
				{ name: 'to', type: 'Person' },
				{ name: 'contents', type: 'string' }
			]
		},
		primaryType: 'Mail',
		message: {
			from: {
				name: 'Vikingo',
				wallet: '0x8ba1f109551bd432803012645ac136ddd64dba72'
			},
			to: {
				name: 'Augusto',
				wallet: '0x000000000000000000000000000000000000dEaD'
			},
			contents: 'Testing signatures'
		}
	};
	const EIP712_HASH = '0xe661c65b3febe03dcdee58850110f8c763c42e87d9dbd8d6fdfed142e7ba46f3';
	const EIP712_SIGNATURE = '0x2d480fdcd216ca933662705a13a539a8f979b29d69ee83a92389db8dd9e7f36a0f1dca546b14b8af72cbb02ca81237e9474413f6506c792da060e9981373bd051c';

	// Test case 5: EIP-191 Personal Sign with UTF-8 emoji
	const EMOJI_MESSAGE = '🔥 Test message for Augusto 🔥';
	const EMOJI_SIGNATURE = '0x06f6fd97a02e3b4811a53f17ef449f7d0be7ed96775847c63742aede1ac6b97875512c66af08b8e8dfa38f9a0eed3c28ba632a2c00c2522dbf316efee375d3161b';

	describe('isValidSignature', () => {
		it('should recognize 65-byte standard signature', () => {
			const result = isValidSignature(SIMPLE_SIGNATURE);
			expect(result.valid).toBe(true);
			expect(result.length).toBe(65);
			expect(result.format).toBe('Standard (65 bytes)');
		});

		it('should recognize all test signatures as valid', () => {
			expect(isValidSignature(SIMPLE_SIGNATURE).valid).toBe(true);
			expect(isValidSignature(RAW_HASH_SIGNATURE).valid).toBe(true);
			expect(isValidSignature(EIP191_SIGNATURE).valid).toBe(true);
			expect(isValidSignature(EIP712_SIGNATURE).valid).toBe(true);
			expect(isValidSignature(EMOJI_SIGNATURE).valid).toBe(true);
		});

		it('should recognize 64-byte EIP-2098 compact signature', () => {
			// 64 bytes = 128 hex chars + 0x prefix
			const compactSig = '0x' + 'b'.repeat(128);
			const result = isValidSignature(compactSig);
			expect(result.valid).toBe(true);
			expect(result.length).toBe(64);
			expect(result.format).toBe('EIP-2098 Compact (64 bytes)');
		});

		it('should reject signature without 0x prefix', () => {
			const sig = SIMPLE_SIGNATURE.slice(2);
			const result = isValidSignature(sig);
			expect(result.valid).toBe(false);
		});

		it('should reject signature with wrong length', () => {
			const sig = '0x' + 'a'.repeat(100);
			const result = isValidSignature(sig);
			expect(result.valid).toBe(false);
		});

		it('should reject signature with invalid hex characters', () => {
			const sig = '0x' + 'g'.repeat(130);
			const result = isValidSignature(sig);
			expect(result.valid).toBe(false);
		});
	});

	describe('detectMessageFormat', () => {
		it('should detect pre-hashed message (32 bytes hex)', () => {
			expect(detectMessageFormat(RAW_HASH)).toBe('hash');
			expect(detectMessageFormat(SIMPLE_MESSAGE_HASH)).toBe('hash');
			expect(detectMessageFormat(EIP712_HASH)).toBe('hash');
		});

		it('should detect EIP-712 typed data', () => {
			const eip712Json = JSON.stringify(EIP712_DATA);
			expect(detectMessageFormat(eip712Json)).toBe('eip712');
		});

		it('should detect personal sign for plain text', () => {
			expect(detectMessageFormat(SIMPLE_MESSAGE)).toBe('personal');
			expect(detectMessageFormat(EMOJI_MESSAGE)).toBe('personal');
		});

		it('should detect personal sign for invalid JSON', () => {
			expect(detectMessageFormat('{ invalid json')).toBe('personal');
		});

		it('should detect personal sign for JSON without EIP-712 fields', () => {
			const json = JSON.stringify({ foo: 'bar' });
			expect(detectMessageFormat(json)).toBe('personal');
		});

		it('should detect personal sign for hex that is not 32 bytes', () => {
			expect(detectMessageFormat(EIP191_MESSAGE)).toBe('personal');
		});
	});

	describe('parseSignatureComponents', () => {
		it('should parse simple message signature correctly', () => {
			const result = parseSignatureComponents(SIMPLE_SIGNATURE);
			expect(result).not.toBeNull();
			expect(result!.r).toBe(SIMPLE_SIG_R);
			expect(result!.s).toBe(SIMPLE_SIG_S);
			expect(result!.v).toBe(SIMPLE_SIG_V);
			expect(result!.yParity).toBe(1); // v=28 means yParity=1
		});

		it('should parse raw hash signature correctly', () => {
			const result = parseSignatureComponents(RAW_HASH_SIGNATURE);
			expect(result).not.toBeNull();
			expect(result!.r).toBe('0x5d8bd006953f0e4e24843f6d70ac7100dfc272afbb7c6baedbcd8beeb7fdb949');
			expect(result!.s).toBe('0x02d539f30fcb46a1ec63c6fdb8f9f51a9af1c2a01f8aaa1ed9f1a5c32f7b54fc');
			expect(result!.v).toBe(28);
		});

		it('should parse EIP-712 signature correctly', () => {
			const result = parseSignatureComponents(EIP712_SIGNATURE);
			expect(result).not.toBeNull();
			expect(result!.r).toBe('0x2d480fdcd216ca933662705a13a539a8f979b29d69ee83a92389db8dd9e7f36a');
			expect(result!.s).toBe('0x0f1dca546b14b8af72cbb02ca81237e9474413f6506c792da060e9981373bd05');
			expect(result!.v).toBe(28);
		});

		it('should parse EIP-191 signature correctly', () => {
			const result = parseSignatureComponents(EIP191_SIGNATURE);
			expect(result).not.toBeNull();
			expect(result!.v).toBe(27); // 0x1b
			expect(result!.yParity).toBe(0);
		});

		it('should parse emoji message signature correctly', () => {
			const result = parseSignatureComponents(EMOJI_SIGNATURE);
			expect(result).not.toBeNull();
			expect(result!.v).toBe(27); // 0x1b
		});

		it('should return null for invalid signature', () => {
			expect(parseSignatureComponents('invalid')).toBeNull();
			expect(parseSignatureComponents('0xabc')).toBeNull();
		});
	});

	describe('addressesMatch', () => {
		it('should match identical addresses', () => {
			expect(addressesMatch(TEST_ADDRESS, TEST_ADDRESS)).toBe(true);
		});

		it('should match addresses with different case', () => {
			const lowerCase = TEST_ADDRESS.toLowerCase();
			const upperCase = TEST_ADDRESS.toUpperCase();
			expect(addressesMatch(lowerCase, upperCase)).toBe(true);
		});

		it('should not match different addresses', () => {
			expect(addressesMatch(TEST_ADDRESS, '0x1234567890123456789012345678901234567890')).toBe(false);
		});

		it('should return false for empty addresses', () => {
			expect(addressesMatch('', TEST_ADDRESS)).toBe(false);
			expect(addressesMatch(TEST_ADDRESS, '')).toBe(false);
			expect(addressesMatch('', '')).toBe(false);
		});
	});

	// ================================================
	// Invalid Signature Tests
	// ================================================

	// Invalid test data
	
	// 1) ECDSA malleability - high-s value (s' = n - s)
	const MALLEATED_SIGNATURE = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd7325b07d1d9596e8871bb3dc4253d5f43675859f1f9097ad80b13b6538f13814d9621c';
	
	// 2) Invalid recovery id (v = 0x35, should be 27, 28, 0, or 1)
	const BAD_V_SIGNATURE = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd73254f82e26a591778e44c23bda32a0bc89a8a066e3884b27f4f449ac1f51eb2f9d835';
	
	// 3) Signature that recovers to wrong address
	const WRONG_SIGNER_MESSAGE = 'Wrong signer test';
	const WRONG_SIGNER_HASH = '0x1a1dc91c907325c69271ddf0c944bc72a58a2e1718c6eab84eaca8fdda4633a0';
	const WRONG_SIGNER_SIGNATURE = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1b';
	
	// 4) Incomplete / malformed signatures
	const TOO_SHORT_SIGNATURE = '0x1234abcd';
	const MISSING_S_SIGNATURE = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd7325'; // only 32 bytes (r)
	const MISSING_V_SIGNATURE = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd73254f82e26a591778e44c23bda32a0bc89a8a066e3884b27f4f449ac1f51eb2f9d8'; // only 64 bytes (r + s)
	const INVALID_HEX_SIGNATURE = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd7325ZZ82e26a591778e44c23bda32a0bc89a8a066e3884b27f4f449ac1f51eb2f9d81c';
	const EXTRA_BYTES_SIGNATURE = '0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd73254f82e26a591778e44c23bda32a0bc89a8a066e3884b27f4f449ac1f51eb2f9d81cdeadbeef';

	describe('isValidSignature - invalid cases', () => {
		it('should still recognize malleated signature as structurally valid (65 bytes)', () => {
			// Note: Malleability is a semantic issue, not a structural one
			// The signature is still 65 bytes and valid hex
			const result = isValidSignature(MALLEATED_SIGNATURE);
			expect(result.valid).toBe(true);
			expect(result.length).toBe(65);
		});

		it('should recognize signature with bad v as structurally valid', () => {
			// Bad v is a semantic issue - the structure is still valid
			const result = isValidSignature(BAD_V_SIGNATURE);
			expect(result.valid).toBe(true);
			expect(result.length).toBe(65);
		});

		it('should recognize wrong signer signature as structurally valid', () => {
			// Wrong signer is a semantic issue - the structure is still valid
			const result = isValidSignature(WRONG_SIGNER_SIGNATURE);
			expect(result.valid).toBe(true);
			expect(result.length).toBe(65);
		});

		it('should reject too short signature', () => {
			const result = isValidSignature(TOO_SHORT_SIGNATURE);
			expect(result.valid).toBe(false);
			expect(result.length).toBe(4); // 8 hex chars = 4 bytes
		});

		it('should reject signature missing s (only 32 bytes)', () => {
			const result = isValidSignature(MISSING_S_SIGNATURE);
			expect(result.valid).toBe(false);
			expect(result.length).toBe(32);
		});

		it('should recognize 64-byte signature as EIP-2098 compact (missing v case)', () => {
			// 64 bytes is valid as EIP-2098 compact format
			const result = isValidSignature(MISSING_V_SIGNATURE);
			expect(result.valid).toBe(true);
			expect(result.length).toBe(64);
			expect(result.format).toBe('EIP-2098 Compact (64 bytes)');
		});

		it('should reject signature with invalid hex characters', () => {
			const result = isValidSignature(INVALID_HEX_SIGNATURE);
			expect(result.valid).toBe(false);
		});

		it('should reject signature with extra bytes', () => {
			const result = isValidSignature(EXTRA_BYTES_SIGNATURE);
			expect(result.valid).toBe(false);
			expect(result.length).toBe(69); // 65 + 4 extra bytes
		});
	});

	describe('parseSignatureComponents - invalid cases', () => {
		it('should parse malleated signature components (high-s)', () => {
			const result = parseSignatureComponents(MALLEATED_SIGNATURE);
			expect(result).not.toBeNull();
			// Same r as original
			expect(result!.r).toBe('0xf4a45954390e10d2db95527ecfaca14adfd74127e5a885fcaaaed2a1b5bd7325');
			// Different s (high-s value)
			expect(result!.s).toBe('0xb07d1d9596e8871bb3dc4253d5f43675859f1f9097ad80b13b6538f13814d962');
			expect(result!.v).toBe(28);
		});

		it('should parse signature with bad v (returns raw v value)', () => {
			const result = parseSignatureComponents(BAD_V_SIGNATURE);
			expect(result).not.toBeNull();
			// v = 0x35 = 53, which is > 27 so stays as-is
			expect(result!.v).toBe(53);
		});

		it('should return null for too short signature', () => {
			expect(parseSignatureComponents(TOO_SHORT_SIGNATURE)).toBeNull();
		});

		it('should return null for signature missing s', () => {
			expect(parseSignatureComponents(MISSING_S_SIGNATURE)).toBeNull();
		});

		it('should parse 64-byte signature as EIP-2098 compact', () => {
			const result = parseSignatureComponents(MISSING_V_SIGNATURE);
			expect(result).not.toBeNull();
			// In EIP-2098, yParity is encoded in high bit of s
		});

		it('should return null for signature with invalid hex', () => {
			expect(parseSignatureComponents(INVALID_HEX_SIGNATURE)).toBeNull();
		});

		it('should return null for signature with extra bytes', () => {
			expect(parseSignatureComponents(EXTRA_BYTES_SIGNATURE)).toBeNull();
		});
	});

	describe('addressesMatch - wrong signer detection', () => {
		it('should not match when signature recovers to wrong address', () => {
			// The random signature would recover to some address, but not TEST_ADDRESS
			// This tests the concept - in real usage you'd recover the address first
			const randomRecoveredAddress = '0x1111111111111111111111111111111111111111';
			expect(addressesMatch(randomRecoveredAddress, TEST_ADDRESS)).toBe(false);
		});
	});
});
