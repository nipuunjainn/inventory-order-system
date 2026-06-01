from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductOut

router = APIRouter(prefix="/inventory", tags=["Inventory"])


class RestockRequest(BaseModel):
    quantity: int


class InventoryItem(BaseModel):
    id: int
    sku: str
    name: str
    stock_quantity: int
    price: float

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[InventoryItem])
def get_inventory(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Product).order_by(Product.stock_quantity.asc()).all()


@router.put("/{product_id}/restock", response_model=ProductOut)
def restock_product(
    product_id: int,
    restock: RestockRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if restock.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Restock quantity must be greater than 0",
        )
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.stock_quantity += restock.quantity
    db.commit()
    db.refresh(product)
    return product
