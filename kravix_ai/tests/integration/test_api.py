from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_chat_endpoint_customer():
    payload = {
        "message": "where is my order",
        "userId": "user123",
        "role": "customer",
        "contextData": {
            "orders": [{"id": "ORD999", "status": "Out for delivery"}]
        }
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "ORDER_TRACKING"
    assert data["action"] == "OPEN_ORDER_TRACKING"
    assert "ORD999" in data["reply"]
    assert "ORD999" == data["entities"].get("order_id")
