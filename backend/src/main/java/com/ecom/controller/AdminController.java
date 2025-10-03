package com.ecom.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
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

import com.ecom.model.Category;
import com.ecom.model.Product;
import com.ecom.model.ProductOrder;
import com.ecom.model.UserDtls;
import com.ecom.repository.ProductSimilarityRepository;
import com.ecom.repository.UserActivityRepository;
import com.ecom.repository.UserProductScoreRepository;
import com.ecom.service.CartService;
import com.ecom.service.CategoryService;
import com.ecom.service.OrderService;
import com.ecom.service.ProductService;
import com.ecom.service.UserService;
import com.ecom.service.impl.RecommendationService;
import com.ecom.util.CommonUtil;
import com.ecom.util.OrderStatus;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserService userService;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CommonUtil commonUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private UserActivityRepository activityRepository;

    @Autowired
    private ProductSimilarityRepository similarityRepository;

    @Autowired
    private UserProductScoreRepository scoreRepository;

    // Get admin dashboard data
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal != null) {
            String email = principal.getName();
            UserDtls userDtls = userService.getUserByEmail(email);
            response.put("user", userDtls);
            Integer countCart = cartService.getCountCart(userDtls.getId());
            response.put("countCart", countCart);
        }

        List<Category> categories = categoryService.getAllActiveCategory();
        response.put("categories", categories);

        // Add dashboard statistics
        long totalProducts = productService.getAllProducts().size();
        long totalCategories = categoryService.getAllCategory().size();
        long totalOrders = orderService.getAllOrders().size();

        // Add recommendation stats
        long totalActivities = activityRepository.count();
        long totalSimilarities = similarityRepository.count();

        response.put("stats", Map.of(
                "totalProducts", totalProducts,
                "totalCategories", totalCategories,
                "totalOrders", totalOrders,
                "totalActivities", totalActivities,
                "totalSimilarities", totalSimilarities
        ));

        return ResponseEntity.ok(response);
    }

    // ========== CATEGORY MANAGEMENT ==========

    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories(
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {

        Map<String, Object> response = new HashMap<>();

        Page<Category> page = categoryService.getAllCategorPagination(pageNo, pageSize);
        List<Category> categories = page.getContent();

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page.getNumber());
        pagination.put("pageSize", pageSize);
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("isFirst", page.isFirst());
        pagination.put("isLast", page.isLast());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());

        response.put("categories", categories);
        response.put("pagination", pagination);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories/all")
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategory();
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/categories")
    public ResponseEntity<Map<String, Object>> saveCategory(
            @RequestParam("name") String name,
            @RequestParam("isActive") Boolean isActive,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        Map<String, Object> response = new HashMap<>();

        Category category = new Category();
        category.setName(name);
        category.setIsActive(isActive);

        String imageName = (file == null || file.isEmpty()) ? "default.jpg" : file.getOriginalFilename();
        category.setImageName(imageName);

        Boolean existCategory = categoryService.existCategory(category.getName());

        if (existCategory) {
            response.put("success", false);
            response.put("message", "Category name already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        Category saveCategory = categoryService.saveCategory(category);

        if (ObjectUtils.isEmpty(saveCategory)) {
            response.put("success", false);
            response.put("message", "Not saved! Internal server error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }

        if (file != null && !file.isEmpty()) {
            try {
                File saveFile = new ClassPathResource("static/img").getFile();
                Path path = Paths.get(saveFile.getAbsolutePath() + File.separator + "category_img" +
                        File.separator + file.getOriginalFilename());
                Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                System.err.println("Error saving category image: " + e.getMessage());
            }
        }

        response.put("success", true);
        response.put("message", "Category saved successfully");
        response.put("category", saveCategory);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable int id) {
        Map<String, Object> response = new HashMap<>();

        Boolean deleteCategory = categoryService.deleteCategory(id);

        if (deleteCategory) {
            response.put("success", true);
            response.put("message", "Category deleted successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable int id) {
        Category category = categoryService.getCategoryById(id);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(category);
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable int id,
            @RequestParam("name") String name,
            @RequestParam("isActive") Boolean isActive,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        Map<String, Object> response = new HashMap<>();

        Category oldCategory = categoryService.getCategoryById(id);
        if (oldCategory == null) {
            response.put("success", false);
            response.put("message", "Category not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        String imageName = (file == null || file.isEmpty()) ? oldCategory.getImageName() : file.getOriginalFilename();

        oldCategory.setName(name);
        oldCategory.setIsActive(isActive);
        oldCategory.setImageName(imageName);

        Category updateCategory = categoryService.saveCategory(oldCategory);

        if (!ObjectUtils.isEmpty(updateCategory)) {
            if (file != null && !file.isEmpty()) {
                try {
                    File saveFile = new ClassPathResource("static/img").getFile();
                    Path path = Paths.get(saveFile.getAbsolutePath() + File.separator + "category_img" +
                            File.separator + file.getOriginalFilename());
                    Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    System.err.println("Error saving category image: " + e.getMessage());
                }
            }

            response.put("success", true);
            response.put("message", "Category updated successfully");
            response.put("category", updateCategory);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ========== PRODUCT MANAGEMENT ==========

    @PostMapping("/products")
    public ResponseEntity<Map<String, Object>> saveProduct(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("price") Double price,
            @RequestParam("stock") Integer stock,
            @RequestParam("isActive") Boolean isActive,
            @RequestParam(value = "file", required = false) MultipartFile image) throws IOException {

        Map<String, Object> response = new HashMap<>();

        Product product = new Product();
        product.setTitle(title);
        product.setDescription(description);
        product.setCategory(category);
        product.setPrice(price);
        product.setStock(stock);
        product.setIsActive(isActive);

        String imageName = (image == null || image.isEmpty()) ? "default.jpg" : image.getOriginalFilename();
        product.setImage(imageName);
        product.setDiscount(0);
        product.setDiscountPrice(product.getPrice());

        Product saveProduct = productService.saveProduct(product);

        if (!ObjectUtils.isEmpty(saveProduct)) {
            if (image != null && !image.isEmpty()) {
                try {
                    File saveFile = new ClassPathResource("static/img").getFile();
                    Path path = Paths.get(saveFile.getAbsolutePath() + File.separator + "product_img" +
                            File.separator + image.getOriginalFilename());
                    Files.copy(image.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    System.err.println("Error saving product image: " + e.getMessage());
                }
            }

            response.put("success", true);
            response.put("message", "Product saved successfully");
            response.put("product", saveProduct);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {

        Map<String, Object> response = new HashMap<>();

        Page<Product> page;
        if (search != null && search.length() > 0) {
            page = productService.searchProductPagination(pageNo, pageSize, search);
        } else {
            page = productService.getAllProductsPagination(pageNo, pageSize);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page.getNumber());
        pagination.put("pageSize", pageSize);
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("isFirst", page.isFirst());
        pagination.put("isLast", page.isLast());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());

        response.put("products", page.getContent());
        response.put("pagination", pagination);
        response.put("searchQuery", search);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable int id) {
        Map<String, Object> response = new HashMap<>();

        // Delete associated similarities when deleting product
        similarityRepository.deleteByProductId(id);

        Boolean deleteProduct = productService.deleteProduct(id);
        if (deleteProduct) {
            response.put("success", true);
            response.put("message", "Product and related recommendations deleted successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> getProductForEdit(@PathVariable int id) {
        Map<String, Object> response = new HashMap<>();

        Product product = productService.getProductById(id);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        List<Category> categories = categoryService.getAllCategory();
        response.put("product", product);
        response.put("categories", categories);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable int id,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("price") Double price,
            @RequestParam("stock") Integer stock,
            @RequestParam("discount") Integer discount,
            @RequestParam("isActive") Boolean isActive,
            @RequestParam(value = "file", required = false) MultipartFile image) {

        Map<String, Object> response = new HashMap<>();

        if (discount < 0 || discount > 100) {
            response.put("success", false);
            response.put("message", "Invalid discount percentage");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        Product product = new Product();
        product.setId(id);
        product.setTitle(title);
        product.setDescription(description);
        product.setCategory(category);
        product.setPrice(price);
        product.setStock(stock);
        product.setDiscount(discount);
        product.setIsActive(isActive);

        Product updateProduct = productService.updateProduct(product, image);
        if (!ObjectUtils.isEmpty(updateProduct)) {
            response.put("success", true);
            response.put("message", "Product updated successfully");
            response.put("product", updateProduct);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ========== USER MANAGEMENT ==========

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(@RequestParam Integer type) {
        Map<String, Object> response = new HashMap<>();

        List<UserDtls> users;
        String userRole;
        if (type == 1) {
            users = userService.getUsers("ROLE_USER");
            userRole = "ROLE_USER";
        } else {
            users = userService.getUsers("ROLE_ADMIN");
            userRole = "ROLE_ADMIN";
        }

        response.put("users", users);
        response.put("userType", type);
        response.put("userRole", userRole);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Map<String, Object>> updateUserAccountStatus(
            @PathVariable Integer id,
            @RequestParam Boolean status) {

        Map<String, Object> response = new HashMap<>();

        Boolean updated = userService.updateAccountStatus(id, status);
        if (updated) {
            response.put("success", true);
            response.put("message", "Account status updated successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ========== ORDER MANAGEMENT ==========

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> getAllOrders(
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {

        Map<String, Object> response = new HashMap<>();

        Page<ProductOrder> page = orderService.getAllOrdersPagination(pageNo, pageSize);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page.getNumber());
        pagination.put("pageSize", pageSize);
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("isFirst", page.isFirst());
        pagination.put("isLast", page.isLast());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());

        response.put("orders", page.getContent());
        response.put("pagination", pagination);
        response.put("isSearch", false);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Integer id,
            @RequestParam Integer statusId) {

        Map<String, Object> response = new HashMap<>();

        OrderStatus[] values = OrderStatus.values();
        String status = null;

        for (OrderStatus orderSt : values) {
            if (orderSt.getId().equals(statusId)) {
                status = orderSt.getName();
                break;
            }
        }

        if (status == null) {
            response.put("success", false);
            response.put("message", "Invalid status ID");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        ProductOrder updateOrder = orderService.updateOrderStatus(id, status);

        try {
            commonUtil.sendMailForProductOrder(updateOrder, status);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (!ObjectUtils.isEmpty(updateOrder)) {
            response.put("success", true);
            response.put("message", "Order status updated successfully");
            response.put("order", updateOrder);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Status not updated");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/orders/search")
    public ResponseEntity<Map<String, Object>> searchOrder(@RequestParam String orderId) {
        Map<String, Object> response = new HashMap<>();

        if (orderId == null || orderId.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Order ID is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        ProductOrder order = orderService.getOrdersByOrderId(orderId.trim());

        if (ObjectUtils.isEmpty(order)) {
            response.put("success", false);
            response.put("message", "Order not found with ID: " + orderId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        response.put("success", true);
        response.put("order", order);
        response.put("isSearch", true);

        return ResponseEntity.ok(response);
    }

    // ========== ADMIN MANAGEMENT ==========

    @PostMapping("/admins")
    public ResponseEntity<Map<String, Object>> saveAdmin(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("mobileNumber") String mobileNumber,
            @RequestParam("password") String password,
            @RequestParam("address") String address,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam("pincode") String pincode) throws IOException {

        Map<String, Object> response = new HashMap<>();

        UserDtls user = new UserDtls();
        user.setName(name);
        user.setEmail(email);
        user.setMobileNumber(mobileNumber);
        user.setPassword(password);
        user.setAddress(address);
        user.setCity(city);
        user.setState(state);
        user.setPincode(pincode);

        UserDtls saveUser = userService.saveAdmin(user);

        if (!ObjectUtils.isEmpty(saveUser)) {
            response.put("success", true);
            response.put("message", "Admin registered successfully");
            response.put("user", saveUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ========== PROFILE MANAGEMENT ==========

    @GetMapping("/profile")
    public ResponseEntity<UserDtls> getProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = principal.getName();
        UserDtls user = userService.getUserByEmail(email);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(user);
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
            Principal principal) {

        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
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

        UserDtls updateUserProfile = userService.updateUserProfile(user, null);
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
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        UserDtls loggedInUserDetails = commonUtil.getLoggedInUserDetails(principal);
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

    // ========== ORDER STATUS ENUM ==========

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

    // ========== RECOMMENDATION SYSTEM MANAGEMENT ==========

    /**
     * Get comprehensive recommendation system statistics
     */
    @GetMapping("/recommendations/stats")
    public ResponseEntity<Map<String, Object>> getRecommendationStats(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            response.put("success", false);
            response.put("message", "Admin access required");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            long totalActivities = activityRepository.count();
            long totalSimilarities = similarityRepository.count();
            long totalUserScores = scoreRepository.count();

            Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
            List<?> recentActivitiesList = activityRepository.findRecentPurchases(sevenDaysAgo);
            long recentActivities = recentActivitiesList != null ? recentActivitiesList.size() : 0;

            response.put("success", true);
            response.put("stats", Map.of(
                    "totalActivities", totalActivities,
                    "totalSimilarities", totalSimilarities,
                    "totalUserScores", totalUserScores,
                    "recentPurchases", recentActivities
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error fetching stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Manually trigger product similarity computation
     * This computes which products are similar to each other based on:
     * - Same category
     * - Co-purchase patterns (users who bought A also bought B)
     */
    @PostMapping("/recommendations/compute-similarities")
    public ResponseEntity<Map<String, Object>> computeProductSimilarities(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            response.put("success", false);
            response.put("message", "Admin access required");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            new Thread(() -> {
                recommendationService.computeProductSimilarities();
            }).start();

            response.put("success", true);
            response.put("message", "Product similarity computation started in background. This will populate the product_similarity table.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error starting computation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Manually trigger user score computation for all users
     * This pre-computes personalized recommendations for each user based on their activity
     */
    @PostMapping("/recommendations/compute-all-user-scores")
    public ResponseEntity<Map<String, Object>> computeAllUserScores(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            response.put("success", false);
            response.put("message", "Admin access required");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            new Thread(() -> {
                List<UserDtls> users = userService.getUsers("ROLE_USER");
                for (UserDtls u : users) {
                    try {
                        recommendationService.computeUserScores(u.getId());
                    } catch (Exception e) {
                        System.err.println("Error computing scores for user " + u.getId() + ": " + e.getMessage());
                    }
                }
            }).start();

            response.put("success", true);
            response.put("message", "User score computation started for all users. This will populate the user_product_score table with personalized recommendations.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error starting computation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Compute personalized recommendations for a specific user
     */
    @PostMapping("/recommendations/compute-user-scores/{userId}")
    public ResponseEntity<Map<String, Object>> computeUserScores(
            @PathVariable Integer userId,
            Principal principal) {

        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            response.put("success", false);
            response.put("message", "Admin access required");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            new Thread(() -> {
                recommendationService.computeUserScores(userId);
            }).start();

            response.put("success", true);
            response.put("message", "User score computation started for user ID: " + userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error starting computation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Clear all recommendation data (for maintenance/debugging)
     */
    @DeleteMapping("/recommendations/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllRecommendationData(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            response.put("success", false);
            response.put("message", "Admin access required");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            activityRepository.deleteAll();
            similarityRepository.deleteAll();
            scoreRepository.deleteAll();

            response.put("success", true);
            response.put("message", "All recommendation data cleared successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error clearing data: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Clear only similarity data (to recompute fresh similarities)
     */
    @DeleteMapping("/recommendations/clear-similarities")
    public ResponseEntity<Map<String, Object>> clearSimilarities(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            response.put("success", false);
            response.put("message", "Admin access required");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            similarityRepository.deleteAll();

            response.put("success", true);
            response.put("message", "Product similarities cleared. Run 'compute-similarities' to rebuild.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error clearing similarities: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Clear only user scores (to recompute fresh personalized recommendations)
     */
    @DeleteMapping("/recommendations/clear-user-scores")
    public ResponseEntity<Map<String, Object>> clearUserScores(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        if (!"ROLE_ADMIN".equals(user.getRole())) {
            response.put("success", false);
            response.put("message", "Admin access required");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            scoreRepository.deleteAll();

            response.put("success", true);
            response.put("message", "User scores cleared. Run 'compute-all-user-scores' to rebuild.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error clearing user scores: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}