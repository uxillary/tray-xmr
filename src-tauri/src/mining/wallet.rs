//! Local mainnet address parser: Monero block Base58, Keccak checksum and Edwards keys.
//! Rules: monero/src/common/base58.cpp, cryptonote_config.h, cryptonote_basic_impl.cpp.
use curve25519_dalek::edwards::CompressedEdwardsY;
use sha3::{Digest, Keccak256};

const ALPHABET: &[u8] = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const SIZES: [usize; 9] = [0, 2, 3, 5, 6, 7, 9, 10, 11];

pub fn valid(address: &str) -> bool {
    if !matches!(address.len(), 95 | 106) || !address.is_ascii() {
        return false;
    }
    let mut data = Vec::with_capacity(77);
    for block in address.as_bytes().chunks(11) {
        let Some(size) = SIZES.iter().position(|&n| n == block.len()) else {
            return false;
        };
        let mut value = 0u64;
        for byte in block {
            let Some(digit) = ALPHABET.iter().position(|b| b == byte) else {
                return false;
            };
            let Some(next) = value
                .checked_mul(58)
                .and_then(|v| v.checked_add(digit as u64))
            else {
                return false;
            };
            value = next;
        }
        if size < 8 && value >= (1u64 << (size * 8)) {
            return false;
        }
        data.extend_from_slice(&value.to_be_bytes()[8 - size..]);
    }
    if !matches!((data[0], data.len()), (18 | 42, 69) | (19, 77)) {
        return false;
    }
    let end = data.len() - 4;
    if Keccak256::digest(&data[..end])[..4] != data[end..] {
        return false;
    }
    for key in [&data[1..33], &data[33..65]] {
        let compressed = CompressedEdwardsY(key.try_into().expect("fixed key length"));
        let Some(point) = compressed.decompress() else {
            return false;
        };
        // Reject noncanonical encodings and degenerate public keys as well.
        if point.compress() != compressed || point.is_small_order() {
            return false;
        }
    }
    true
}

#[cfg(test)]
pub(crate) fn fixture(prefix: u8) -> String {
    use curve25519_dalek::constants::ED25519_BASEPOINT_POINT;
    let mut bytes = vec![prefix];
    bytes.extend_from_slice(&ED25519_BASEPOINT_POINT.compress().to_bytes());
    bytes.extend_from_slice(
        &(ED25519_BASEPOINT_POINT * curve25519_dalek::scalar::Scalar::from(2u64))
            .compress()
            .to_bytes(),
    );
    if prefix == 19 {
        bytes.extend_from_slice(&[0u8; 8]);
    }
    bytes.extend_from_slice(&Keccak256::digest(&bytes)[..4]);
    encode_fixture(&bytes)
}

#[cfg(test)]
fn encode_fixture(bytes: &[u8]) -> String {
    let mut out = Vec::new();
    for block in bytes.chunks(8) {
        let mut buf = [0u8; 8];
        buf[8 - block.len()..].copy_from_slice(block);
        let mut value = u64::from_be_bytes(buf);
        let mut encoded = vec![b'1'; SIZES[block.len()]];
        for byte in encoded.iter_mut().rev() {
            *byte = ALPHABET[(value % 58) as usize];
            value /= 58;
        }
        out.extend(encoded);
    }
    String::from_utf8(out).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn mainnet_standard_integrated_subaddress_and_invalid_formats() {
        // Independent published Monero unit-test vector (address_from_url.cpp).
        assert!(valid("46BeWrHpwXmHDpDEUmZBWZfoQpdc6HaERCNmx1pEYL2rAcuwufPN9rXHHtyUA4QVy66qeFQkn6sfK8aHYjA3jk3o1Bv16em"));
        for prefix in [18, 19, 42] {
            let address = fixture(prefix);
            assert!(valid(&address));
            let mut changed = address.into_bytes();
            changed[20] = if changed[20] == b'1' { b'2' } else { b'1' };
            assert!(!valid(std::str::from_utf8(&changed).unwrap()));
        }
        for address in [
            "",
            "seed words",
            &"0".repeat(95),
            &"z".repeat(95),
            &fixture(53),
        ] {
            assert!(!valid(address));
        }
        let mut data = vec![18];
        data.extend_from_slice(&[0xff; 64]);
        data.extend_from_slice(&Keccak256::digest(&data)[..4]);
        assert!(!valid(&encode_fixture(&data)));
    }
}
