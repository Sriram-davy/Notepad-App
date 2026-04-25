# 📝 SlashPad Backend

A Spring Boot-based backend service for SlashPad, supporting secure note storage with automatic expiry.

---

## 🚀 Tech Stack

* Java 21
* Spring Boot 3
* Spring Data JPA
* PostgreSQL (Supabase)
* Render (Deployment)

---

## ⚙️ Configuration Overview

This project uses **environment variables** for database configuration and is deployed on **Render**, connecting to **Supabase via connection pooling (PgBouncer)**.

---

## 🔑 Environment Variables

Set the following variables in your deployment platform (Render):

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require

SPRING_DATASOURCE_USERNAME=postgres.<your-project-ref>

SPRING_DATASOURCE_PASSWORD=your_actual_password
```

> ⚠️ Important:
>
> * Do NOT include username/password inside the URL
> * Do NOT use port `5432` (IPv6 issue on Render)
> * Always use `sslmode=require`

---

## 🧾 application.properties

```properties
server.port=${PORT:8080}

spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false

# Required for Supabase PgBouncer (connection pooler)
spring.jpa.properties.hibernate.temp.use_jdbc_metadata_defaults=false

# Optional safety
spring.jpa.properties.hibernate.default_schema=public

# Disable default Spring Security (if not used)
spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration

# Logging
logging.level.com.slashpad=DEBUG
logging.level.org.springframework.web=INFO

# App Config
notepad.character.limit=50000
notepad.expiry.days=10
```

---

## 🧠 Important Architecture Notes

### 🔹 Why Pooler (Port 6543)?

* Render is **IPv4-only**
* Supabase direct DB (`5432`) is **IPv6-only**
* So we must use **PgBouncer pooler (6543)**

---

### 🔹 Hibernate Fix (Critical)

PgBouncer does not support JDBC metadata queries properly.

To prevent startup failure:

```properties
spring.jpa.properties.hibernate.temp.use_jdbc_metadata_defaults=false
```

This disables metadata lookup and avoids:

```
Unable to determine Dialect without JDBC metadata
```

---

## 🏃 Running Locally

You can run locally using either:

### Option 1 — Same Supabase Pooler (recommended for consistency)

Set env vars locally and run:

```bash
mvn spring-boot:run
```

---

### Option 2 — Local PostgreSQL (for development)

Update:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/slashpad
spring.datasource.username=postgres
spring.datasource.password=your_password
```

---

## 🚀 Deployment (Render)

1. Push code to GitHub
2. Create a **Web Service** on Render
3. Set environment variables (above)
4. Deploy

---

## ✅ Expected Logs

Successful startup should include:

```
HikariPool-1 - Start completed
Tomcat started on port XXXX
```

❌ You should NOT see:

```
Unable to determine Dialect
```

---

## ⚠️ Common Issues

| Issue              | Cause                     | Fix                          |
| ------------------ | ------------------------- | ---------------------------- |
| Dialect error      | PgBouncer metadata issue  | Disable metadata defaults    |
| Connection failure | Using port 5432 on Render | Use 6543                     |
| Auth failure       | Wrong username format     | Use `postgres.<project-ref>` |
| SSL error          | Missing sslmode           | Add `?sslmode=require`       |

---

## 📌 Future Improvements

* Add connection pool tuning
* Introduce Flyway/Liquibase for migrations
* Enable proper security config (JWT fully wired)
* Add health checks for DB connectivity

---

## 👨‍💻 Author

Built and maintained as part of a production-grade backend learning project.
