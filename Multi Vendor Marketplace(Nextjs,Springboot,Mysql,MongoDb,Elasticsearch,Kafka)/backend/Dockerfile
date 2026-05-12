FROM maven:3.9.11-eclipse-temurin-21 AS builder
ARG SERVICE_NAME
WORKDIR /workspace

COPY pom.xml ./
COPY gateway-service/pom.xml gateway-service/pom.xml
COPY order-service/pom.xml order-service/pom.xml
COPY payment-service/pom.xml payment-service/pom.xml
COPY product-service/pom.xml product-service/pom.xml
COPY user-service/pom.xml user-service/pom.xml
RUN mvn -q -pl ${SERVICE_NAME} -am dependency:go-offline

COPY . .
RUN mvn -q -DskipTests -pl ${SERVICE_NAME} -am package

FROM eclipse-temurin:21-jre
ARG SERVICE_NAME
WORKDIR /app
COPY --from=builder /workspace/${SERVICE_NAME}/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
