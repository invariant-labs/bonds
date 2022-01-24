use crate::SEED;

#[macro_export]
macro_rules! get_signer {
    ($authority: expr) => {
        &[&[SEED.as_bytes(), &[$authority]]]
    };
}
