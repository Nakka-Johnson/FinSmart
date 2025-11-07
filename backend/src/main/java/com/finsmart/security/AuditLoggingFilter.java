package com.finsmart.security;

import com.finsmart.domain.entity.AuditEvent;
import com.finsmart.domain.repository.AuditEventRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingFilter extends OncePerRequestFilter {

  private final AuditEventRepository auditEventRepository;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

    try {
      filterChain.doFilter(request, responseWrapper);
    } finally {
      logRequestAsync(request, responseWrapper);
      responseWrapper.copyBodyToResponse();
    }
  }

  private void logRequestAsync(HttpServletRequest request, ContentCachingResponseWrapper response) {
    CompletableFuture.runAsync(
        () -> {
          try {
            String userEmail = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null
                && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
              userEmail = auth.getName();
            }

            AuditEvent event =
                AuditEvent.builder()
                    .userEmail(userEmail)
                    .method(request.getMethod())
                    .path(request.getRequestURI())
                    .status(response.getStatus())
                    .ip(getClientIP(request))
                    .userAgent(request.getHeader("User-Agent"))
                    .build();

            auditEventRepository.save(event);
          } catch (Exception e) {
            log.error("Failed to save audit event", e);
          }
        });
  }

  private String getClientIP(HttpServletRequest request) {
    String xfHeader = request.getHeader("X-Forwarded-For");
    if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
      return request.getRemoteAddr();
    }
    return xfHeader.split(",")[0];
  }
}
