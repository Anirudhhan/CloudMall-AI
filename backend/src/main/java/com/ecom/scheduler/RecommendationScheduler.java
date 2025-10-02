package com.ecom.scheduler;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.ecom.model.UserDtls;
import com.ecom.repository.UserRepository;
import com.ecom.service.impl.RecommendationService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class RecommendationScheduler {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private UserRepository userRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    public void computeProductSimilarities() {
        log.info("Starting scheduled product similarity computation...");
        try {
            recommendationService.computeProductSimilarities();
            log.info("Product similarity computation completed");
        } catch (Exception e) {
            log.error("Error computing product similarities", e);
        }
    }

    @Scheduled(cron = "0 0 */6 * * ?")
    public void computeUserScores() {
        log.info("Starting scheduled user score computation...");
        try {
            List<UserDtls> users = userRepository.findAll();
            int count = 0;
            
            for (UserDtls user : users) {
                try {
                    recommendationService.computeUserScores(user.getId());
                    count++;
                    
                    if (count % 100 == 0) {
                        Thread.sleep(1000);
                        log.info("Processed {} users", count);
                    }
                } catch (Exception e) {
                    log.error("Error computing scores for user: " + user.getId(), e);
                }
            }
            
            log.info("User score computation completed. Processed {} users", count);
        } catch (Exception e) {
            log.error("Error in user score computation", e);
        }
    }
}