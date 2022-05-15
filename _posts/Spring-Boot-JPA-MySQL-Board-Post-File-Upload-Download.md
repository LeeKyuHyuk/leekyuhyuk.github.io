---
title: '[Spring Boot] 게시판 구현 하기 (4) - 파일 업로드 & 다운로드'
date: '2020-07-22 23:48:39'
category: Spring-Boot
---

[앞의 글](https://kyuhyuk.kr/article/spring-boot/2020/07/21/Spring-Boot-JPA-MySQL-Board-Post-Update-Delete)에
서 글을 수정하고 삭제하는 기능을 만들었습니다.  
이번 시간에는 파일을 업로드하고 다운로드하는 기능을 구현해보겠습니다.

## 파일 업로드 구현하기

파일 업로드를 구현하기 전에, 어떤 과정으로 동작하고 어떻게 구현할 것인지 미리 생각해봅시다.  
아래는 파일 업로드의 과정입니다.  
![File Upload Flow](/assets/image/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download_1.png)  
우리가 구현할 것은 4가지입니다.

- '글쓰기' 화면에 파일 업로드 추가하기
- 업로드한 파일의 정보가 기록될 `file` 테이블 만들기 (Entity, Repository, DTO, Service 만들기)
- 업로드한 파일 정보의 고유 ID가 `board` 테이블에 기록되도록 변경하기
- `BoardController`의 `write()`에서 업로드한 파일이 서버에 저장되게 하고 `board`, `file` 테이블에 업
  데이트 되도록 하기

구현할 목록을 보면서 하나하나 진행해봅시다.

우선, `src\main\resources\templates\board`에 있는 `post.html`을 아래와 같이 수정합니다.  
기존 내용에 파일 선택하는 거와 `form`에 `enctype="multipart/form-data"`만 추가하였습니다.

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="UTF-8" />
    <title>게시판 - 글쓰기</title>
    <link rel="stylesheet" href="/webjars/bootstrap/4.5.0/css/bootstrap.min.css" />
  </head>
  <body>
    <header th:insert="common/header.html"></header>
    <div class="container">
      <form action="/post" method="post" enctype="multipart/form-data">
        <div class="form-group row">
          <label for="inputTitle" class="col-sm-2 col-form-label"><strong>제목</strong></label>
          <div class="col-sm-10">
            <input type="text" name="title" class="form-control" id="inputTitle" />
          </div>
        </div>
        <div class="form-group row">
          <label for="inputAuthor" class="col-sm-2 col-form-label"><strong>작성자</strong></label>
          <div class="col-sm-10">
            <input type="text" name="author" class="form-control" id="inputAuthor" />
          </div>
        </div>
        <div class="form-group row">
          <label for="inputContent" class="col-sm-2 col-form-label"><strong>내용</strong></label>
          <div class="col-sm-10">
            <textarea type="text" name="content" class="form-control" id="inputContent"></textarea>
          </div>
        </div>
        <div class="form-group row">
          <label for="inputFile" class="col-sm-2 col-form-label"><strong>첨부 파일</strong></label>
          <div class="col-sm-10">
            <div class="custom-file" id="inputFile">
              <input name="file" type="file" class="custom-file-input" id="customFile" />
              <label class="custom-file-label" for="customFile">파일을 선택해 주세요.</label>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-auto mr-auto"></div>
          <div class="col-auto">
            <input class="btn btn-primary" type="submit" role="button" value="글쓰기" />
          </div>
        </div>
      </form>
    </div>
    <script src="/webjars/jquery/3.5.1/jquery.min.js"></script>
    <script src="/webjars/bootstrap/4.5.0/js/bootstrap.min.js"></script>
    <script>
      $('.custom-file-input').on('change', function () {
        var fileName = $(this).val().split('\\').pop();
        $(this).siblings('.custom-file-label').addClass('selected').html(fileName);
      });
    </script>
  </body>
</html>
```

파일이 업로드되면 '업로드된 실제 파일명', '서버에 저장된 파일명', '파일이 서버에 저장된 위치'가 데이
터 베이스에 기록되게 프로그램을 작성할 것입니다.  
우선 업로드된 파일에 대한 데이터가 저장되게 Entity, Repository, DTO, Service를 만들어줍니다.

아래는 `domain.entity` 패키지의 `File` 클래스의 내용입니다.

```java
package kr.kyuhyuk.board.domain.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class File {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String origFilename;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String filePath;

    @Builder
    public File(Long id, String origFilename, String filename, String filePath) {
        this.id = id;
        this.origFilename = origFilename;
        this.filename = filename;
        this.filePath = filePath;
    }
}
```

아래는 `domain.repository` 패키지의 `FileRepository` 인터페이스의 내용입니다.

```java
package kr.kyuhyuk.board.domain.repository;

import kr.kyuhyuk.board.domain.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileRepository extends JpaRepository<File, Long> {
}
```

아래는 `dto` 패키지의 `FileDto` 클래스의 내용입니다.

```java
package kr.kyuhyuk.board.dto;

import kr.kyuhyuk.board.domain.entity.File;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class FileDto {
    private Long id;
    private String origFilename;
    private String filename;
    private String filePath;

    public File toEntity() {
        File build = File.builder()
                .id(id)
                .origFilename(origFilename)
                .filename(filename)
                .filePath(filePath)
                .build();
        return build;
    }

    @Builder
    public FileDto(Long id, String origFilename, String filename, String filePath) {
        this.id = id;
        this.origFilename = origFilename;
        this.filename = filename;
        this.filePath = filePath;
    }
}
```

아래는 `service` 패키지의 `FileService` 클래스의 내용입니다.  
`saveFile()`은 업로드한 파일에 대한 정보를 기록하고, `getFile()`는 `id` 값을 사용하여 파일에 대한 정
보를 가져옵니다.

```java
package kr.kyuhyuk.board.service;

import kr.kyuhyuk.board.domain.entity.File;
import kr.kyuhyuk.board.domain.repository.FileRepository;
import kr.kyuhyuk.board.dto.FileDto;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;

@Service
public class FileService {
    private FileRepository fileRepository;

    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    @Transactional
    public Long saveFile(FileDto fileDto) {
        return fileRepository.save(fileDto.toEntity()).getId();
    }

    @Transactional
    public FileDto getFile(Long id) {
        File file = fileRepository.findById(id).get();

        FileDto fileDto = FileDto.builder()
                .id(id)
                .origFilename(file.getOrigFilename())
                .filename(file.getFilename())
                .filePath(file.getFilePath())
                .build();
        return fileDto;
    }
}
```

`domain.entity` 패키지에 있는 `Board`에 `fileId`를 추가합니다.  
첨부파일은 게시물에 필수로 들어가는 내용이 아니기 때문에, `nullable = false`는 넣지 않았습니다.

```java
package kr.kyuhyuk.board.domain.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class) /* JPA에게 해당 Entity는 Auditiong 기능을 사용함을 알립니다. */
public class Board {

