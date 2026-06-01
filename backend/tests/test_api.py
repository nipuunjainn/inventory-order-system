import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base
from app.dependencies import get_db

# Use SQLite for testing (no PostgreSQL required)
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})

# Enable foreign key enforcement in SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def get_auth_header():
    """Register and login a test user, return auth header."""
    client.post("/api/v1/auth/register", json={
        "username": "testuser", "email": "test@test.com", "password": "testpass123"
    })
    res = client.post("/api/v1/auth/login", json={"username": "testuser", "password": "testpass123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---- Auth Tests ----

def test_register_success():
    res = client.post("/api/v1/auth/register", json={
        "username": "newuser", "email": "new@test.com", "password": "password123"
    })
    assert res.status_code == 201
    assert "access_token" in res.json()


def test_register_duplicate_username():
    client.post("/api/v1/auth/register", json={"username": "dup", "email": "a@test.com", "password": "pass"})
    res = client.post("/api/v1/auth/register", json={"username": "dup", "email": "b@test.com", "password": "pass"})
    assert res.status_code == 409


def test_login_success():
    client.post("/api/v1/auth/register", json={"username": "u", "email": "u@test.com", "password": "p"})
    res = client.post("/api/v1/auth/login", json={"username": "u", "password": "p"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password():
    client.post("/api/v1/auth/register", json={"username": "u2", "email": "u2@test.com", "password": "correct"})
    res = client.post("/api/v1/auth/login", json={"username": "u2", "password": "wrong"})
    assert res.status_code == 401


def test_protected_route_requires_token():
    res = client.get("/api/v1/products")
    assert res.status_code == 401


# ---- Product Tests ----

def test_create_product():
    headers = get_auth_header()
    res = client.post("/api/v1/products", json={
        "sku": "PROD-001", "name": "Test Product", "price": 9.99, "stock_quantity": 50
    }, headers=headers)
    assert res.status_code == 201
    assert res.json()["sku"] == "PROD-001"


def test_create_product_duplicate_sku():
    headers = get_auth_header()
    client.post("/api/v1/products", json={"sku": "DUP", "name": "A", "price": 1.0, "stock_quantity": 10}, headers=headers)
    res = client.post("/api/v1/products", json={"sku": "DUP", "name": "B", "price": 2.0, "stock_quantity": 5}, headers=headers)
    assert res.status_code == 409


def test_list_products():
    headers = get_auth_header()
    res = client.get("/api/v1/products", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


# ---- Customer Tests ----

def test_create_customer():
    headers = get_auth_header()
    res = client.post("/api/v1/customers", json={
        "name": "John Doe", "email": "john@example.com"
    }, headers=headers)
    assert res.status_code == 201
    assert res.json()["email"] == "john@example.com"


def test_create_customer_duplicate_email():
    headers = get_auth_header()
    client.post("/api/v1/customers", json={"name": "A", "email": "dup@test.com"}, headers=headers)
    res = client.post("/api/v1/customers", json={"name": "B", "email": "dup@test.com"}, headers=headers)
    assert res.status_code == 409


# ---- Order Tests ----

def _create_product_and_customer(headers, stock=50):
    prod = client.post("/api/v1/products", json={
        "sku": "SKU-001", "name": "Widget", "price": 10.00, "stock_quantity": stock
    }, headers=headers).json()
    cust = client.post("/api/v1/customers", json={
        "name": "Alice", "email": "alice@test.com"
    }, headers=headers).json()
    return prod, cust


def test_create_order_success():
    headers = get_auth_header()
    prod, cust = _create_product_and_customer(headers, stock=20)
    res = client.post("/api/v1/orders", json={
        "customer_id": cust["id"],
        "items": [{"product_id": prod["id"], "quantity": 5}]
    }, headers=headers)
    assert res.status_code == 201
    assert res.json()["status"] == "pending"

    # Stock should be reduced by 5
    updated = client.get(f"/api/v1/products/{prod['id']}", headers=headers).json()
    assert updated["stock_quantity"] == 15


def test_create_order_insufficient_stock():
    headers = get_auth_header()
    prod, cust = _create_product_and_customer(headers, stock=2)
    res = client.post("/api/v1/orders", json={
        "customer_id": cust["id"],
        "items": [{"product_id": prod["id"], "quantity": 10}]
    }, headers=headers)
    assert res.status_code == 422
    assert "Insufficient stock" in res.json()["detail"]


def test_cancel_order_restores_stock():
    headers = get_auth_header()
    prod, cust = _create_product_and_customer(headers, stock=20)
    order = client.post("/api/v1/orders", json={
        "customer_id": cust["id"],
        "items": [{"product_id": prod["id"], "quantity": 5}]
    }, headers=headers).json()

    # Cancel order
    client.delete(f"/api/v1/orders/{order['id']}", headers=headers)

    # Stock should be restored
    updated = client.get(f"/api/v1/products/{prod['id']}", headers=headers).json()
    assert updated["stock_quantity"] == 20


def test_create_order_multi_item():
    headers = get_auth_header()
    p1 = client.post("/api/v1/products", json={"sku": "A", "name": "A", "price": 5.0, "stock_quantity": 10}, headers=headers).json()
    p2 = client.post("/api/v1/products", json={"sku": "B", "name": "B", "price": 15.0, "stock_quantity": 10}, headers=headers).json()
    cust = client.post("/api/v1/customers", json={"name": "Bob", "email": "bob@test.com"}, headers=headers).json()
    res = client.post("/api/v1/orders", json={
        "customer_id": cust["id"],
        "items": [
            {"product_id": p1["id"], "quantity": 3},
            {"product_id": p2["id"], "quantity": 2},
        ]
    }, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert len(data["items"]) == 2
    assert float(data["total_amount"]) == 3 * 5.0 + 2 * 15.0
