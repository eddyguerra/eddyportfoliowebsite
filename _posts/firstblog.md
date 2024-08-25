---
date: '2024-08-13T11:50:54.000Z'
title: How to Code Schnoor Signature algorithm from Scratch
tagline: Explanation and walk through
preview: >-
  Schnorr Signature Scheme** is a digital signature protocol that provides a way to securely authenticate a message. This blog walks through the process of coding a multi-party Schnorr Signature Scheme from scratch using Rust, Curve25519 Dalek, and other essential libraries. The implementation follows the concepts discussed in the paper [_How to Solve Statements Obliviously_](https://eprint.iacr.org/2023/1609.pdf).
image: >-
  https://cdn.vectorstock.com/i/500p/73/71/laptop-with-shield-cyber-security-concept-3d-vector-38107371.jpg
---


# How to Code Schnorr Signature Scheme from Scratch

**Schnorr Signature Scheme** is a digital signature protocol that provides a way to securely authenticate a message. This blog walks through the process of coding a multi-party Schnorr Signature Scheme from scratch using Rust, Curve25519 Dalek, and other essential libraries. The implementation follows the concepts discussed in the paper [_How to Solve Statements Obliviously_](https://eprint.iacr.org/2023/1609.pdf). In our code, we will focus on the core Schnorr protocol without incorporating polynomial commitments.

## Key Concepts and Time Complexities

### Key Generation

Each participant generates a private key $x_i$ and a corresponding public key $P_i = g^{x_i}$, where $g$ is a generator of the curve group. The time complexity for key generation is $O(1)$ per participant.

### Signing Process

The signing process involves the following steps:

1. **Commitment Generation**: Each participant generates a random value $r_i$ and computes $R_i = g^{r_i}$. The time complexity for this step is $O(1)$ per participant.

2. **Aggregation**: The commitments are aggregated to form a single value $R = \sum_{i=1}^{n} R_i$. The aggregated challenge $c$ is then computed using a cryptographic hash function $c = H(R, 	ext{message})$, where $H$ is a secure hash function. This aggregation has a time complexity of $O(n)$.

3. **Signature Generation**: Each participant computes their partial signature $s_i = r_i + c \cdot x_i$. The time complexity for this step is $O(1)$ per participant.

### Verification and Aggregation

1. **Partial Signature Verification**: Each partial signature $(R_i, s_i)$ is verified by checking the equation $g^{s_i} = R_i + c \cdot P_i$. The time complexity is $O(1)$ per verification.

2. **Final Aggregation**: The final aggregated signature is $s = \sum_{i=1}^{n} s_i$ and the corresponding public key is $P = \sum_{i=1}^{n} P_i$. This aggregation has a time complexity of $O(n)$.

3. **Final Verification**: The aggregated signature is verified by checking if $g^s = R + c \cdot P$. The time complexity is $O(1)$.

## Implementing the Schnorr Signature Scheme

### Key Generation

We begin by implementing the key generation function, where each participant generates their secret and public keys.

```rust
pub fn keygen(n: usize) -> (Vec<Scalar>, Vec<RistrettoPoint>) {
    let mut csprng = OsRng;
    let mut sks = Vec::new();
    let mut pks = Vec::new();
    for _ in 0..n {
        let mut sk_bytes = [0u8; 32];
        csprng.fill_bytes(&mut sk_bytes);
        let sk = Scalar::from_bytes_mod_order(sk_bytes);
        let pk = RistrettoPoint::mul_base(&sk);
        sks.push(sk);
        pks.push(pk);
    }
    (sks, pks)
}
```

### Signing Process

The signing process is broken down into the steps outlined earlier. Here is how we implement it:

```rust
pub fn sign(message: &str, sks: &[Scalar]) -> (Vec<SchnorrSignature>, Vec<RistrettoPoint>) {
    let mut csprng = OsRng;
    let mut rs = Vec::new();
    let mut grs = Vec::new();
    let mut commitments = Vec::new();

    // Step 1: Each participant generates random values r and their commitments
    for (i, _) in sks.iter().enumerate() {
        let mut r_bytes = [0u8; 32];
        csprng.fill_bytes(&mut r_bytes);
        let r = Scalar::from_bytes_mod_order(r_bytes);
        let gr = RistrettoPoint::mul_base(&r);
        rs.push(r);
        grs.push(gr);
        commitments.push(hash(&gr.compress().as_bytes().to_vec()));
        println!("Party {} broadcasts commitment: {:?}", i + 1, commitments[i]);
    }

    // Step 2: Each participant sends their decommitment
    for i in 0..sks.len() {
        println!("Party {} broadcasts decommitment: {:?}", i + 1, grs[i]);
    }

    // Step 3: Each participant verifies the commitments of the other parties
    let mut all_passed = true;
    for i in 0..sks.len() {
        for j in 0..sks.len() {
            if i != j {
                let expected_commitment = hash(&grs[j].compress().as_bytes().to_vec());
                if commitments[j] == expected_commitment {
                    println!("Party {} verified commitment of party {} successfully", i + 1, j + 1);
                } else {
                    println!("Party {} failed to verify commitment of party {}", i + 1, j + 1);
                    all_passed = false;
                }
            }
        }
    }

    if !all_passed {
        panic!("Aborting due to failed commitment verification");
    }

    // Step 4: Aggregate gr-values
    let mut aggregate_grs = grs[0];
    for i in 1..grs.len() {
        aggregate_grs += grs[i];
    }

    // Step 5: Compute random challenge
    let aggregate_grs_bytes = aggregate_grs.compress().as_bytes().to_vec();
    let message_bytes = message.as_bytes().to_vec();
    let c = hash(&[aggregate_grs_bytes.as_slice(), message_bytes.as_slice()].concat());

    // Step 6: Each participant generates their partial signatures
    let mut signatures = Vec::new();
    for (i, sk) in sks.iter().enumerate() {
        let gr = grs[i];
        let s = rs[i] + c * sk;  // `c` is the aggregated challenge from above
        signatures.push(SchnorrSignature { gr, s });
    }

    (signatures, grs)
}
```

### Verification and Aggregation

Once the signatures are generated, they need to be aggregated and verified:

```rust
fn verify_and_aggregate(signatures: &[SchnorrSignature], pks: &[RistrettoPoint], grs: &[RistrettoPoint], message_bytes: &[u8]) -> (SchnorrSignature, RistrettoPoint) {
    // Step 7: Verify each partial signature
    let aggregate_grs = grs.iter().fold(RistrettoPoint::default(), |acc, gr| acc + *gr);
    let aggregate_grs_bytes = aggregate_grs.compress().as_bytes().to_vec();
    let c = hash(&[aggregate_grs_bytes.as_slice(), message_bytes].concat());

    for (i, signature) in signatures.iter().enumerate() {
        let pk = pks[i];
        let g_s = RistrettoPoint::mul_base(&signature.s);
        let is_valid = g_s == (signature.gr + c * pk);
        println!("Partial signature {} is valid: {}", i + 1, is_valid);
        if !is_valid {
            panic!("Aborting due to invalid partial signature");
        }
    }

    let mut gr_agg = signatures[0].gr;
    let mut s_agg = signatures[0].s;
    for sig in &signatures[1..] {
        gr_agg += sig.gr;
        s_agg += sig.s;
    }
    let agg_sig = SchnorrSignature { gr: gr_agg, s: s_agg };

    let mut pk_agg = pks[0];
    for pk in &pks[1..] {
        pk_agg += pk;
    }

    (agg_sig, pk_agg)
}
```

### Verifying the Aggregated Signature

The final step involves verifying the aggregated signature:

```rust
fn verify_aggregate_signature(message: &str, agg_sig: &SchnorrSignature, agg_pk: &RistrettoPoint) -> bool {
    let gr_bytes = agg_sig.gr.compress().as_bytes().to_vec();
    let message_bytes = message.as_bytes().to_vec();
    let c = hash(&[gr_bytes.as_slice(), message_bytes.as_slice()].concat());
    let g_s_agg = RistrettoPoint::mul_base(&agg_sig.s);
    g_s_agg == (agg_sig.gr + c * agg_pk)
}
```

## Full Code Implementation

Here is the full code implementation for the Schnorr Signature Scheme:

```rust
extern crate rand;
extern crate sha2;
extern crate curve25519_dalek;

use curve25519_dalek::ristretto::RistrettoPoint;
use curve25519_dalek::scalar::Scalar;
use rand::rngs::OsRng;
use rand::RngCore;
use sha2::{Digest, Sha256};
use std::fmt;

// Full implementation code here...
```

You can find the complete code in this [GitHub repository](https://github.com/eddyguerra/Theorem_2_Multi_Party_SS_Algorithm/blob/e7acbf4bd0226ee9cf035f8f213c1eba20796c83/src/main.rs).

---

## Conclusion

In this blog, we covered the implementation of a multi-party Schnorr Signature Scheme from scratch using Rust. The implementation is inspired by the concepts discussed in the paper [_How to Solve Statements Obliviously_](https://eprint.iacr.org/2023/1609.pdf). By following this guide, you should now have a solid understanding of how to code the Schnorr Signature algorithm, including key generation, signing, verification, and aggregation. In this implementation, we focus solely on the Schnorr protocol and do not incorporate polynomial commitments.

For more information and the complete code, visit the [GitHub repository](https://github.com/eddyguerra/Theorem_2_Multi_Party_SS_Algorithm/blob/e7acbf4bd0226ee9cf035f8f213c1eba20796c83/src/main.rs).

---

*Written by Eddy Guerra John*
