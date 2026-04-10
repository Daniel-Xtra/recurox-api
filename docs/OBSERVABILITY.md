# Observability Stack Guide

This document provides instructions on how to access, monitor, and test the observability stack (Prometheus, Grafana, Loki, and RabbitMQ) for the Recurox API.

## Service Endpoints & Credentials

| Service | Protocol | Access URL | Credentials |
| :--- | :--- | :--- | :--- |
| **API** | HTTP | [http://localhost:3000/api/v1](http://localhost:3000/api/v1) | N/A |
| **Grafana** | HTTP | [http://localhost:3001](http://localhost:3001) | `admin` / `admin` |
| **Prometheus** | HTTP | [http://localhost:9090](http://localhost:9090) | N/A |
| **Loki** | HTTP | [http://localhost:3100](http://localhost:3100) | N/A |
| **RabbitMQ UI** | HTTP | [http://localhost:15672](http://localhost:15672) | `admin` / `admin_password` |
| **RabbitMQ** | AMQP | `amqp://localhost:5672` | `admin` / `admin_password` |

---

## 1. RabbitMQ Testing

### Connection Check
Verify that the `recurox-mq` container is healthy.
```bash
docker inspect -f '{{.State.Health.Status}}' recurox-mq
```

### Management UI
1.  Log in to [RabbitMQ Management](http://localhost:15672).
2.  Navigate to **Exchanges** and verify `recurox.commands` and `recurox.events` exist.
3.  Navigate to **Queues** to see active consumers.

---

## 2. Metrics & Prometheus

### Health Check
Check the scrape status of the API:
1.  Go to [Prometheus Targets](http://localhost:9090/targets).
2.  Ensure `recurox-api:3000` is **UP**.

### Manual Query
Run this query in the Prometheus "Graph" tab to see active HTTP requests:
```promql
http_requests_total
```

---

## 3. Logs & Loki

Logs are collected via **Promtail** and sent to **Loki**.

### Viewing Logs in Grafana
1.  Open [Grafana Explore](http://localhost:3001/explore).
2.  Select **Loki** as the Data Source.
3.  Use the Label browser or query:
    ```logql
    {container_name="recurox-api"}
    ```

---

## 4. Health Checks (API)

The API exposes a health check endpoint that monitors both RabbitMQ and PostgreSQL.

*   **Endpoint**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)
*   **Method**: `GET`

---

## 5. Grafana Dashboards

Dashboards are provisioned from `./docker/monitoring/grafana/provisioning`.
*   Check the **Dashboards** menu for pre-loaded visualizations of API performance and system health.
