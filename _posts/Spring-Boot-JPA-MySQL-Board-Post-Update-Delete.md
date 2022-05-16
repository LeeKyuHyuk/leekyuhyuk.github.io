---
title: '[Spring Boot] 게시판 구현 하기 (3) - 글 수정 및 삭제'
date: '2020-07-21 21:09:51'
category: Spring-Boot
---

[앞의 글](https://kyuhyuk.kr/article/spring-boot/2020/07/20/Spring-Boot-JPA-MySQL-Board-Post-View)에서 글을 조회하는 기능을 만들었습니다.  
이번 시간에는 글을 수정하고 삭제하는 기능을 구현해보겠습니다.

## 게시글 수정 구현하기

글을 조회하는 페이지에서 '수정' 버튼을 누르면, `/post/edit/{id}`으로 Get 요청을 합니다. (만약 1번 글에서 '수정' 버튼을 클릭하면 `/post/edit/1`로 접속됩니다.)

우선 게시글을 수정하는 페이지부터 만들어봅시다.  
`src\main\resources\templates\board`에 `edit.html`을 아래와 같이 작성합니다.

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="UTF-8" />
    <title>게시판 - 글 수정</title>
    <link rel="stylesheet" href="/webjars/bootstrap/4.5.0/css/bootstrap.min.css" />
  </head>
  <body>
    <header th:insert="common/header.html"></header>
    <div class="container">
      <form th:action="@{'/post/edit/' + ${post.id}}" method="post">
        <input type="hidden" name="_method" value="put" />
        <input type="hidden" name="id" th:value="${post.id}" />
        <div class="form-group row">
          <label for="inputTitle" class="col-sm-2 col-form-label"><strong>제목</strong></label>
          <div class="col-sm-10">
            <input
              type="text"
              name="title"
              class="form-control"
              id="inputTitle"
              th:value="${post.title}"
            />
          </div>
        </div>
        <div class="form-group row">
          <label for="inputAuthor" class="col-sm-2 col-form-label"><strong>작성자</strong></label>
          <div class="col-sm-10">
            <input
              type="text"
              name="author"
              class="form-control"
              id="inputAuthor"
              th:value="${post.author}"
            />
          </div>
        </div>
        <div class="form-group row">
          <label for="inputContent" class="col-sm-2 col-form-label"><strong>내용</strong></label>
          <div class="col-sm-10">
            <textarea
              type="text"
              name="content"
              class="form-control"
              id="inputContent"
              th:value="${post.content}"
            ></textarea>
          </div>
        </div>
        <div class="row">
          <div class="col-auto mr-auto"></div>
          <div class="col-auto">
            <input class="btn btn-primary" type="submit" role="button" value="수정" />
          </div>
        </div>
      </form>
    </div>
    <script src="/webjars/jquery/3.5.1/jquery.min.js"></script>
    <script src="/webjars/bootstrap/4.5.0/js/bootstrap.min.js"></script>
  </body>
</html>
```

그리고, `BoardController` 클래스에 `edit()`를 추가합니다.

```java
package kr.kyuhyuk.board.controller;

import kr.kyuhyuk.board.dto.BoardDto;
import kr.kyuhyuk.board.service.BoardService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@Controller
public class BoardController {
    private BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping("/")
    public String list(Model model) {
        List<BoardDto> boardDtoList = boardService.getBoardList();
        model.addAttribute("postList", boardDtoList);
        return "board/list.html";
    }

    @GetMapping("/post")
    public String post() {
        return "board/post.html";
    }

    @PostMapping("/post")
    public String write(BoardDto boardDto) {
        boardService.savePost(boardDto);
        return "redirect:/";
    }

    @GetMapping("/post/{id}")
    public String detail(@PathVariable("id") Long id, Model model) {
        BoardDto boardDto = boardService.getPost(id);
        model.addAttribute("post", boardDto);
        return "board/detail.html";
    }

    @GetMapping("/post/edit/{id}")
    public String edit(@PathVariable("id") Long id, Model model) {
        BoardDto boardDto = boardService.getPost(id);
        model.addAttribute("post", boardDto);
        return "board/edit.html";
    }
}
```

서버를 실행하고 '수정' 버튼을 클릭해 보면 아래와 같이 출력되는 것을 확인할 수 있습니다.  
![Post Edit Page](/assets/image/2020-07-21-Spring-Boot-JPA-MySQL-Board-Post-Update-Delete/2020-07-21-Spring-Boot-JPA-MySQL-Board-Post-Update-Delete_1.png)

위의 화면에서 변경한 후, '수정' 버튼을 누르면 Put 형식으로 `/post/edit/{id}`로 서버에게 요청이 가게됩니다.  
서버에게 Put 요청이 오게되면, 데이터베이스에 변경된 데이터를 저장해야합니다.  
`BoardController` 클래스에 `update()`를 구현하여 구현해보겠습니다.

```java
package kr.kyuhyuk.board.controller;

import kr.kyuhyuk.board.dto.BoardDto;
import kr.kyuhyuk.board.service.BoardService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.List;

@Controller
public class BoardController {
    private BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping("/")
    public String list(Model model) {
        List<BoardDto> boardDtoList = boardService.getBoardList();
        model.addAttribute("postList", boardDtoList);
        return "board/list.html";
    }

    @GetMapping("/post")
    public String post() {
        return "board/post.html";
    }

    @PostMapping("/post")
    public String write(BoardDto boardDto) {
        boardService.savePost(boardDto);
        return "redirect:/";
    }

    @GetMapping("/post/{id}")
    public String detail(@PathVariable("id") Long id, Model model) {
        BoardDto boardDto = boardService.getPost(id);
        model.addAttribute("post", boardDto);
        return "board/detail.html";
    }

    @GetMapping("/post/edit/{id}")
    public String edit(@PathVariable("id") Long id, Model model) {
        BoardDto boardDto = boardService.getPost(id);
        model.addAttribute("post", boardDto);
        return "board/edit.html";
    }

    @PutMapping("/post/edit/{id}")
    public String update(BoardDto boardDto) {
        boardService.savePost(boardDto);
        return "redirect:/";
    }
}
```

위의 작업을 마친 후 `HiddenHttpMethodFilter`를 Bean으로 등록하여, `@PutMapping`과 `@DeleteMapping`이작동할 수 있도록 해줍니다.  
main 클래스(`BoardApplication`)에 아래와 같이 `hiddenHttpMethodFilter()` 추가해줍니다.

```java
package kr.kyuhyuk.board;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.filter.HiddenHttpMethodFilter;

@EnableJpaAuditing
@SpringBootApplication
public class BoardApplication {

	public static void main(String[] args) {
		SpringApplication.run(BoardApplication.class, args);
	}

	@Bean
	public HiddenHttpMethodFilter hiddenHttpMethodFilter() {
		return new HiddenHttpMethodFilter();
	}
}
```

서버를 실행하고, '안녕하세요' 글을 수정해봅시다. 아래와 같이 변경된 내용이 출력될 것입니다.  
![Board List](/assets/image/2020-07-21-Spring-Boot-JPA-MySQL-Board-Post-Update-Delete/2020-07-21-Spring-Boot-JPA-MySQL-Board-Post-Update-Delete_2.png)

## 게시글 삭제 구현하기

글을 조회하는 페이지에서 '삭제' 버튼을 누르면, `/post/{id}`으로 Delete 요청을 합니다. (만약 1번 글에서 '삭제' 버튼을 클릭하면 `/post/1`로 접속됩니다.)  
`id` 값을 사용하여, 해당 글을 데이터베이스에서 삭제하는 것을 구현해보겠습니다.

`BoardService` 클래스에 `deletePost()`를 추가합니다.

```java
package kr.kyuhyuk.board.service;

import kr.kyuhyuk.board.domain.entity.Board;
import kr.kyuhyuk.board.domain.repository.BoardRepository;
import kr.kyuhyuk.board.dto.BoardDto;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
public class BoardService {
    private BoardRepository boardRepository;

    public BoardService(BoardRepository boardRepository) {
        this.boardRepository = boardRepository;
    }

    @Transactional
    public Long savePost(BoardDto boardDto) {
        return boardRepository.save(boardDto.toEntity()).getId();
    }

    @Transactional
    public List<BoardDto> getBoardList() {
        List<Board> boardList = boardRepository.findAll();
        List<BoardDto> boardDtoList = new ArrayList<>();

        for(Board board : boardList) {
            BoardDto boardDto = BoardDto.builder()
                    .id(board.getId())
                    .author(board.getAuthor())
                    .title(board.getTitle())
                    .content(board.getContent())
                    .createdDate(board.getCreatedDate())
                    .build();
            boardDtoList.add(boardDto);
        }
        return boardDtoList;
    }

    @Transactional
    public BoardDto getPost(Long id) {
        Board board = boardRepository.findById(id).get();

        BoardDto boardDto = BoardDto.builder()
                .id(board.getId())
                .author(board.getAuthor())
                .title(board.getTitle())
                .content(board.getContent())
                .createdDate(board.getCreatedDate())
                .build();
        return boardDto;
    }

    @Transactional
    public void deletePost(Long id) {
        boardRepository.deleteById(id);
    }
}
```

그리고, `BoardController` 클래스에 `delete()`를 추가하여 `/post/{id}`에 Delete로 요청 오는 것을 처리합니다.

```java
package kr.kyuhyuk.board.controller;

import kr.kyuhyuk.board.dto.BoardDto;
import kr.kyuhyuk.board.service.BoardService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class BoardController {
    private BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping("/")
    public String list(Model model) {
        List<BoardDto> boardDtoList = boardService.getBoardList();
        model.addAttribute("postList", boardDtoList);
        return "board/list.html";
    }

    @GetMapping("/post")
    public String post() {
        return "board/post.html";
    }

    @PostMapping("/post")
    public String write(BoardDto boardDto) {
        boardService.savePost(boardDto);
        return "redirect:/";
    }

    @GetMapping("/post/{id}")
    public String detail(@PathVariable("id") Long id, Model model) {
        BoardDto boardDto = boardService.getPost(id);
        model.addAttribute("post", boardDto);
        return "board/detail.html";
    }

    @GetMapping("/post/edit/{id}")
    public String edit(@PathVariable("id") Long id, Model model) {
        BoardDto boardDto = boardService.getPost(id);
        model.addAttribute("post", boardDto);
        return "board/edit.html";
    }

    @PutMapping("/post/edit/{id}")
    public String update(BoardDto boardDto) {
        boardService.savePost(boardDto);
        return "redirect:/";
    }

    @DeleteMapping("/post/{id}")
    public String delete(@PathVariable("id") Long id) {
        boardService.deletePost(id);
        return "redirect:/";
    }
}
```

서버를 실행하고, 글을 삭제해봅시다. 아래와 같이 글이 삭제될 것입니다.  
![Board List](/assets/image/2020-07-21-Spring-Boot-JPA-MySQL-Board-Post-Update-Delete/2020-07-21-Spring-Boot-JPA-MySQL-Board-Post-Update-Delete_3.png)
