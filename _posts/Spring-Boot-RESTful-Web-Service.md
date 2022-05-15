---
title: '[Spring Boot] RESTful 웹 서비스 구축'
date: '2020-07-19 22:21:24'
category: Spring-Boot
---

# RESTful? 오늘은 무엇을 만드나요?

이 글에서는 HTTP GET 요청을 수락하는 서비스를 만들 것입니다.  
우리가 이 시간에 만들 것은 `http://localhost:8080/greeting`에 접속하면, 아래와 같이 JSON 포맷으로 출
력할 것입니다.

```json
{ "id": 1, "content": "Hello, World!" }
```

아래와 같이 `name` 파라미터를 통해 `content`의 내용을 사용자 지정할 수 있습니다.

```
http://localhost:8080/greeting?name=KyuHyuk Lee
```

위의 URL로 접속하면 `content`에 있는 `World`은 `name` 파라미터 값으로 대체되고, 아래와 같이 응답합니
다.

```json
{ "id": 1, "content": "Hello, KyuHyuk Lee!" }
```

# Creating Spring Boot Project

'[[Spring Boot] 프로젝트 생성](https://kyuhyuk.kr/article/spring-boot/2020/07/19/Create-Spring-Project)'
글을 보고 Spring Boot 프로젝트를 생성합니다.  
Dependencies에는 'Spring Web'만 있으면 됩니다.

# Create a Representation Class

위에서 프로젝트와 빌드 시스템을 생성했으므로 이제 웹 서비스를 만들 수 있습니다.  
우리가 만들 웹 서비스는 `name` 파라미터를 받아 `/greeting`에 대한 GET 요청을 처리합니다. `GET` 요청
을 받으면, 인사말을 나타내는 내용의 JSON 포맷으로 `200 OK` 응답을 반환해야 합니다. 아래처럼 출력됩니
다.

```json
{
  "id": 1,
  "content": "Hello, KyuHyuk Lee!"
}
```

`id`는 고유 식별자이며, `content`는 인사말입니다.

인사말 표현을 모델링 하기 위해 아래와 같은 클래스를 생성합니다.
`src/main/java/com/example/demo/Greeting.java`에 `id`와 `content`에 대한 필드, 생성자와 접근자가 있
는 `Greeting` 클래스를 만듭니다.

```java
package com.example.demo;

public class Greeting {
    private final long id;
    private final String content;

    public Greeting(long id, String content) {
        this.id = id;
        this.content = content;
    }

    public long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }
}
```

> 이 프로그램은 [Jackson JSON](https://github.com/FasterXML/jackson) 라이브러리를 사용하여
> `Greeting` 유형의 인스턴스를 JSON으로 표현합니다. Jackson은 기본적으로 Web Starter에 포함되어 있습
> 니다.

# Create a Controller

RESTful 웹 서비스를 구축하기 위해 Spring Boot에서 HTTP 요청은 컨트롤러에 의해 처리됩니다. 이러한 구
성 요소는
[@RestController](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestController.html)
어노테이션으로 식별되며, 우리가 만들 `GreetingController`는 `Greeting`의 새 인스턴스를 반환하여
`/greeting`에 대한 GET 요청을 처리합니다.

아래의 내용을 `src/main/java/com/example/demo/GreetingController.java`에 작성합니다.

```java
package com.example.demo;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GreetingController {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @GetMapping("/greeting")
    public Greeting greeting(@RequestParam(value = "name", defaultValue = "World") String name) {
        return new Greeting(counter.incrementAndGet(), String.format(template, name));
    }
}
```

`@GetMapping` 어노테이션 `/greeting`에 대한 HTTP GET 요청이 `greeting()` 메소드에 매핑 되도록 합니다
.

> 다른 HTTP에 대한 어노테이션이 있습니다. (예 POST의 경우 `@PostMapping`) 또한 `@RequestMapping` 어
> 노테이션이 있으며 `@RequestMapping (method=GET)`으로도 사용할 수 있습니다.

`@RequestParam`은 파라미터로 받는 `name`의 값을 `greeting()` 메소드의 `name` 파라미터 변수에 바인딩
합니다. 만약 HTTP GET 요청에 `name` 파라미터가 없으면, `defaultValue`에 있는 `World`가 사용됩니다.

`greeting()` 메소드는 `id`와 `content`을 가진 `Greeting` 객체를 만들고 반환합니다.

이 코드는 Spring Boot의 `@RestController` 어노테이션을 사용하는데, 이것은 `@Controller`와
`@ResponseBody`를 모두 포함하는 어노테이션입니다. `@Controller`와 다른 점은 `@Controller`는 일반적으
로 View Page 이름을 반환해주어 사용자에게 View Page를 출력하게 해줍니다.  
`@RestController`에서 반환되는 값은 HTTP ResponseBody에 직접 쓰여 출력하게 됩니다.

`Greeting` 객체는 JSON 포맷으로 변환되어야 하는데, Spring의 HTTP Message Converter 덕분에 JSON 포맷
으로 변환하는 것을 수동으로 할 필요는 없습니다.

# Test the Service

IntelliJ IDEA에 있는 'Gradle'에 들어가서 'bootRun'을 실행하여 Spring Boot를 실행할 수 있습니다.

또는 'build'를 실행하여 JAR 파일을 생성하고, 아래 명령어로 실행할 수 있습니다.

```
java -jar build\libs\demo-0.0.1-SNAPSHOT.jar
```

Spring Boot가 실행되면 로그들이 출력되고, 몇 초 내에 서비스가 시작됩니다.

`http://localhost:8080/greeting`에 접속하면, 아래와 같이 출력됩니다.

```json
{ "id": 1, "content": "Hello, World!" }
```

`http://localhost:8080/greeting?name=KyuHyuk Lee`에 접속하여, `name` 파라미터를 지정합니다.

`content` 속성 값이 `Hello, World!`에서 `Hello, KyuHyuk Lee!`로 변경된 것을 확인할 수 있습니다.

```json
{ "id": 2, "content": "Hello, KyuHyuk Lee!" }
```

이렇게 변경된 것을 통하여 `GreetingController`이 예상대로 작동함을 보여줍니다. `name` 파라미터에 기
본 값인 `World`가 지정되었지만, `name` 파라미터를 통해 대체되는 것을 확인했습니다.

`id` 속성이 `1`에서 `2`로 변경되었는데, 이는 여러 요청에서 동일한 `GreetingController` 인스턴스에 대
해 작업 중이며 각 호출에서 `id` 필드가 예상대로 증가하고 있음을 알 수 있습니다.
