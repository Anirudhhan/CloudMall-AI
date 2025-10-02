package com.ecom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "product_similarity", indexes = {
    @Index(name = "idx_product_id", columnList = "productId"),
    @Index(name = "idx_similar_product_id", columnList = "similarProductId")
})
public class ProductSimilarity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false)
    private Integer productId;
    
    @Column(nullable = false)
    private Integer similarProductId;
    
    @Column(nullable = false)
    private Double similarityScore;
    
    @Column(length = 50)
    private String basis; // CATEGORY, CO_PURCHASE, CO_VIEW
}