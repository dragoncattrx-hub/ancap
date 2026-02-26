use std::fs::{File, OpenOptions};
use std::path::Path;
use anyhow::Context;
use fs2::FileExt;

pub struct ExportLock {
    _file: File, // держим хэндл, пока жив guard
}

impl ExportLock {
    pub fn acquire(lock_path: &str) -> anyhow::Result<Self> {
        let p = Path::new(lock_path);
        let f = OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(p)
            .with_context(|| format!("open lock file {}", lock_path))?;

        f.lock_exclusive()
            .with_context(|| format!("lock_exclusive {}", lock_path))?;

        Ok(Self { _file: f })
    }

    pub fn try_acquire(lock_path: &str) -> anyhow::Result<Option<Self>> {
        let p = Path::new(lock_path);
        let f = OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(p)
            .with_context(|| format!("open lock file {}", lock_path))?;

        match f.try_lock_exclusive() {
            Ok(()) => Ok(Some(Self { _file: f })),
            Err(_) => Ok(None),
        }
    }
}
