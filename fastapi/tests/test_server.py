import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

@pytest.mark.parametrize("route", ["/health", "/stream_summary/"])
def test_routes_exist(route):
    """
    Check that routes are accessible (exist).
    """
    if route == "/health":
        response = client.get(route)
        assert response.status_code == 200
    else:
        # For POST routes, we can at least ensure they return something with valid input
        if route == "/stream_summary/":
            response = client.post(route, json={"content": "Test text", "percent": 50, "bullets": False, "temperature": 0.3})
            # Should return a status 200 for successful streaming
            assert response.status_code == 200
