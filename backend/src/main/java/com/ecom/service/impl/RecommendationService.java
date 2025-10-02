package com.ecom.service.impl;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.ecom.model.Product;
import com.ecom.model.ProductSimilarity;
import com.ecom.model.UserActivity;
import com.ecom.model.UserProductScore;
import com.ecom.repository.ProductRepository;
import com.ecom.repository.ProductSimilarityRepository;
import com.ecom.repository.UserActivityRepository;
import com.ecom.repository.UserProductScoreRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RecommendationService {

    @Autowired
    private UserActivityRepository activityRepository;

    @Autowired
    private ProductSimilarityRepository similarityRepository;

    @Autowired
    private UserProductScoreRepository scoreRepository;

    @Autowired
    private ProductRepository productRepository;

    private static final Map<String, Double> ACTION_WEIGHTS = Map.of(
        "VIEW", 1.0,
        "CLICK", 2.0,
        "ADD_TO_CART", 5.0,
        "PURCHASE", 10.0
    );

    @Async
    public void logActivity(Integer userId, Integer productId, String action, String sessionId) {
        try {
            UserActivity activity = new UserActivity();
            activity.setUserId(userId);
            activity.setProductId(productId);
            activity.setAction(action);
            activity.setTimestamp(Instant.now());
            activity.setSessionId(sessionId);
            activity.setScore(ACTION_WEIGHTS.getOrDefault(action, 1.0));
            
            activityRepository.save(activity);
            log.debug("Activity logged: userId={}, productId={}, action={}", userId, productId, action);
        } catch (Exception e) {
            log.error("Error logging activity", e);
        }
    }

    public List<Product> getRecommendationsForUser(Integer userId, int limit) {
        try {
            List<UserProductScore> scores = scoreRepository.findTop20ByUserIdOrderByScoreDesc(userId);
            
            if (!scores.isEmpty()) {
                List<Integer> productIds = scores.stream()
                    .limit(limit)
                    .map(UserProductScore::getProductId)
                    .collect(Collectors.toList());
                
                List<Product> products = productRepository.findAllById(productIds);
                
                // Filter out inactive products
                products = products.stream()
                    .filter(Product::getIsActive)
                    .collect(Collectors.toList());
                
                if (!products.isEmpty()) {
                    return products;
                }
            }
            
            return computeRecommendations(userId, limit);
        } catch (Exception e) {
            log.error("Error getting recommendations for user: " + userId, e);
            return getTrendingProducts(limit);
        }
    }

    private List<Product> computeRecommendations(Integer userId, int limit) {
        try {
            Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
            List<UserActivity> recentActivities = activityRepository
                .findRecentActivitiesByUser(userId, thirtyDaysAgo);
            
            if (recentActivities.isEmpty()) {
                return getTrendingProducts(limit);
            }
            
            Set<Integer> interactedProducts = recentActivities.stream()
                .map(UserActivity::getProductId)
                .collect(Collectors.toSet());
            
            Map<Integer, Double> recommendationScores = new HashMap<>();
            
            for (UserActivity activity : recentActivities) {
                List<ProductSimilarity> similarProducts = 
                    similarityRepository.findTop10ByProductIdOrderBySimilarityScoreDesc(activity.getProductId());
                
                for (ProductSimilarity similarity : similarProducts) {
                    Integer similarProductId = similarity.getSimilarProductId();
                    
                    if (interactedProducts.contains(similarProductId)) {
                        continue;
                    }
                    
                    double score = similarity.getSimilarityScore() * activity.getScore();
                    recommendationScores.merge(similarProductId, score, Double::sum);
                }
            }
            
            List<Integer> recommendedProductIds = recommendationScores.entrySet().stream()
                .sorted(Map.Entry.<Integer, Double>comparingByValue().reversed())
                .limit(limit * 2)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
            
            List<Product> products = productRepository.findAllById(recommendedProductIds);
            
            return products.stream()
                .filter(Product::getIsActive)
                .limit(limit)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error computing recommendations", e);
            return getTrendingProducts(limit);
        }
    }

    public List<Product> getSimilarProducts(Integer productId, int limit) {
        try {
            List<ProductSimilarity> similarities = 
                similarityRepository.findTop10ByProductIdOrderBySimilarityScoreDesc(productId);
            
            if (similarities.isEmpty()) {
                Product product = productRepository.findById(productId).orElse(null);
                if (product != null && product.getCategory() != null) {
                    return productRepository.findByCategory(product.getCategory()).stream()
                        .filter(p -> !p.getId().equals(productId))
                        .filter(Product::getIsActive)
                        .limit(limit)
                        .collect(Collectors.toList());
                }
                return Collections.emptyList();
            }
            
            List<Integer> similarProductIds = similarities.stream()
                .limit(limit * 2)
                .map(ProductSimilarity::getSimilarProductId)
                .collect(Collectors.toList());
            
            List<Product> products = productRepository.findAllById(similarProductIds);
            
            return products.stream()
                .filter(Product::getIsActive)
                .limit(limit)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error getting similar products", e);
            return Collections.emptyList();
        }
    }

    public List<Product> getTrendingProducts(int limit) {
        try {
            Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
            List<UserActivity> recentPurchases = activityRepository.findRecentPurchases(sevenDaysAgo);
            
            Map<Integer, Long> productPurchaseCounts = recentPurchases.stream()
                .collect(Collectors.groupingBy(UserActivity::getProductId, Collectors.counting()));
            
            List<Integer> trendingProductIds = productPurchaseCounts.entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                .limit(limit * 2)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
            
            if (trendingProductIds.isEmpty()) {
                return productRepository.findByIsActiveTrue().stream()
                    .limit(limit)
                    .collect(Collectors.toList());
            }
            
            List<Product> products = productRepository.findAllById(trendingProductIds);
            
            return products.stream()
                .filter(Product::getIsActive)
                .limit(limit)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error getting trending products", e);
            return productRepository.findByIsActiveTrue().stream()
                .limit(limit)
                .collect(Collectors.toList());
        }
    }

    public void computeProductSimilarities() {
        try {
            log.info("Starting product similarity computation...");
            
            // Clear old similarities
            similarityRepository.deleteAll();
            
            List<Product> allProducts = productRepository.findByIsActiveTrue();
            int processedCount = 0;
            
            for (Product product : allProducts) {
                // Category-based similarity
                List<Product> sameCategoryProducts = productRepository
                    .findByCategory(product.getCategory()).stream()
                    .filter(p -> !p.getId().equals(product.getId()))
                    .filter(Product::getIsActive)
                    .limit(10)
                    .collect(Collectors.toList());
                
                for (Product similar : sameCategoryProducts) {
                    saveSimilarity(product.getId(), similar.getId(), 0.7, "CATEGORY");
                }
                
                // Co-purchase similarity
                List<UserActivity> productPurchases = 
                    activityRepository.findPurchasesByProduct(product.getId());
                
                Set<Integer> userIds = productPurchases.stream()
                    .map(UserActivity::getUserId)
                    .collect(Collectors.toSet());
                
                if (userIds.size() > 0) {
                    Map<Integer, Long> coProductCounts = new HashMap<>();
                    Instant ninetyDaysAgo = Instant.now().minus(90, ChronoUnit.DAYS);
                    
                    for (Integer userId : userIds) {
                        List<UserActivity> userPurchases = activityRepository
                            .findByUserIdAndTimestampAfter(userId, ninetyDaysAgo).stream()
                            .filter(a -> "PURCHASE".equals(a.getAction()))
                            .filter(a -> !a.getProductId().equals(product.getId()))
                            .collect(Collectors.toList());
                        
                        for (UserActivity purchase : userPurchases) {
                            coProductCounts.merge(purchase.getProductId(), 1L, Long::sum);
                        }
                    }
                    
                    long totalPurchasers = userIds.size();
                    coProductCounts.entrySet().stream()
                        .filter(e -> e.getValue() > 1)
                        .forEach(e -> {
                            double score = Math.min(1.0, (double) e.getValue() / totalPurchasers * 2);
                            saveSimilarity(product.getId(), e.getKey(), score, "CO_PURCHASE");
                        });
                }
                
                processedCount++;
                if (processedCount % 50 == 0) {
                    log.info("Processed {} products", processedCount);
                }
            }
            
            log.info("Product similarity computation completed. Processed {} products", processedCount);
        } catch (Exception e) {
            log.error("Error computing product similarities", e);
        }
    }

    public void computeUserScores(Integer userId) {
        try {
            scoreRepository.deleteByUserId(userId);
            
            Instant ninetyDaysAgo = Instant.now().minus(90, ChronoUnit.DAYS);
            List<UserActivity> activities = activityRepository
                .findRecentActivitiesByUser(userId, ninetyDaysAgo);
            
            if (activities.isEmpty()) {
                return;
            }
            
            Map<Integer, Double> productScores = new HashMap<>();
            
            for (UserActivity activity : activities) {
                productScores.merge(activity.getProductId(), activity.getScore(), Double::sum);
                
                List<ProductSimilarity> similarities = 
                    similarityRepository.findByProductIdOrderBySimilarityScoreDesc(activity.getProductId());
                
                for (ProductSimilarity similarity : similarities.stream().limit(5).collect(Collectors.toList())) {
                    double decayedScore = activity.getScore() * similarity.getSimilarityScore() * 0.5;
                    productScores.merge(similarity.getSimilarProductId(), decayedScore, Double::sum);
                }
            }
            
            Instant now = Instant.now();
            for (Map.Entry<Integer, Double> entry : productScores.entrySet()) {
                UserProductScore score = new UserProductScore();
                score.setUserId(userId);
                score.setProductId(entry.getKey());
                score.setScore(entry.getValue());
                score.setLastUpdated(now);
                scoreRepository.save(score);
            }
            
            log.debug("Computed scores for user: {}, products: {}", userId, productScores.size());
        } catch (Exception e) {
            log.error("Error computing user scores for: " + userId, e);
        }
    }

    private void saveSimilarity(Integer productId, Integer similarProductId, double score, String basis) {
        try {
            ProductSimilarity similarity = new ProductSimilarity();
            similarity.setProductId(productId);
            similarity.setSimilarProductId(similarProductId);
            similarity.setSimilarityScore(score);
            similarity.setBasis(basis);
            similarityRepository.save(similarity);
        } catch (Exception e) {
            log.error("Error saving similarity", e);
        }
    }
}