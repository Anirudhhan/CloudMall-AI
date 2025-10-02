package com.ecom.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ecom.model.ProductSimilarity;

public interface ProductSimilarityRepository extends JpaRepository<ProductSimilarity, Integer> {
    
    List<ProductSimilarity> findByProductIdOrderBySimilarityScoreDesc(Integer productId);
    
    List<ProductSimilarity> findTop10ByProductIdOrderBySimilarityScoreDesc(Integer productId);
    
    List<ProductSimilarity> findByProductIdAndBasis(Integer productId, String basis);
    
    void deleteByProductId(Integer productId);
}