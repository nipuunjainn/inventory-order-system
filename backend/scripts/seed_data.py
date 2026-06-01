import sys
import os
import random

# Add parent dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem

def seed():
    db = SessionLocal()
    
    # 1. Find or create the admin user
    from app.services.auth import hash_password
    admin_user = db.query(User).filter(User.username == "nipunjain").first()
    if not admin_user:
        print("User 'nipunjain' not found! Creating it...")
        admin_user = User(
            username="nipunjain",
            email="nipun@example.com",
            hashed_password=hash_password("admin123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    print(f"Found admin user: {admin_user.username}")

    # 2. Check if we already seeded to prevent duplicates
    if db.query(Product).count() > 0:
        print("Database already has products. Skipping seed.")
        db.close()
        return

    # 3. Create Products
    print("Seeding products...")
    products_data = [
        {"sku": "LAP-X1", "name": "ThinkPad X1 Carbon", "description": "14-inch business laptop, 16GB RAM, 512GB SSD", "price": 1299.99, "stock_quantity": 15},
        {"sku": "MON-27", "name": "Dell UltraSharp 27 4K", "description": "27-inch 4K USB-C monitor", "price": 459.00, "stock_quantity": 30},
        {"sku": "MOU-MX", "name": "Logitech MX Master 3S", "description": "Wireless productivity mouse", "price": 99.99, "stock_quantity": 50},
        {"sku": "KBD-MC", "name": "Keychron K3 Pro", "description": "Low profile mechanical keyboard", "price": 109.00, "stock_quantity": 25},
        {"sku": "DK-TB4", "name": "CalDigit TS4 Thunderbolt Dock", "description": "18-port Thunderbolt 4 dock", "price": 399.95, "stock_quantity": 8},
        {"sku": "CBL-UCC", "name": "Anker 100W USB-C Cable", "description": "6ft braided USB-C charging cable", "price": 15.99, "stock_quantity": 100},
        {"sku": "HST-QC4", "name": "Bose QuietComfort 45", "description": "Noise cancelling wireless headphones", "price": 329.00, "stock_quantity": 12},
        {"sku": "BAG-EVR", "name": "Evergoods CPL24", "description": "24L Civic Panel Loader backpack", "price": 279.00, "stock_quantity": 5},
    ]
    products = []
    for pd in products_data:
        p = Product(**pd)
        db.add(p)
        products.append(p)
    
    db.commit()

    # 4. Create Customers
    print("Seeding customers...")
    customers_data = [
        {"name": "Alice Johnson", "email": "alice@example.com", "phone": "555-0101", "address": "123 Tech Ave, Silicon Valley, CA"},
        {"name": "Bob Smith", "email": "bob.smith@example.com", "phone": "555-0102", "address": "456 Main St, New York, NY"},
        {"name": "Corp IT Solutions", "email": "purchasing@corpit.example.com", "phone": "555-0103", "address": "789 Enterprise Blvd, Chicago, IL"},
        {"name": "Diana Prince", "email": "diana@example.com", "phone": "555-0104", "address": "Themyscira Towers, London, UK"},
    ]
    customers = []
    for cd in customers_data:
        c = Customer(**cd)
        db.add(c)
        customers.append(c)
    
    db.commit()

    # 5. Create Orders
    print("Seeding orders...")
    for _ in range(8):
        c = random.choice(customers)
        # Randomly select 1 to 3 products
        num_items = random.randint(1, 3)
        order_products = random.sample(products, num_items)
        
        status = random.choice([OrderStatus.pending, OrderStatus.confirmed, OrderStatus.shipped, OrderStatus.cancelled])
        
        order = Order(
            customer_id=c.id,
            created_by=admin_user.id,
            status=status,
            notes="Dummy order from seed script",
            total_amount=0 # calculated below
        )
        db.add(order)
        db.flush() # get order id
        
        total = 0
        for p in order_products:
            # Ensure we don't ask for more than available stock
            max_qty = p.stock_quantity if p.stock_quantity > 0 else 1
            qty = random.randint(1, min(2, max_qty))
            sub = float(p.price) * qty
            total += sub
            oi = OrderItem(
                order_id=order.id,
                product_id=p.id,
                quantity=qty,
                unit_price=p.price,
                subtotal=sub
            )
            db.add(oi)
            
            # Deduct stock if not cancelled
            if status != OrderStatus.cancelled:
                p.stock_quantity -= qty
        
        order.total_amount = total

    db.commit()
    print("Seed complete! 8 Products, 4 Customers, and 8 Orders added.")
    db.close()

if __name__ == "__main__":
    seed()
