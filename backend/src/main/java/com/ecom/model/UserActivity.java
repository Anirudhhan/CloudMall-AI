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
@Table(name = "user_activity", indexes = {
    @Index(name = "idx_user_id", columnList = "userId"),
    @Index(name = "idx_product_id", columnList = "productId"),
    @Index(name = "idx_user_product", columnList = "userId, productId"),
    @Index(name = "idx_user_timestamp", columnList = "userId, timestamp")
})
public class UserActivity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false)
    private Integer userId;
    
    @Column(nullable = false)
    private Integer productId;
    
    @Column(length = 50)
    private String action; // VIEW, CLICK, ADD_TO_CART, PURCHASE
    
    @Column(nullable = false)
    private Instant timestamp;
    
    @Column(length = 255)
    private String sessionId;
    
    private Double score;
}