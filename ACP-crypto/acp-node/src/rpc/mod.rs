//! JSON-RPC over HTTP: POST /rpc.

use axum::{
    http::{HeaderMap, HeaderName, HeaderValue, Method},
    routing::post,
    Json, Router,
};
use std::sync::Arc;
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::rpc::handlers::{handle, RpcCtx};
use crate::rpc::types::{RpcRequest, RpcResponse};

pub mod handlers;
pub mod types;

const RPC_TOKEN_HEADER: &str = "x-acp-rpc-token";

/// Health / chain-info methods that stay open even when an RPC token is configured
/// (and remain open when no token is configured).
const PUBLIC_METHODS: &[&str] = &[
    "getblockcount",
    "getbestblockhash",
    "getblockhash",
    "getblock",
    "getrawtransaction",
    "ancap_status",
    "ancap_info",
];

fn is_public_method(method: &str) -> bool {
    PUBLIC_METHODS.iter().any(|m| *m == method)
}

/// Pure auth gate for JSON-RPC methods.
///
/// - Public methods always allowed.
/// - When `token_configured` is `None`: fail-closed for all non-public methods.
/// - When `token_configured` is `Some(expected)`: non-public methods require
///   `provided_token` to match `expected`.
pub fn rpc_authorized(
    method: &str,
    token_configured: Option<&str>,
    provided_token: Option<&str>,
) -> Result<(), String> {
    if is_public_method(method) {
        return Ok(());
    }

    match token_configured {
        None => Err("rpc token not configured; non-public methods disabled".to_string()),
        Some(expected) => {
            let got = provided_token.unwrap_or("");
            if got == expected {
                Ok(())
            } else {
                Err("unauthorized".to_string())
            }
        }
    }
}

fn cors_layer() -> CorsLayer {
    let origins = [
        "https://ancap.cloud",
        "https://www.ancap.cloud",
        "https://acp1.ancap.cloud",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ];
    let allow = origins
        .iter()
        .filter_map(|o| HeaderValue::from_str(o).ok())
        .collect::<Vec<_>>();
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(allow))
        .allow_methods([Method::POST, Method::OPTIONS])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            HeaderName::from_static("x-acp-rpc-token"),
            HeaderName::from_static("x-requested-with"),
        ])
}

pub fn router(ctx: Arc<RpcCtx>) -> Router {
    Router::new()
        .route(
            "/rpc",
            post(move |headers: HeaderMap, Json(req): Json<RpcRequest>| async move {
                let id = req.id.clone();
                let method = req.method.as_str();
                let provided = headers
                    .get(RPC_TOKEN_HEADER)
                    .and_then(|v| v.to_str().ok());

                if let Err(msg) = rpc_authorized(method, ctx.config.rpc_token.as_deref(), provided) {
                    return Json(RpcResponse::err(id, -32001, msg));
                }

                let res = match handle(ctx.as_ref(), &req.method, &req.params) {
                    Ok(v) => RpcResponse::ok(id, v),
                    Err(e) => {
                        let msg = e.to_string();
                        if msg.contains("method not found") {
                            RpcResponse::err(id, -32601, msg)
                        } else if msg.contains("missing") || msg.contains("Invalid") {
                            RpcResponse::err(id, -32602, msg)
                        } else {
                            RpcResponse::err(id, -32000, msg)
                        }
                    }
                };
                Json(res)
            }),
        )
        .layer(cors_layer())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn public_methods_open_without_token() {
        for m in PUBLIC_METHODS {
            assert!(rpc_authorized(m, None, None).is_ok());
            assert!(rpc_authorized(m, None, Some("anything")).is_ok());
        }
    }

    #[test]
    fn public_methods_open_with_token_configured() {
        for m in PUBLIC_METHODS {
            assert!(rpc_authorized(m, Some("secret"), None).is_ok());
            assert!(rpc_authorized(m, Some("secret"), Some("wrong")).is_ok());
            assert!(rpc_authorized(m, Some("secret"), Some("secret")).is_ok());
        }
    }

    #[test]
    fn non_public_fail_closed_when_token_unconfigured() {
        for m in ["submitblock", "sendrawtransaction", "ancap_anchor", "getbalance", "walletpassphrase"]
        {
            let err = rpc_authorized(m, None, None).unwrap_err();
            assert!(err.contains("not configured"), "{err}");
            let err = rpc_authorized(m, None, Some("anything")).unwrap_err();
            assert!(err.contains("not configured"), "{err}");
        }
    }

    #[test]
    fn non_public_require_matching_token_when_configured() {
        let m = "sendrawtransaction";
        assert_eq!(
            rpc_authorized(m, Some("secret"), None).unwrap_err(),
            "unauthorized"
        );
        assert_eq!(
            rpc_authorized(m, Some("secret"), Some("")).unwrap_err(),
            "unauthorized"
        );
        assert_eq!(
            rpc_authorized(m, Some("secret"), Some("wrong")).unwrap_err(),
            "unauthorized"
        );
        assert!(rpc_authorized(m, Some("secret"), Some("secret")).is_ok());
    }
}