    @Id
    @GeneratedValue
    private Long id;

    @Column(length = 10, nullable = false)
    private String author;

    @Column(length = 100, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column
    private Long fileId;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime modifiedDate;

    @Builder
    public Board(Long id, String author, String title, String content, Long fileId) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.content = content;
        this.fileId = fileId;
    }
}
```

`dto` 패키지에 있는 `BoardDto` 클래스에도 `fileId`를 추가합니다.

```java
package kr.kyuhyuk.board.dto;

import kr.kyuhyuk.board.domain.entity.Board;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class BoardDto {
    private Long id;
    private String author;
    private String title;
    private String content;
    private Long fileId;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;

    public Board toEntity() {
        Board build = Board.builder()
                .id(id)
                .author(author)
                .title(title)
                .content(content)
                .fileId(fileId)
                .build();
        return build;
    }

    @Builder
    public BoardDto(Long id, String author, String title, String content, Long fileId, LocalDateTime createdDate, LocalDateTime modifiedDate) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.content = content;
        this.fileId = fileId;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
    }
}
```

`service` 패키지에 있는 `BoardService` 클래스의 `getPost()`에도 `fileId`를 가져오게 수정합니다.

```java
@Transactional
public BoardDto getPost(Long id) {
    Board board = boardRepository.findById(id).get();

    BoardDto boardDto = BoardDto.builder()
            .id(board.getId())
            .author(board.getAuthor())
            .title(board.getTitle())
            .content(board.getContent())
            .fileId(board.getFileId())
            .createdDate(board.getCreatedDate())
            .build();
    return boardDto;
}
```

파일이 업로드되면, MD5 체크섬의 값으로 서버에 저장되게 구현할 것입니다.  
문자열을 MD5 체크섬으로 변환하는 기능을 구현하기 위해, `util` 패키지를 만들고 `MD5Generator` 클래스
를 아래와 같이 작성합니다.

```java
package kr.kyuhyuk.board.util;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class MD5Generator {
    private String result;

    public MD5Generator(String input) throws UnsupportedEncodingException, NoSuchAlgorithmException {
        MessageDigest mdMD5 = MessageDigest.getInstance("MD5");
        mdMD5.update(input.getBytes("UTF-8"));
        byte[] md5Hash = mdMD5.digest();
        StringBuilder hexMD5hash = new StringBuilder();
        for(byte b : md5Hash) {
            String hexString = String.format("%02x", b);
            hexMD5hash.append(hexString);
        }
        result = hexMD5hash.toString();
    }

    public String toString() {
        return result;
    }
}
```

이제 모든 것이 다 준비되었습니다. `controller` 패키지의 `BoardController` 클래스에 있는 `write()`를
아래와 같이 수정하여, 업로드한 파일을 서버에 저장하고 데이터베이스에 업데이트하게 구현해보겠습니다.

```java
public class BoardController {
    private BoardService boardService;
    private FileService fileService;

