FROM python:3.11-slim

WORKDIR /app

COPY requirements.prod.txt ./

RUN pip install --no-cache-dir -r requirements.prod.txt

COPY api_server.py ./

EXPOSE 5500

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "5500"]
