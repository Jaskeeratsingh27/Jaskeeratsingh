FROM python:3.12-slim

WORKDIR /app

COPY requirements-v14.txt /app/requirements-v14.txt
RUN pip install --no-cache-dir -r /app/requirements-v14.txt

COPY src/ /app/src/

ENV PYTHONPATH=/app/src
ENV CONTROL_PLANE_DB_PATH=/data/control-plane.db
ENV CONTROL_PLANE_ROTATING_SECRETS_PATH=/data/rotating-secrets.enc

VOLUME ["/data"]

CMD ["python", "/app/src/worker_main.py"]
