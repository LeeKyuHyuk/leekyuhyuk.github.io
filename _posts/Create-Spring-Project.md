---
title: '[Spring Boot] 프로젝트 생성'
date: '2020-07-19 19:10:30'
category: Spring-Boot
---

[Spring Initializr](https://start.spring.io/)에 접속하여 아래와 같이 선택하고, 'Generate'를 클릭합니다.  
![Spring Initializr](/assets/image/2020-07-19-Create-Spring-Project/2020-07-19-Create-Spring-Project_1.png)

프로젝트가 다운로드 되면, 원하는 경로에 압축을 풀어줍니다.

IntelliJ IDEA를 켜고 'Open or Import'을 누릅니다.  
![IntelliJ IDEA](/assets/image/2020-07-19-Create-Spring-Project/2020-07-19-Create-Spring-Project_2.png)  
그리고, 아까 압축을 푼 경로를 선택합니다.  
프로젝트 창이 열리면, Gradle과 의존성들이 다운로드 됩니다.

이제 'Hello, World!'를 출력해보겠습니다. `com.example.demo`에 있는 `DemoApplication.java`의 코드를아래와 같이 작성합니다.

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@GetMapping
	public String HelloWorld() {
		return "Hello, World!";
	}
}
```

- [`@RestController`](https://docs.spring.io/spring/docs/5.2.0.RELEASE/javadoc-api/org/springframework/web/bind/annotation/RestController.html) : [@Controller](https://docs.spring.io/spring/docs/5.2.0.RELEASE/javadoc-api/org/springframework/stereotype/Controller.html)와 [@ResponseBody](https://docs.spring.io/spring/docs/5.2.0.RELEASE/javadoc-api/org/springframework/web/bind/annotation/ResponseBody.html)를합쳐놓은 역할
- [`@GetMapping`](https://docs.spring.io/spring/docs/5.2.0.RELEASE/javadoc-api/org/springframework/web/bind/annotation/GetMapping.html) : HTTP GET 요청을 특정 핸들러 Method에 맵핑합니다. Value 값을 지정하지 않으면 기본값인 빈 값("")이설정됩니다.

이제 Spring Boot을 실행해보겠습니다. 'Gradle'에 들어가서 'bootRun'을 실행합니다.  
![Gradle bootRun](/assets/image/2020-07-19-Create-Spring-Project/2020-07-19-Create-Spring-Project_3.png)

브라우저에서 `localhost:8080`에 접속하여 'Hello, World!'가 출력되는지 확인합니다.  
![Hello, World!](/assets/image/2020-07-19-Create-Spring-Project/2020-07-19-Create-Spring-Project_4.png)
