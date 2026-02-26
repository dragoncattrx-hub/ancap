# Build hrm-node (Rust) with hrm-crypto. Build context = repo root (parent of hrm-node).
# docker build -f hrm-node/Dockerfile -t hrm/hrm-node:latest .

# Rust 1.85+ required: base64ct (transitive) needs edition2024
FROM rust:1.85-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake clang libclang-dev \
    libsnappy-dev liblz4-dev libzstd-dev zlib1g-dev libbz2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY hrm-crypto /build/hrm-crypto
COPY hrm-node /build/hrm-node

WORKDIR /build/hrm-node
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libgcc-s1 libc6 \
    libsnappy1v5 liblz4-1 libzstd1 zlib1g libbz2-1.0 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/hrm/bin /etc/hrm
COPY --from=builder /build/hrm-node/target/release/hrm-node /opt/hrm/bin/hrm-node

ENTRYPOINT ["/opt/hrm/bin/hrm-node"]
CMD ["--config", "/etc/hrm/hrm-node.toml"]
