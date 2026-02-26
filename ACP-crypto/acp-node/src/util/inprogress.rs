use filetime::{set_file_mtime, FileTime};

pub fn touch_inprogress(path: &str, now_ts: u64) -> anyhow::Result<()> {
    let ft = FileTime::from_unix_time(now_ts as i64, 0);
    set_file_mtime(path, ft)?;
    Ok(())
}
