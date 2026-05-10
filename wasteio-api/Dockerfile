# Build context: project root (wasteio/)
# docker build -f wasteio-api/Dockerfile -t stevetosak/wasteio-api .

FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY wasteio-api/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B
COPY wasteio-api/src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/wasteio-api-0.0.1-SNAPSHOT.jar app.jar
COPY container-device-simulator/devices.json /app/devices.json
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
