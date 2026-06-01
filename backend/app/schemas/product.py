from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal


class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
