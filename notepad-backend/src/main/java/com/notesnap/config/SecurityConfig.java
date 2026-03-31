package com.notesnap.config;

// import com.notesnap.security.JwtAuthenticationFilter;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
// import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.web.SecurityFilterChain;
// import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// @Configuration
// @EnableWebSecurity
// public class SecurityConfig {

//     private final JwtAuthenticationFilter jwtAuthenticationFilter;

//     public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
//         this.jwtAuthenticationFilter = jwtAuthenticationFilter;
//     }

//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//         http
//             .csrf(AbstractHttpConfigurer::disable)
//             .cors(AbstractHttpConfigurer::disable) // Handled by CorsConfig or specify here
//             .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//             .authorizeHttpRequests(auth -> auth
//                 .requestMatchers("/api/notepad/*/verify").permitAll()
//                 .requestMatchers("/api/notepad/*").permitAll() // Initial GET is public (returns 401 if protected internally)
//                 .requestMatchers("/h2-console/**").permitAll()
//                 .anyRequest().authenticated()
//             )
//             .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
//             .headers(headers -> headers.frameOptions(frame -> frame.disable())); // For H2 console

//         return http.build();
//     }
// }

import com.notesnap.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ✅ ENABLE CORS (DO NOT disable)
            .cors(cors -> {})

            // ✅ Disable CSRF (stateless API)
            .csrf(csrf -> csrf.disable())

            // ✅ Stateless (JWT)
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ✅ Allow requests
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/notepad/**").permitAll() // ✅ FIXED
                        .requestMatchers("/h2-console/**").permitAll()
                        .anyRequest().authenticated()
                )

            // ✅ JWT filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

            // ✅ Required for H2 console
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }
}