//! JSON-RPC over HTTP: POST /rpc.

use axum::{http::HeaderMap, routing::post, Json, Router};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use crate::rpc::handlers::{handle, RpcCtx};
use crate::rpc::types::{RpcRequest, RpcResponse};

pub mod handlers;
pub mod types;

const RPC_TOKEN_HEADER: &str = "x-acp-rpc-token";

pub fn router(ctx: Arc<RpcCtx>) -> Router {
    Router::new()
        .route(
            "/rpc",
            post(move |headers: HeaderMap, Json(req): Json<RpcRequest>| async move {
                let id = req.id.clone();
                if let Some(ref token) = ctx.config.rpc_token {
                    // Protect state-changing methods when RPC is exposed to the internet.
                    let needs_auth = matches!(req.method.as_str(), "submitblock" | "sendrawtransaction");
                    if needs_auth {
                        let got = headers
                            .get(RPC_TOKEN_HEADER)
                            .and_then(|v| v.to_str().ok())
                            .unwrap_or("");
                        if got != token {
                            return Json(RpcResponse::err(id, -32001, "unauthorized".to_string()));
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
        .layer(CorsLayer::permissive())
}
