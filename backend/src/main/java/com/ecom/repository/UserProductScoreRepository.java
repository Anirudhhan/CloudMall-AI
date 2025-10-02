package com.ecom.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecom.model.UserProductScore;

public interface UserProductScoreRepository extends JpaRepository<UserProductScore, Integer> {
    
    List<UserProductScore> findByUserIdOrderByScoreDesc(Integer userId);
    
    List<UserProductScore> findTop20ByUserIdOrderByScoreDesc(Integer userId);
    
    UserProductScore findByUserIdAndProductId(Integer userId, Integer productId);
    
    void deleteByUserId(Integer userId);
}