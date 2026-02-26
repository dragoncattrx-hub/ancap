//! JSON-RPC over HTTP: POST /rpc.

use axum::{routing::post, Json, Router};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use crate::rpc::handlers::{handle, RpcCtx};
use crate::rpc::types::{RpcRequest, RpcResponse};

pub mod handlers;
pub mod types;

pub fn router(ctx: Arc<RpcCtx>) -> Router {
    Router::new()
        .route(
            "/rpc",
            post(move |Json(req): Json<RpcRequest>| async move {
                let id = req.id.clone();
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
