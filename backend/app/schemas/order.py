from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from app.models.order import OrderStatus
from app.schemas.customer import CustomerOut
from app.schemas.product import ProductOut


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: ProductOut

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderOut(BaseModel):
    id: int
    customer_id: int
    created_by: int
    status: OrderStatus
    total_amount: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    customer: CustomerOut
    items: List[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderSummary(BaseModel):
    id: int
    customer_id: int
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime
    customer: CustomerOut
    item_count: int = 0

    model_config = {"from_attributes": True}
