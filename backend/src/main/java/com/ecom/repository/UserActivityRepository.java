package com.ecom.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ecom.model.UserActivity;

public interface UserActivityRepository extends JpaRepository<UserActivity, Integer> {
    
    List<UserActivity> findByUserIdOrderByTimestampDesc(Integer userId);
    
    List<UserActivity> findByUserIdAndTimestampAfter(Integer userId, Instant after);
    
    List<UserActivity> findByProductIdAndActionOrderByTimestampDesc(Integer productId, String action);
    
    @Query("SELECT ua FROM UserActivity ua WHERE ua.userId = :userId AND ua.timestamp >= :since")
    List<UserActivity> findRecentActivitiesByUser(@Param("userId") Integer userId, @Param("since") Instant since);
    
    @Query("SELECT ua FROM UserActivity ua WHERE ua.productId = :productId AND ua.action = 'PURCHASE'")
    List<UserActivity> findPurchasesByProduct(@Param("productId") Integer productId);
    
    @Query("SELECT ua FROM UserActivity ua WHERE ua.action = 'PURCHASE' AND ua.timestamp >= :since")
    List<UserActivity> findRecentPurchases(@Param("since") Instant since);
}