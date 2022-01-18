use std::convert::TryInto;

use anchor_lang::prelude::{Clock, SolanaSysvar};

pub fn get_current_timestamp() -> u64 {
    Clock::get().unwrap().unix_timestamp.try_into().unwrap()
}
