package com.ecom.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Autowired
	@Lazy
	private AuthFailureHandlerImpl authenticationFailureHandler;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public UserDetailsService userDetailsService() {
		return new UserDetailsServiceImpl();
	}

	@Bean
	public DaoAuthenticationProvider authenticationProvider() {
		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
		authenticationProvider.setUserDetailsService(userDetailsService());
		authenticationProvider.setPasswordEncoder(passwordEncoder());
		return authenticationProvider;
	}

	// CRITICAL: Add AuthenticationManager bean
	@Bean
	public AuthenticationManager authenticationManager(
			AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(Arrays.asList(
				"http://localhost:3000",
				"http://127.0.0.1:3000"
		));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(Arrays.asList("*"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	// Custom Authentication Entry Point for API calls
	@Bean
	public AuthenticationEntryPoint apiAuthenticationEntryPoint() {
		return (request, response, authException) -> {
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType("application/json");
			response.setCharacterEncoding("UTF-8");
			String jsonResponse = "{\"success\": false, \"message\": \"Authentication required\", \"status\": 401}";
			response.getWriter().write(jsonResponse);
		};
	}

	// Custom Success Handler for API login
	@Bean
	public AuthenticationSuccessHandler apiAuthenticationSuccessHandler() {
		return (request, response, authentication) -> {
			response.setStatus(HttpStatus.OK.value());
			response.setContentType("application/json");
			response.setCharacterEncoding("UTF-8");

			// Get user details
			String username = authentication.getName();
			String authorities = authentication.getAuthorities().toString();

			String jsonResponse = String.format(
					"{\"success\": true, \"message\": \"Login successful\", \"username\": \"%s\", \"authorities\": \"%s\"}",
					username, authorities
			);
			response.getWriter().write(jsonResponse);
		};
	}

	// Request matcher to identify API calls
	private RequestMatcher apiRequestMatcher() {
		return new AntPathRequestMatcher("/api/**");
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session ->
						session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
				)
				.authorizeHttpRequests(authz -> authz
						// Public API endpoints
						.requestMatchers("/api/login", "/api/logout", "/api/register",
								"/api/forgot-password", "/api/reset-password",
								"/api/validate-reset-token", "/api/home",
								"/api/products", "/api/product/**",
								"/api/search", "/api/user-info", "/api/auth/check").permitAll()

						// Static resources
						.requestMatchers("/img/**", "/css/**", "/js/**", "/static/**").permitAll()

						// Traditional web pages (if you still have them)
						.requestMatchers("/signin", "/register", "/", "/home").permitAll()

						// API endpoints with role-based access
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")

						// Traditional endpoints (if you still have them)
						.requestMatchers("/user/**").hasRole("USER")
						.requestMatchers("/admin/**").hasRole("ADMIN")

						// All other requests need authentication
						.anyRequest().authenticated()
				)
				.authenticationProvider(authenticationProvider())
				.httpBasic(httpBasic -> httpBasic.disable())

				// Configure form login for web pages only
				.formLogin(form -> form
						.loginPage("/signin")
						.loginProcessingUrl("/login")
						.successHandler((request, response, authentication) -> {
							// Check if this is an API request
							if (request.getRequestURI().startsWith("/api/")) {
								apiAuthenticationSuccessHandler().onAuthenticationSuccess(request, response, authentication);
							} else {
								// Traditional redirect for web pages
								String redirectUrl = determineRedirectUrl(authentication);
								response.sendRedirect(redirectUrl);
							}
						})
						.failureHandler(authenticationFailureHandler)
						.permitAll()
				)

				// Configure logout
				.logout(logout -> logout
						.logoutUrl("/api/logout")
						.logoutSuccessHandler((request, response, authentication) -> {
							// Check if this is an API request
							if (request.getRequestURI().startsWith("/api/")) {
								response.setStatus(HttpStatus.OK.value());
								response.setContentType("application/json");
								response.getWriter().write("{\"success\": true, \"message\": \"Logout successful\"}");
							} else {
								response.sendRedirect("/signin?logout");
							}
						})
						.deleteCookies("JSESSIONID")
						.invalidateHttpSession(true)
						.clearAuthentication(true)
						.permitAll()
				)

				// Custom exception handling for API vs Web requests
				.exceptionHandling(ex -> ex
						.defaultAuthenticationEntryPointFor(
								apiAuthenticationEntryPoint(),
								apiRequestMatcher()
						)
						.authenticationEntryPoint((request, response, authException) -> {
							// For non-API requests, redirect to login page
							if (!request.getRequestURI().startsWith("/api/")) {
								response.sendRedirect("/signin");
							} else {
								apiAuthenticationEntryPoint().commence(request, response, authException);
							}
						})
				);

		return http.build();
	}

	// Helper method to determine redirect URL after login
	private String determineRedirectUrl(org.springframework.security.core.Authentication authentication) {
		boolean isAdmin = authentication.getAuthorities().stream()
				.anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

		if (isAdmin) {
			return "/admin/dashboard";
		} else {
			return "/user/dashboard";
		}
	}
}