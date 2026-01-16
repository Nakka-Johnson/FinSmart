# Multi-stage build for FinSmart Backend (Spring Boot)
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy POM first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn -q -DskipTests=true package

# Stage 2: Runtime with JRE
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create non-root user
RUN useradd -ms /bin/bash appuser

# Copy built JAR from build stage
COPY --from=build /app/target/*.jar /app/app.jar

# JVM memory settings (adjust for production)
ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 8080

# Run as non-root user
USER appuser

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
