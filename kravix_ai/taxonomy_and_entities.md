# Kravix AI Assistant: Taxonomy & Entities

## 1. Intent Taxonomy
The model is trained to recognize and handle the following intents across various user roles:

### Order Management
- `track_order`: Inquiries about order location and status.
- `cancel_order`: Requests to cancel an existing order.
- `reorder`: Requests to place a previous order again.

### Food & Menu Intelligence
- `food_recommendation`: Asking for dish suggestions based on cuisine or budget.
- `menu_availability`: Checking if a specific item is currently available.

### Restaurant Discovery
- `find_restaurant`: Finding restaurants based on location, open status, or cuisine.
- `restaurant_verification`: Checking if a restaurant is verified on the platform.

### Payments & Checkout
- `payment_failure`: Handling situations where money was deducted but the order failed.
- `coupon_usage`: Applying discounts and understanding coupon rules.

### Account & Authentication
- `blocked_account`: Handling users who cannot log in due to being blocked.
- `role_switch`: Switching between customer, seller, and rider accounts.

### Rider & Delivery
- `rider_availability`: Managing a rider's online/offline status.
- `otp_handoff`: Process for delivering food using an OTP.

### Seller / Restaurant Owner
- `manage_menu`: Adding, removing, or editing dishes and prices.
- `revenue_analytics`: Inquiries about sales and earnings.

### Admin Operations
- `block_user`: Admin action to block a fraudulent user, seller, or rider.
- `approve_restaurant`: Verifying and approving new restaurant listings.

### Error & Edge Cases
- `out_of_stock`: Handling cart items that become unavailable.
- `restaurant_closed`: Handling orders for a restaurant that just closed.

### Platform Policies
- `data_privacy`: Inquiries about how user data is stored and used.
- `refund_policy`: Questions about when and how refunds are processed.


## 2. Entity Lists

### Order Statuses (Pipeline)
`placed` → `accepted` → `preparing` → `ready_for_rider` → `picked_up` → `out_for_delivery` → `delivered`

### Payment Statuses
`pending`, `paid`, `failed`

### User Roles
`customer`, `seller`, `rider`, `admin`

### Bengali / Indian Regional Food Mapping
- `bhat` -> rice
- `dal` -> lentils
- `mach` -> fish
- `roti` -> bread
- `tarkari` -> vegetables
- `mishti` -> sweets
- `biryani` -> biryani

### Placeholders (Always used to prevent hallucination)
- `[ORDER_ID]`
- `[RESTAURANT_NAME]`
