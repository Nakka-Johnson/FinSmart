package com.finsmart.security;

import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

  private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String key = getClientIP(request);
    String path = request.getRequestURI();

    // Different rate limits for different endpoints
    Bucket bucket;
    if (path.equals("/api/auth/login")) {
      bucket = resolveBucket(key + ":login", 10, Duration.ofMinutes(1));
    } else {
      bucket = resolveBucket(key, 100, Duration.ofMinutes(1));
    }

    if (bucket.tryConsume(1)) {
      filterChain.doFilter(request, response);
    } else {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setContentType("application/json");
      response
          .getWriter()
          .write(
              String.format(
                  "{\"timestamp\":\"%s\",\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"path\":\"%s\"}",
                  java.time.Instant.now(), request.getRequestURI()));
    }
  }

  private Bucket resolveBucket(String key, long capacity, Duration refillDuration) {
    return cache.computeIfAbsent(key, k -> createNewBucket(capacity, refillDuration));
  }

  private Bucket createNewBucket(long capacity, Duration refillDuration) {
    return Bucket.builder()
        .addLimit(limit -> limit.capacity(capacity).refillIntervally(capacity, refillDuration))
        .build();
  }

  private String getClientIP(HttpServletRequest request) {
    String xfHeader = request.getHeader("X-Forwarded-For");
    if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
      return request.getRemoteAddr();
    }
    return xfHeader.split(",")[0];
  }
}
