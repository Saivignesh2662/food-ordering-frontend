# Food Ordering Frontend

Responsive HTML/CSS/JavaScript customer interface. Kept separate from the Spring Boot backend repository.

## Run
1. Start the backend first (see backend repository README).
2. Open this folder in VS Code.
3. Run `index.html` with the VS Code **Live Server** extension (recommended). The page should open at `http://localhost:5500`.
4. The frontend calls `http://localhost:8080/api`.

Features: responsive food menu, search/category filters, local cart, register/login, checkout with cash on delivery, order history/status display.

The frontend uses browser localStorage for the cart only. User accounts, food, and orders are stored by the backend in MySQL.
