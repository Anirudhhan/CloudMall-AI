package com.ecom.model;

import java.time.Instant;
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
@Table(name = "user_product_score", indexes = {
    @Index(name = "idx_user_id", columnList = "userId"),
    @Index(name = "idx_user_score", columnList = "userId, score")
})
public class UserProductScore {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false)
    private Integer userId;
    
    @Column(nullable = false)
    private Integer productId;
    
    @Column(nullable = false)
    private Double score;
    
    @Column(nullable = false)
    private Instant lastUpdated;
}