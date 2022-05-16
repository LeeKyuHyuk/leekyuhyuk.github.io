---
title: '[Spring Boot] 게시판 구현 하기 (2) - 글 조회'
date: '2020-07-20 11:01:06'
category: Spring-Boot
---

이번 시간에는 [이전 글](https://kyuhyuk.kr/article/spring-boot/2020/07/19/Spring-Boot-JPA-MySQL-Board-Write-Post)에서 만든 게시글 목록을 클릭하면, 글을 조회하는 기능을 추가해보도록 하겠습니다.

## 게시글 조회 페이지 만들기

`src\main\resources\templates\board`에 `detail.html`을 아래와 같이 작성합니다.

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="UTF-8" />
    <title th:text="@{'게시판 - ' + ${post.title}}"></title>
    <link rel="stylesheet" href="/webjars/bootstrap/4.5.0/css/bootstrap.min.css" />
  </head>
  <body>
    <header th:insert="common/header.html"></header>
    <div class="container">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title" th:text="@{${post.title} + ' - ' + ${post.author}}"></h5>
          <p class="card-text">
            <small
              class="text-muted"
              th:text="${#temporals.format(post.createdDate, 'yyyy-MM-dd HH:mm')}"
            ></small>
          </p>
          <p class="card-text" th:text="${post.content}"></p>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-auto mr-auto"></div>
        <div class="col-auto">
          <a class="btn btn-info" th:href="@{'/post/edit/' + ${post.id}}" role="button">수정</a>
        </div>
        <div class="col-auto">
          <form id="delete-form" th:action="@{'/post/' + ${post.id}}" method="post">
            <input type="hidden" name="_method" value="delete" />
            <button id="delete-btn" type="submit" class="btn btn-danger">삭제</button>
          </form>
        </div>
      </div>
    </div>
    <script src="/webjars/jquery/3.5.1/jquery.min.js"></script>
    <script src="/webjars/bootstrap/4.5.0/js/bootstrap.min.js"></script>
  </body>
</html>
```

## Service 수정하기

게시글을 클릭하면 게시물의 내용이 화면에 출력되어야 합니다.  
그러려면 게시글의 `id`를 받아 해당 게시글의 데이터만 가져와 화면에 뿌려줘야 합니다.  
`getPost()`를 구현하여 해결해봅시다.

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
}
```

## Controller 수정하기

각 게시글을 클릭하면, `/post/{id}`으로 Get 요청을 합니다. (만약 1번 글을 클릭하면 `/post/1`로 접속됩니다.)  
`BoardController`에 `detail()`을 아래와 같이 구현하여, 요청받았을 때 해당 `id`의 데이터가 View로 전달되도록 만들어줍니다.

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
}
```

서버를 실행하고 글을 클릭해 보면 아래와 같이 글 내용이 출력되는 것을 확인할 수 있습니다.  
![Board Detail](/assets/image/2020-07-20-Spring-Boot-JPA-MySQL-Board-Post-View/2020-07-20-Spring-Boot-JPA-MySQL-Board-Post-View_1.png)
