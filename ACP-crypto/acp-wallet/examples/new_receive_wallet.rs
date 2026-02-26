//! Генерация одного кошелька для приёма ACP.
//!
//! Запуск из корня репо: cargo run -p acp-wallet --example new_receive_wallet
//! Адрес можно отправить отправителю — на него переводите ACP.
//! Мнемонику сохраните в безопасном месте: кто владеет мнемоникой — владеет средствами.

use acp_crypto::{Mnemonic, WalletIdentity};
use rand_core::OsRng;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let m = Mnemonic::generate_12()?;
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
    let address = id.receive_address_v0()?;

    println!();
    println!("==============================================");
    println!("  ACP — адрес для приёма средств");
    println!("==============================================");
    println!();
    println!("  Адрес:    {}", address);
    println!("  Мнемоника: {}", m.words());
    println!();
    println!("  Отправьте адрес отправителю. ACP приходят на этот адрес.");
    println!("  Мнемонику сохраните в безопасном месте!");
    println!("==============================================");
    println!();

    // Записать только адрес в файл (удобно копировать)
    let out_path = "receive-address.txt";
    std::fs::write(out_path, format!("{}\n", address))?;
    println!("  Адрес записан в: {}", out_path);
    println!();

    Ok(())
}
