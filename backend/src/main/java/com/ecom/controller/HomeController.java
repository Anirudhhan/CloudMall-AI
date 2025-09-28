package com.ecom.controller;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ecom.model.Category;
import com.ecom.model.Product;
import com.ecom.model.UserDtls;
import com.ecom.service.CartService;
import com.ecom.service.CategoryService;
import com.ecom.service.ProductService;
import com.ecom.service.UserService;
import com.ecom.util.CommonUtil;

import io.micrometer.common.util.StringUtils;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class HomeController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserService userService;

    @Autowired
    private CommonUtil commonUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private CartService cartService;

    // Fixed login endpoint with proper session management
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> loginRequest,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        if (email == null || password == null || email.trim().isEmpty() || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email and password are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        try {
            // Create authentication token
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(email, password);

            // Authenticate using Spring Security
            Authentication authentication = authenticationManager.authenticate(authToken);

            // Create security context
            SecurityContext securityContext = SecurityContextHolder.getContext();
            securityContext.setAuthentication(authentication);

            // Create and store session
            HttpSession session = request.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);

            // Get user details
            UserDtls user = userService.getUserByEmail(email);
            Integer cartCount = cartService.getCountCart(user.getId());

            // Prepare user response (exclude sensitive data)
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("name", user.getName());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("profileImage", user.getProfileImage());

            response.put("success", true);
            response.put("message", "Login successful");
            response.put("user", userInfo);
            response.put("cartCount", cartCount);

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Fixed logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();

        // Clear Spring Security context
        SecurityContextHolder.clearContext();

        // Invalidate session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        response.put("success", true);
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }

    // Auth check endpoint (should work now with proper sessions)
    @GetMapping("/auth/check")
    public ResponseEntity<Map<String, Object>> checkAuth(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            response.put("authenticated", false);
            response.put("user", null);
            return ResponseEntity.ok(response);
        }

        try {
            String email = principal.getName();
            UserDtls user = userService.getUserByEmail(email);

            if (user == null || !user.getIsEnable()) {
                response.put("authenticated", false);
                response.put("user", null);
                return ResponseEntity.ok(response);
            }

            // Get cart count
            Integer cartCount = cartService.getCountCart(user.getId());

            // Prepare user response
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("name", user.getName());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("profileImage", user.getProfileImage());

            response.put("authenticated", true);
            response.put("user", userInfo);
            response.put("cartCount", cartCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("authenticated", false);
            response.put("user", null);
            response.put("error", "Error checking authentication: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    @GetMapping("/user-info")
    public ResponseEntity<Map<String, Object>> getUserInfo(Principal principal) {
        Map<String, Object> response = new HashMap<>();

        if (principal != null) {
            String email = principal.getName();
            UserDtls userDtls = userService.getUserByEmail(email);
            Integer countCart = cartService.getCountCart(userDtls.getId());

            response.put("user", userDtls);
            response.put("countCart", countCart);
        }

        List<Category> allActiveCategory = categoryService.getAllActiveCategory();
        response.put("categories", allActiveCategory);

        return ResponseEntity.ok(response);
    }

    // Home page data
    @GetMapping("/home")
    public ResponseEntity<Map<String, Object>> getHomeData() {
        Map<String, Object> response = new HashMap<>();

        List<Category> recentCategories = categoryService.getAllActiveCategory().stream()
                .sorted((c1, c2) -> c2.getId().compareTo(c1.getId()))
                .limit(6)
                .toList();

        List<Product> recentProducts = productService.getAllActiveProducts("").stream()
                .sorted((p1, p2) -> p2.getId().compareTo(p1.getId()))
                .limit(8)
                .toList();

        response.put("categories", recentCategories);
        response.put("products", recentProducts);

        return ResponseEntity.ok(response);
    }

    // Get all products with pagination and filtering
    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(value = "category", defaultValue = "") String category,
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "12") Integer pageSize,
            @RequestParam(defaultValue = "") String search) {

        Map<String, Object> response = new HashMap<>();

        List<Category> categories = categoryService.getAllActiveCategory();
        response.put("allCategories", categories);
        response.put("currentCategory", category);

        Page<Product> page;
        if (StringUtils.isEmpty(search)) {
            page = productService.getAllActiveProductPagination(pageNo, pageSize, category);
        } else {
            page = productService.searchActiveProductPagination(pageNo, pageSize, category, search);
        }

        List<Product> products = page.getContent();

        // Build pagination info
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("currentPage", page.getNumber());
        pagination.put("pageSize", pageSize);
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("isFirst", page.isFirst());
        pagination.put("isLast", page.isLast());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());

        response.put("products", products);
        response.put("productsCount", products.size());
        response.put("pagination", pagination);
        response.put("searchQuery", search);

        return ResponseEntity.ok(response);
    }

    // Get single product by ID
    @GetMapping("/product/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable int id) {
        Product product = productService.getProductById(id);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }

    // Register user
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(
            @RequestParam("email") String email,
            @RequestParam("name") String name,
            @RequestParam("mobileNumber") String mobileNumber,
            @RequestParam("password") String password,
            @RequestParam("address") String address,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam("pincode") String pincode,
            @RequestParam(value = "img", required = false) MultipartFile file) throws IOException {

        Map<String, Object> response = new HashMap<>();

        Boolean existsEmail = userService.existsEmail(email);

        if (existsEmail) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        UserDtls user = new UserDtls();
        user.setEmail(email);
        user.setName(name);
        user.setMobileNumber(mobileNumber);
        user.setPassword(password);
        user.setAddress(address);
        user.setCity(city);
        user.setState(state);
        user.setPincode(pincode);

        String imageName = (file == null || file.isEmpty()) ? "default.jpg" : file.getOriginalFilename();
        user.setProfileImage(imageName);

        UserDtls savedUser = userService.saveUser(user);

        if (!ObjectUtils.isEmpty(savedUser)) {
            if (file != null && !file.isEmpty()) {
                try {
                    File saveFile = new ClassPathResource("static/img").getFile();
                    Path path = Paths.get(saveFile.getAbsolutePath() + File.separator + "profile_img" + File.separator
                            + file.getOriginalFilename());
                    Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    // Log error but don't fail registration
                    System.err.println("Error saving profile image: " + e.getMessage());
                }
            }

            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("user", savedUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong on server");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Forgot password - send reset email
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> processForgotPassword(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) throws UnsupportedEncodingException, MessagingException {

        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");

        UserDtls userByEmail = userService.getUserByEmail(email);

        if (ObjectUtils.isEmpty(userByEmail)) {
            response.put("success", false);
            response.put("message", "Invalid email");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        String resetToken = UUID.randomUUID().toString();
        userService.updateUserResetToken(email, resetToken);

        String url = CommonUtil.generateUrl(httpRequest) + "/reset-password?token=" + resetToken;
        Boolean sendMail = commonUtil.sendMail(url, email);

        if (sendMail) {
            response.put("success", true);
            response.put("message", "Password reset link sent to your email");
        } else {
            response.put("success", false);
            response.put("message", "Something went wrong! Email not sent");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }

        return ResponseEntity.ok(response);
    }

    // Validate reset password token
    @GetMapping("/validate-reset-token")
    public ResponseEntity<Map<String, Object>> validateResetToken(@RequestParam String token) {
        Map<String, Object> response = new HashMap<>();

        UserDtls userByToken = userService.getUserByToken(token);

        if (userByToken == null) {
            response.put("valid", false);
            response.put("message", "Your link is invalid or expired!");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        response.put("valid", true);
        response.put("message", "Token is valid");
        return ResponseEntity.ok(response);
    }

    // Reset password
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        String token = request.get("token");
        String password = request.get("password");

        UserDtls userByToken = userService.getUserByToken(token);

        if (userByToken == null) {
            response.put("success", false);
            response.put("message", "Your link is invalid or expired!");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        userByToken.setPassword(passwordEncoder.encode(password));
        userByToken.setResetToken(null);
        userService.updateUser(userByToken);

        response.put("success", true);
        response.put("message", "Password changed successfully");
        return ResponseEntity.ok(response);
    }

    // Search products
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchProducts(@RequestParam String query) {
        Map<String, Object> response = new HashMap<>();

        List<Product> searchProducts = productService.searchProduct(query);
        List<Category> categories = categoryService.getAllActiveCategory();

        response.put("products", searchProducts);
        response.put("categories", categories);
        response.put("searchQuery", query);
        response.put("resultsCount", searchProducts.size());

        return ResponseEntity.ok(response);
    }
}