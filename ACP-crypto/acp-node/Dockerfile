# Build ACP node (Rust) with acp-crypto. Build context = ACP-crypto repo root.
# docker build -f acp-node/Dockerfile -t ancap/acp-node:latest .

FROM rust:1.85-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake clang libclang-dev \
    libsnappy-dev liblz4-dev libzstd-dev zlib1g-dev libbz2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY acp-crypto /build/acp-crypto
COPY acp-node /build/acp-node

WORKDIR /build/acp-node
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libgcc-s1 libc6 \
    libsnappy1v5 liblz4-1 libzstd1 zlib1g libbz2-1.0 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/acp/bin /etc/acp
COPY --from=builder /build/acp-node/target/release/acp-node /opt/acp/bin/acp-node

ENTRYPOINT ["/opt/acp/bin/acp-node"]
CMD []
