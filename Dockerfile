FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl ca-certificates cargo rustc pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
ENV PYTHONPATH=/app
EXPOSE 8000

RUN cargo build --manifest-path ACP-crypto/acp-wallet/Cargo.toml --bin walletd --release \
    && cp ACP-crypto/acp-wallet/target/release/walletd /usr/local/bin/walletd \
    && chmod +x /usr/local/bin/walletd

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
