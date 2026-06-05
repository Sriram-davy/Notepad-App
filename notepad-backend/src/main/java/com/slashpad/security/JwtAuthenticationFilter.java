package com.slashpad.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtUtils jwtUtils;

    public JwtAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String path;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            path = jwtUtils.extractPath(jwt);
            logger.debug("Extracted path [{}] from JWT token", path);

            Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
            logger.debug("Existing authentication in context: {}", existingAuth);

            if (path != null && (existingAuth == null || existingAuth instanceof AnonymousAuthenticationToken)) {
                String requestURI = request.getRequestURI().toLowerCase();
                String targetPath = "/api/notepad/" + path.toLowerCase();
                boolean matches = requestURI.contains(targetPath);
                logger.debug("Request URI: {}, Target Path: {}, Matches: {}", requestURI, targetPath, matches);

                if (matches) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            path, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("Successfully authenticated path [{}] from JWT for URI [{}]", path, request.getRequestURI());
                } else {
                    logger.warn("Authentication path mismatch: URI [{}] does not contain target path [{}]", request.getRequestURI(), targetPath);
                }
            }
        } catch (Exception e) {
            logger.error("Exception extracting/validating JWT token: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}