    public BoardController(BoardService boardService, FileService fileService) {
        this.boardService = boardService;
        this.fileService = fileService;
    }

    /* ... 소스코드 생략 ... */

    @PostMapping("/post")
    public String write(@RequestParam("file") MultipartFile files, BoardDto boardDto) {
        try {
            String origFilename = files.getOriginalFilename();
            String filename = new MD5Generator(origFilename).toString();
            /* 실행되는 위치의 'files' 폴더에 파일이 저장됩니다. */
            String savePath = System.getProperty("user.dir") + "\\files";
            /* 파일이 저장되는 폴더가 없으면 폴더를 생성합니다. */
            if (!new File(savePath).exists()) {
                try{
                    new File(savePath).mkdir();
                }
                catch(Exception e){
                    e.getStackTrace();
                }
            }
            String filePath = savePath + "\\" + filename;
            files.transferTo(new File(filePath));

            FileDto fileDto = new FileDto();
            fileDto.setOrigFilename(origFilename);
            fileDto.setFilename(filename);
            fileDto.setFilePath(filePath);

            Long fileId = fileService.saveFile(fileDto);
            boardDto.setFileId(fileId);
            boardService.savePost(boardDto);
        } catch(Exception e) {
            e.printStackTrace();
        }
        return "redirect:/";
    }
}
```

서버를 실행하고, 파일을 업로드해봅시다.  
![File Upload](/assets/image/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download_2.png)

MySQL에서 `file` 테이블을 조회해보면, 아래와 같이 업로드한 파일 정보가 기록된 것을 볼 수 있습니다.  
![MySQL file Table](/assets/image/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download_3.png)

위의 `file_path`로 가서 열어보면 업로드한 파일이 제대로 서버에 기록되었음을 확인할 수 있습니다.  
![File Check](/assets/image/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download_4.png)

## 파일 다운로드 구현하기

글을 열람할 때, 첨부파일이 있으면 첨부파일이 표시되도록 수정합니다.  
`src\main\resources\templates\board`에 있는 `detail.html`을 아래와 같이 수정합니다.

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
          <div th:if="${post.fileId != null}">
            <strong>첨부파일 : </strong>
            <a
              class="card-text"
              th:href="@{'/download/' + ${post.fileId}}"
              th:text="${filename}"
            ></a>
          </div>
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

서버를 실행하면, 아래와 같이 첨부파일이 표시되고 URL은 `/download/{fileId}`로 설정됩니다.  
![Post Attachments](/assets/image/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download_5.png)

이제 `/download/{fileId}`에 대해 구현하기 위해 `controller` 패키지에 있는 `BoardController` 클래스에
아래 내용을 추가합니다.

```java
@GetMapping("/download/{fileId}")
public ResponseEntity<Resource> fileDownload(@PathVariable("fileId") Long fileId) throws IOException {
    FileDto fileDto = fileService.getFile(fileId);
    Path path = Paths.get(fileDto.getFilePath());
    Resource resource = new InputStreamResource(Files.newInputStream(path));
    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/octet-stream"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileDto.getOrigFilename() + "\"")
            .body(resource);
}
```

서버를 다시 실행하고, 첨부파일을 클릭해봅시다.  
정상적으로 다운로드 되는 것을 확인할 수 있습니다.  
![Post Attachments Download](/assets/image/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download/2020-07-22-Spring-Boot-JPA-MySQL-Board-Post-File-Upload-Download_6.png)

## 업로드 파일 용량 설정하기

Spring Boot에서 업로드 파일 용량의 기본값은 1MB입니다.  
업로드 파일 용량을 늘리고 싶다면, `spring.servlet.multipart.maxFileSize`와
`spring.servlet.multipart.maxRequestSize`를 `application.properties`에 설정해 주면 됩니다.

예를 들면, 아래와 같이 설정할 수 있습니다.

```
spring.servlet.multipart.maxFileSize=100MB
spring.servlet.multipart.maxRequestSize=100MB
```
