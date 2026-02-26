//! UTC date helpers (no chrono).

/// Convert days since 1970-01-01 to YYYY-MM-DD (UTC) using civil_from_days.
/// Based on Howard Hinnant's algorithm (public domain).
pub fn day_iso_from_day_index(z: i64) -> String {
    let z = z + 719468; // shift to days since 0000-03-01
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097; // [0, 146096]
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // [0, 399]
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // [0, 365]
    let mp = (5 * doy + 2) / 153; // [0, 11]
    let d = doy - (153 * mp + 2) / 5 + 1; // [1, 31]
    let m = mp + if mp < 10 { 3 } else { -9 }; // [1, 12]
    let y = y + if m <= 2 { 1 } else { 0 };

    format!("{:04}-{:02}-{:02}", y, m, d)
}

/// Parse YYYY-MM-DD to days since 1970-01-01 (UTC). Inverse of day_iso_from_day_index.
/// Based on days_from_civil (Howard Hinnant, public domain).
pub fn parse_day_iso_to_day_index(s: &str) -> Option<i64> {
    let parts: Vec<&str> = s.split('-').collect();
    if parts.len() != 3 {
        return None;
    }
    let y: i64 = parts[0].parse().ok()?;
    let m: i64 = parts[1].parse().ok()?;
    let d: i64 = parts[2].parse().ok()?;
    if m < 1 || m > 12 || d < 1 || d > 31 {
        return None;
    }

    let y = y - if m <= 2 { 1 } else { 0 };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let mp = m + if m > 2 { -3 } else { 9 };
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let z = era * 146097 + doe - 719468;
    Some(z)
}
