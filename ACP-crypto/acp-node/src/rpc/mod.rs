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

/// Health / chain-info methods that stay open when an RPC token is configured.
const PUBLIC_METHODS: &[&str] = &[
    "getblockcount",
    "getbestblockhash",
    "getblockhash",
    "getblock",
    "getrawtransaction",
    "ancap_status",
    "ancap_info",
];

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
                let is_public = PUBLIC_METHODS.iter().any(|m| *m == method);
                let is_mutator = matches!(
                    method,
                    "submitblock" | "sendrawtransaction" | "ancap_anchor"
                );

                match ctx.config.rpc_token.as_ref() {
                    Some(token) => {
                        // When token is configured: require it for every non-public method.
                        if !is_public {
                            let got = headers
                                .get(RPC_TOKEN_HEADER)
                                .and_then(|v| v.to_str().ok())
                                .unwrap_or("");
                            if got != token {
                                return Json(RpcResponse::err(id, -32001, "unauthorized".to_string()));
                            }
                        }
                    }
                    None => {
                        // Fail closed for mutators when no token is configured.
                        if is_mutator {
                            return Json(RpcResponse::err(
                                id,
                                -32001,
                                "rpc token not configured; mutating methods disabled".to_string(),
                            ));
                        }
                    }
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
