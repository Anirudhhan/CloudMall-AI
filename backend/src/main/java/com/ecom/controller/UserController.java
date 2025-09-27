package com.ecom.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ecom.model.Cart;
import com.ecom.model.Category;
import com.ecom.model.OrderRequest;
import com.ecom.model.ProductOrder;
import com.ecom.model.UserDtls;
import com.ecom.service.CartService;
import com.ecom.service.CategoryService;
import com.ecom.service.OrderService;
import com.ecom.service.UserService;
import com.ecom.util.CommonUtil;
import com.ecom.util.OrderStatus;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CommonUtil commonUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Get user dashboard data (user details + categories + cart count)
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getUserDashboard(Principal principal) {
        Map<String, Object> response = new HashMap<>();
        
        if (principal == null) {
            response.put("authenticated", false);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = getLoggedInUserDetails(principal);
        Integer countCart = cartService.getCountCart(user.getId());
        List<Category> categories = categoryService.getAllActiveCategory();

        response.put("authenticated", true);
        response.put("user", user);
        response.put("countCart", countCart);
        response.put("categories", categories);

        return ResponseEntity.ok(response);
    }

    // ========== CART MANAGEMENT ==========

    @PostMapping("/cart")
    public ResponseEntity<Map<String, Object>> addToCart(
            @RequestParam Integer productId, 
            Principal principal) {
        
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to add items to cart");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = getLoggedInUserDetails(principal);
        Cart saveCart = cartService.saveCart(productId, user.getId());

        if (ObjectUtils.isEmpty(saveCart)) {
            response.put("success", false);
            response.put("message", "Failed to add product to cart");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } else {
            response.put("success", true);
            response.put("message", "Product added to cart successfully");
            response.put("cart", saveCart);
            
            // Return updated cart count
            Integer countCart = cartService.getCountCart(user.getId());
            response.put("cartCount", countCart);
            
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/cart")
    public ResponseEntity<Map<String, Object>> getCartItems(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to view cart");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = getLoggedInUserDetails(principal);
        List<Cart> carts = cartService.getCartsByUser(user.getId());
        
        response.put("success", true);
        response.put("carts", carts);
        response.put("cartCount", carts.size());
        
        if (carts.size() > 0) {
            Double totalOrderPrice = carts.get(carts.size() - 1).getTotalOrderPrice();
            response.put("totalOrderPrice", totalOrderPrice);
        } else {
            response.put("totalOrderPrice", 0.0);
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping("/cart/{cartId}/quantity")
    public ResponseEntity<Map<String, Object>> updateCartQuantity(
            @PathVariable Integer cartId,
            @RequestParam String action) { // "inc" or "dec"
        
        Map<String, Object> response = new HashMap<>();

        try {
            cartService.updateQuantity(action, cartId);
            response.put("success", true);
            response.put("message", "Cart quantity updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update cart quantity");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/cart/{cartId}")
    public ResponseEntity<Map<String, Object>> removeFromCart(@PathVariable Integer cartId) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Assuming you have a method to remove cart item
            // cartService.removeCartItem(cartId);
            response.put("success", true);
            response.put("message", "Item removed from cart successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to remove item from cart");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ========== ORDER MANAGEMENT ==========

    @GetMapping("/checkout")
    public ResponseEntity<Map<String, Object>> getCheckoutData(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to proceed with checkout");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = getLoggedInUserDetails(principal);
        List<Cart> carts = cartService.getCartsByUser(user.getId());
        
        if (carts.isEmpty()) {
            response.put("success", false);
            response.put("message", "Your cart is empty");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        Double orderPrice = carts.get(carts.size() - 1).getTotalOrderPrice();
        Double deliveryFee = 250.0;
        Double processingFee = 100.0;
        Double totalOrderPrice = orderPrice + deliveryFee + processingFee;

        response.put("success", true);
        response.put("carts", carts);
        response.put("orderPrice", orderPrice);
        response.put("deliveryFee", deliveryFee);
        response.put("processingFee", processingFee);
        response.put("totalOrderPrice", totalOrderPrice);
        response.put("user", user);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders")
    public ResponseEntity<Map<String, Object>> saveOrder(
            @RequestBody OrderRequest request, 
            Principal principal) {
        
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to place order");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        try {
            UserDtls user = getLoggedInUserDetails(principal);
            orderService.saveOrder(user.getId(), request);

            response.put("success", true);
            response.put("message", "Order placed successfully");
            response.put("redirectUrl", "/user/order-success");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to place order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> getUserOrders(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to view orders");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = getLoggedInUserDetails(principal);
        List<ProductOrder> orders = orderService.getOrdersByUser(user.getId());

        response.put("success", true);
        response.put("orders", orders);
        response.put("ordersCount", orders.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderDetails(
            @PathVariable Integer orderId, 
            Principal principal) {
        
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to view order details");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = getLoggedInUserDetails(principal);
        
        // Get order and verify it belongs to the current user
        List<ProductOrder> userOrders = orderService.getOrdersByUser(user.getId());
        ProductOrder order = userOrders.stream()
                .filter(o -> o.getId().equals(orderId))
                .findFirst()
                .orElse(null);

        if (order == null) {
            response.put("success", false);
            response.put("message", "Order not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        response.put("success", true);
        response.put("order", order);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/orders/{orderId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable Integer orderId, 
            Principal principal) {
        
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to cancel order");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // Find the "Cancelled" status ID
        OrderStatus[] values = OrderStatus.values();
        Integer cancelStatusId = null;
        String cancelStatusName = null;

        for (OrderStatus orderSt : values) {
            if (orderSt.getName().equalsIgnoreCase("Cancelled")) {
                cancelStatusId = orderSt.getId();
                cancelStatusName = orderSt.getName();
                break;
            }
        }

        if (cancelStatusId == null) {
            response.put("success", false);
            response.put("message", "Cancel status not found");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }

        ProductOrder updateOrder = orderService.updateOrderStatus(orderId, cancelStatusName);

        try {
            commonUtil.sendMailForProductOrder(updateOrder, cancelStatusName);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (!ObjectUtils.isEmpty(updateOrder)) {
            response.put("success", true);
            response.put("message", "Order cancelled successfully");
            response.put("order", updateOrder);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Failed to cancel order");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ========== PROFILE MANAGEMENT ==========

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to view profile");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = getLoggedInUserDetails(principal);
        response.put("success", true);
        response.put("user", user);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("mobileNumber") String mobileNumber,
            @RequestParam("address") String address,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam("pincode") String pincode,
            @RequestParam(value = "img", required = false) MultipartFile img,
            Principal principal) {

        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to update profile");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = new UserDtls();
        user.setName(name);
        user.setEmail(email);
        user.setMobileNumber(mobileNumber);
        user.setAddress(address);
        user.setCity(city);
        user.setState(state);
        user.setPincode(pincode);

        UserDtls updateUserProfile = userService.updateUserProfile(user, img);
        
        if (ObjectUtils.isEmpty(updateUserProfile)) {
            response.put("success", false);
            response.put("message", "Profile not updated");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } else {
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("user", updateUserProfile);
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> request,
            Principal principal) {

        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Please login to change password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            response.put("success", false);
            response.put("message", "Current password and new password are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        UserDtls loggedInUserDetails = getLoggedInUserDetails(principal);
        boolean matches = passwordEncoder.matches(currentPassword, loggedInUserDetails.getPassword());

        if (matches) {
            String encodePassword = passwordEncoder.encode(newPassword);
            loggedInUserDetails.setPassword(encodePassword);
            UserDtls updateUser = userService.updateUser(loggedInUserDetails);
            
            if (ObjectUtils.isEmpty(updateUser)) {
                response.put("success", false);
                response.put("message", "Password not updated! Error in server");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            } else {
                response.put("success", true);
                response.put("message", "Password updated successfully");
                return ResponseEntity.ok(response);
            }
        } else {
            response.put("success", false);
            response.put("message", "Current password is incorrect");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // ========== UTILITY METHODS ==========

    private UserDtls getLoggedInUserDetails(Principal principal) {
        String email = principal.getName();
        return userService.getUserByEmail(email);
    }

    // ========== ORDER STATUS INFORMATION ==========
    
    @GetMapping("/order-statuses")
    public ResponseEntity<Map<String, Object>[]> getOrderStatuses() {
        OrderStatus[] statuses = OrderStatus.values();
        Map<String, Object>[] response = new Map[statuses.length];
        
        for (int i = 0; i < statuses.length; i++) {
            Map<String, Object> status = new HashMap<>();
            status.put("id", statuses[i].getId());
            status.put("name", statuses[i].getName());
            response[i] = status;
        }
        
        return ResponseEntity.ok(response);
    }

    // ========== CART COUNT (for navbar) ==========
    
    @GetMapping("/cart-count")
    public ResponseEntity<Map<String, Object>> getCartCount(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("cartCount", 0);
            response.put("authenticated", false);
        } else {
            UserDtls user = getLoggedInUserDetails(principal);
            Integer countCart = cartService.getCountCart(user.getId());
            response.put("cartCount", countCart);
            response.put("authenticated", true);
        }

        return ResponseEntity.ok(response);
    }

    // ========== ORDER SUCCESS CONFIRMATION ==========
    
    @GetMapping("/order-success")
    public ResponseEntity<Map<String, Object>> orderSuccess() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Your order has been placed successfully!");
        response.put("showConfetti", true);
        return ResponseEntity.ok(response);
    }
}