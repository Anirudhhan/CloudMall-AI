package com.ecom.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.ecom.model.Product;
import com.ecom.model.UserDtls;
import com.ecom.service.UserService;
import com.ecom.service.impl.RecommendationService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private UserService userService;

    @PostMapping("/track")
    public ResponseEntity<Map<String, Object>> trackActivity(
            @RequestBody Map<String, String> request,
            Principal principal,
            HttpSession session) {
        
        Map<String, Object> response = new HashMap<>();

        String productIdStr = request.get("productId");
        String action = request.get("action");
        
        if (productIdStr == null || action == null) {
            response.put("success", false);
            response.put("message", "productId and action are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        Integer productId = Integer.parseInt(productIdStr);
        Integer userId;
        
        if (principal != null) {
            UserDtls user = userService.getUserByEmail(principal.getName());
            userId = user.getId();
        } else {
            userId = null;
        }

        String sessionId = session.getId();
        recommendationService.logActivity(userId, productId, action, sessionId);

        response.put("success", true);
        response.put("message", "Activity tracked");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/for-you")
    public ResponseEntity<Map<String, Object>> getPersonalizedRecommendations(
            @RequestParam(defaultValue = "12") int limit,
            Principal principal) {
        
        Map<String, Object> response = new HashMap<>();

        if (principal == null) {
            List<Product> trending = recommendationService.getTrendingProducts(limit);
            response.put("success", true);
            response.put("recommendations", trending);
            response.put("count", trending.size());
            response.put("type", "trending");
            return ResponseEntity.ok(response);
        }

        UserDtls user = userService.getUserByEmail(principal.getName());
        List<Product> recommendations = recommendationService.getRecommendationsForUser(user.getId(), limit);

        response.put("success", true);
        response.put("recommendations", recommendations);
        response.put("count", recommendations.size());
        response.put("type", "personalized");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/similar/{productId}")
    public ResponseEntity<Map<String, Object>> getSimilarProducts(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "8") int limit) {
        
        Map<String, Object> response = new HashMap<>();

        List<Product> similarProducts = recommendationService.getSimilarProducts(productId, limit);

        response.put("success", true);
        response.put("products", similarProducts);
        response.put("count", similarProducts.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trending")
    public ResponseEntity<Map<String, Object>> getTrendingProducts(
            @RequestParam(defaultValue = "12") int limit) {
        
        Map<String, Object> response = new HashMap<>();

        List<Product> trendingProducts = recommendationService.getTrendingProducts(limit);

        response.put("success", true);
        response.put("products", trendingProducts);
        response.put("count", trendingProducts.size());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/compute-similarities")
    public ResponseEntity<Map<String, Object>> computeSimilarities(Principal principal) {
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

        new Thread(() -> recommendationService.computeProductSimilarities()).start();

        response.put("success", true);
        response.put("message", "Similarity computation started");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/compute-user-scores/{userId}")
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

        new Thread(() -> recommendationService.computeUserScores(userId)).start();

        response.put("success", true);
        response.put("message", "User score computation started");
        
        return ResponseEntity.ok(response);
    }
}