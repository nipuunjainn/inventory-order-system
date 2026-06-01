from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate


def validate_and_create_order(db: Session, order_data: OrderCreate, created_by: int) -> Order:
    """
    Atomically validates stock levels and creates an order with all line items.
    Raises HTTP 422 if any product has insufficient stock.
    Raises HTTP 404 if customer or any product does not exist.
    """
    from app.models.customer import Customer

    # 1. Validate customer exists
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {order_data.customer_id} not found",
        )

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Order must have at least one item",
        )

    # 2. Validate all products and stock levels before touching DB
    resolved_items = []
    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found",
            )
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                    f"Requested: {item.quantity}, Available: {product.stock_quantity}"
                ),
            )
        resolved_items.append((product, item.quantity))

    # 3. Calculate total
    total_amount = sum(
        product.price * quantity for product, quantity in resolved_items
    )

    # 4. Create order
    order = Order(
        customer_id=order_data.customer_id,
        created_by=created_by,
        total_amount=total_amount,
        notes=order_data.notes,
        status=OrderStatus.pending,
    )
    db.add(order)
    db.flush()  # get order.id without committing

    # 5. Create line items and deduct stock
    for product, quantity in resolved_items:
        subtotal = product.price * quantity
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
            subtotal=subtotal,
        )
        db.add(order_item)
        product.stock_quantity -= quantity  # atomic deduction

    db.commit()
    db.refresh(order)
    return order


def restore_stock_on_cancel(db: Session, order: Order) -> None:
    """Restore stock quantities when an order is cancelled."""
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity
    db.commit()
