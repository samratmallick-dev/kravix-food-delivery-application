FROM python:3.11-alpine

LABEL org.opencontainers.image.title="kravix-ai" \
      org.opencontainers.image.description="Kravix AI Microservice" \
      org.opencontainers.image.source="https://github.com/samratmallick-dev/kravix-food-delivery-application"

WORKDIR /app

RUN apk upgrade --no-cache && \
    apk add --no-cache gcc musl-dev libffi-dev

COPY requirements.prod.txt ./
RUN pip install --no-cache-dir -r requirements.prod.txt

RUN adduser -D appuser

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 5500

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-5500}/live || exit 1

CMD ["sh", "-c", "uvicorn api_server:app --host 0.0.0.0 --port ${PORT:-5500} --timeout-keep-alive 65 --log-level info"]
