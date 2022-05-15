---
title: '[Django] 게시판 구현 하기 (1) - 글 작성 & 글 목록 출력'
date: '2020-08-14 15:38:56'
category: Django
---

Django로 게시판을 만들기 전에, 우선 Django 환경을 설정하겠습니다.

# 가상환경 생성하기

Python 가상환경(virtualenv)을 생성한 뒤, Django를 설치할 것입니다.  
가상환경을 사용하면, Python 프로젝트를 진행할 때 독립적인 환경을 만들어 줄 수 있습니다.  
예를 들어, A라는 환경에서 개발할 때와 B라는 환경에서 개발할 때의 Python 및 라이브러리 버전이 다를 수
있습니다. 가상환경을 통하여 독립된 환경을 만들고, Python 및 라이브러리 버전에 대해 걱정을 할 필요가
없게 됩니다.

가상환경을 생성하기 전에, `Board`라는 폴더를 생성합니다.  
우리가 만들 게시판의 소스코드가 저장될 폴더입니다.

```
C:\Users\leekyuhyuk>mkdir Board
C:\Users\leekyuhyuk>cd Board
C:\Users\leekyuhyuk\Board>
```

`python -m venv 가상환경_이름` 명령어로 가상환경을 생성합니다.  
저는 가상환경 이름을 '`venv`'로 지정하였습니다.

```
C:\Users\leekyuhyuk\Board>python -m venv venv
```

`가상환경_이름\Scripts\activate` 명령어로 '`venv`' 가상환경에 진입합니다.

```
C:\Users\leekyuhyuk\Board>venv\Scripts\activate
(venv) C:\Users\leekyuhyuk\Board>
```

위와 같이 `(venv)`(가상환경 이름)이 앞에 출력되면 진입된 것입니다.  
만약, 가상환경에서 벗어나려면 `deactivate` 명령을 실행하면 됩니다.

**위와 같이 '명령 프롬프트'에서 가상환경을 설정하는 방법보다 더 쉬운 방법이 있습니다.**  
**'PyCharm'을 사용하면 간단하게 할 수 있습니다.**

'PyCharm'에서 'New Project'를 클릭합니다.  
![PyCharm - New Project](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_1.png)

'Location'을 `C:\Users\<사용자명>\PycharmProjects\<프로젝트명>`으로 설정하고, 'Create a main.py
welcome script'는 해제합니다.  
'Python Interpreter: New Virtualenv Environment'가 보일 것입니다. 이것을 통하여 위에서 작업한 가상환
경을 간단하게 생성할 수 있습니다.  
![PyCharm - New Project](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_2.png)

프로젝트가 생성되고, 'Terminal'을 클릭하면 아래와 같이 `(venv)`가 앞에 떠 있는것을 볼 수 있습니다.
이것이 의미하는 것은 성공적으로 가상환경 `venv`가 생성되었고, `venv` 가상환경에 진입했다는 것을 말합
니다.  
![PyCharm - Terminal](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_3.png)

# Django 설치하기

가상환경에서 `pip install django`를 실행하여 'Django'를 설치합니다.  
![Django Install](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_4.png)

# 프로젝트 생성하고 Application 구성하기

`django-admin startproject 프로젝트명`으로 프로젝트를 생성합니다.  
`django-admin startproject Board`로 'Board' 프로젝트를 생성하겠습니다.  
프로젝트를 생성하면, 프로젝트명('Board') 폴더가 아래와 같이 생성됩니다.  
![Create Project](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_5.png)

'Board'에 대한 Application을 구성해봅시다. 하나의 프로젝트에는 여러 개의 Application으로 구성됩니다.
우리가 만드는 게시판 프로젝트는 한 개의 Application만 만들어서 진행해보도록 하겠습니다.

`manage.py`가 있는 `Board` 폴더로 이동한 뒤, `python manage.py startapp board_app` 명령어를 통해
'board_app' Application을 만듭니다.  
![Create Application](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_6.png)

Application을 생성했다면, `Board` 폴더에 있는 `settings.py`를 수정해야합니다.  
`INSTALLED_APPS`에 다음과 같이 `board_app`을 추가합니다.

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'board_app',
]
```

만약 또 다른 Application을 생성했다면, `INSTALLED_APPS`에 위와 같이 꼭 추가를 해주어야합니다.

기본적인 프로젝트 설정은 끝났습니다.

# Hello, world!

게시판을 만들기 전에, 'Hello, world!'를 출력해봅시다.

`Board/Board/urls.py`를 아래와 같이 수정하여, ''에 접속했을 때 `board_app` Application의 `urls.py`
파일로 처리를 넘겨주게 합니다.

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('board_app.urls')),
    path('admin/', admin.site.urls),
]
```

`board_app` 폴더에 `urls.py`를 생성하여 아래와 같이 입력합니다.  
특정 URL로 접근하면 화면을 같은 경로에 있는 `views.py`가 처리하여 출력합니다.  
''에 접속하면, `views.index`가 처리를 하는 내용의 코드입니다.

```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index)
]
```

마지막으로 `board_app` 폴더에 있는 `views.py`를 수정해봅시다.  
방금 위에서 ''에 접속하면, `views.index`가 처리한다고 했죠? 그 부분을 구현하는 코드 입니다.

```python
from django.http import HttpResponse

# Create your views here.
def index(request):
    return HttpResponse("Hello, world!")
```

`python manage.py runserver 8080`를 실행하고, [http://127.0.0.1:8080](http://127.0.0.1:8080)에 접속
하여 아래와 같이 'Hello, world!'가 출력되는지 확인해봅시다.  
![Hello, world!](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_7.png)

# Bootstrap 추가하기

본격적으로 게시판을 만들어보겠습니다.  
빠르고 간편하게 게시판을 디자인하기 위해 Bootstrap를 추가해보겠습니다.

[Download Bootstrap v4.5](https://getbootstrap.com/docs/4.5/getting-started/download) 페이지에 접속
하여, 'Compiled CSS and JS'를 다운로드 합니다.  
![Download Bootstrap](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_8.png)

`Board`에 `static` 폴더를 만들고, 아래와 같은 구조로 `static` 폴더에 `bootstrap` 폴더를 넣습니다.

```
Board
├── Board
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── board_app
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── migrations
│   │   └── __init__.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
├── db.sqlite3
├── manage.py
└── static
    └── bootstrap
        ├── css
        │   ├── bootstrap-grid.css
        │   ├── bootstrap-grid.css.map
        │   ├── bootstrap-grid.min.css
        │   ├── bootstrap-grid.min.css.map
        │   ├── bootstrap-reboot.css
        │   ├── bootstrap-reboot.css.map
        │   ├── bootstrap-reboot.min.css
        │   ├── bootstrap-reboot.min.css.map
        │   ├── bootstrap.css
        │   ├── bootstrap.css.map
        │   ├── bootstrap.min.css
        │   └── bootstrap.min.css.map
        └── js
            ├── bootstrap.bundle.js
            ├── bootstrap.bundle.js.map
            ├── bootstrap.bundle.min.js
            ├── bootstrap.bundle.min.js.map
            ├── bootstrap.js
            ├── bootstrap.js.map
            ├── bootstrap.min.js
            └── bootstrap.min.js.map
```

`Board/Board`에 있는 `settings.py`에 `import os`를 추가해주고, 아래와 같이 `STATIC_DIR`와
`STATICFILES_DIRS`를 추가하여 `static` 폴더와 연결합니다.

```python
STATIC_DIR = os.path.join(BASE_DIR, 'static')
STATICFILES_DIRS = [
    STATIC_DIR,
]
```

# HTML Template 사용하기

`Board` 폴더에 `templates` 폴더를 만들고, `list.html` 파일을 아래와 같이 만듭니다.

```html
{% raw %}{% load static %}
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>게시판 - 목록</title>
    <link rel="stylesheet" href="{% static 'bootstrap/css/bootstrap.min.css' %}" />
  </head>
  <body>
    <header>
      <div class="navbar navbar-dark bg-dark shadow-sm mb-3">
        <div class="container d-flex justify-content-between">
          <a href="/" class="navbar-brand d-flex align-items-center">
            <strong>게시판</strong>
          </a>
        </div>
      </div>
    </header>
    <div class="container">
      <table class="table">
        <thead class="thead-light">
          <tr class="text-center">
            <th scope="col">#</th>
            <th scope="col">제목</th>
            <th scope="col">작성자</th>
            <th scope="col">작성일</th>
          </tr>
        </thead>
        <tbody>
          {% for board in boards %}
          <tr class="text-center">
            <th scope="row">
              <span>{{ board.id }}</span>
            </th>
            <td>
              <a href="/post/{{ board.id }}">
                <span>{{ board.title }}</span>
              </a>
            </td>
            <td>
              <span>{{ board.author }}</span>
            </td>
            <td>
              <span>{{ board.created_date | date:"Y-m-d h:i" }}</span>
            </td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
      <div class="row">
        <div class="col-auto mr-auto"></div>
        <div class="col-auto">
          <a class="btn btn-primary" href="/post" role="button">글쓰기</a>
        </div>
      </div>
    </div>
    <script src="{% static 'bootstrap/js/bootstrap.min.js' %}"></script>
  </body>
</html>
{% endraw %}
```

`Board/Board`에 있는 `settings.py`에 `TEMPLATE_DIR`를 추가하여 `templates` 폴더와 연결합니다.

```python
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve(strict=True).parent.parent
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
```

위에서 추가한 `TEMPLATE_DIR` 변수를 `settings.py`의 `TEMPLATES`에 있는 `DIRS`키의 값으로 넣습니다.

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            TEMPLATE_DIR,
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

`views.py`에서 `templates` 폴더 안에 있는 Template 파일을 불러와서 출력해봅시다.  
`board_app` 폴더에 있는 `views.py`에 있는 `index` 함수를 아래와 같이 수정합니다.

```python
from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, 'list.html')
```

`python manage.py runserver 8080`를 실행시켜 아래와 같이 출력되는지 확인해봅시다.  
![Board List Template](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_9.png)

'글쓰기' 버튼을 누르면, `/post`로 이동이 됩니다. 글쓰기 Template도 아래와 같이 작성해봅시다. 파일명
은 `post.html`으로 `templates` 폴더에 저장합니다.

```html
{% raw %}{% load static %}
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>게시판 - 글쓰기</title>
    <link rel="stylesheet" href="{% static 'bootstrap/css/bootstrap.min.css' %}" />
  </head>
  <body>
    <header>
      <div class="navbar navbar-dark bg-dark shadow-sm mb-3">
        <div class="container d-flex justify-content-between">
          <a href="/" class="navbar-brand d-flex align-items-center">
            <strong>게시판</strong>
          </a>
        </div>
      </div>
    </header>
    <div class="container">
      <form action="/post" method="post">
        {% csrf_token %}
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
        <div class="row">
          <div class="col-auto mr-auto"></div>
          <div class="col-auto">
            <input class="btn btn-primary" type="submit" role="button" value="글쓰기" />
          </div>
        </div>
      </form>
    </div>
    <script src="{% static 'bootstrap/js/bootstrap.min.js' %}"></script>
  </body>
</html>
{% endraw %}
```

`board_app`의 `views.py`에 `post()` 함수를 추가합니다.

```python
def post(request):
    return render(request, 'post.html')
```

`board_app`의 `urls.py`에 `path('post', views.post)`를 추가하여 `http://127.0.0.1/post`에 접속되었을
때, `views.py`에 있는 `post()` 함수가 작동하도록 작성합니다.

```python
urlpatterns = [
    path('', views.index),
    path('post', views.post)
]
```

`python manage.py runserver 8080`를 실행시켜 '글쓰기' 버튼을 눌렀을 때 아래와 같이 출력되는지 확인해
봅시다.  
![Board Post Template](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_10.png)

# 게시물 작성 구현하기

이 프로젝트에서는 SQLite를 사용하여, 게시판을 구현해보겠습니다.

각 Application 폴더에 있는 `models.py` 파일은 테이블에 대해 정의하는 파일입니다.  
`board_app`에 있는 `models.py`를 아래와 같이 작성합니다.

```python
from django.db import models

# Create your models here.
class Board(models.Model):
    author = models.CharField(max_length=10, null=False)
    title = models.CharField(max_length=100, null=False)
    content = models.TextField(null=False)
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
```

- `author` : 작성자 이름이 저장되는 필드입니다.
  - 최대 길이를 10으로 제한하였습니다.
  - `null` 값이 저장될 수 없습니다.
- `title` : 글 제목이 저장되는 필드입니다.
  - 최대 길이를 100으로 제한하였습니다.
  - `null` 값이 저장될 수 없습니다.
- `content` : 내용이 저장되는 필드입니다.
  - 앞의 `author`, `title`과 다르게
    [`TextField`](https://docs.djangoproject.com/en/3.1/ref/models/fields/#django.db.models.TextField)로
    되어있어 많은 Text를 써넣을 수 있습니다.
  - `null` 값이 저장될 수 없습니다.
- `created_date` : 게시물이 생성된 시간이 저장되는 필드입니다.
  ([`auto_now_add=True`](https://docs.djangoproject.com/en/3.1/ref/models/fields/#django.db.models.DateField.auto_now_add))
- `modified_date` : 게시물이 수정된 시간이 저장되는 필드입니다.
  ([`auto_now=True`](https://docs.djangoproject.com/en/3.1/ref/models/fields/#django.db.models.DateField.auto_now))

`models.py`를 수정했으면, Django 서버에 적용해 줘야 합니다.  
`manage.py` 파일이 있는 위치에서 `python manage.py makemigrations` 명령을 실행합니다.  
![makemigrations](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_11.png)

위의 명령어는 'Migration'을 하는 명령어입니다. 'Migration'은 데이터베이스에 전달할 설계도 같은 역할
을 합니다.  
실제로 테이블을 만들려면 `python manage.py migrate` 명령을 실행해야 합니다.  
![migrate](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_12.png)

제대로 테이블이 생성되었는지 확인하기 위해 `python manage.py dbshell` 명령어를 통하여 데이터베이스에
접근합니다. 그리고 `.tables` 명령어로 데이터베이스에 있는 테이블들을 조회해봅시다.  
![Database Tables](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_13.png)

'board*app_board'라는 테이블이 존재한다면, 성공적으로 테이블이 생성된 것입니다.  
데이터베이스에 생성되는 테이블의 이름은 '[프로젝트 이름]*[모델 이름]' 규칙으로 생성됩니다.  
'board_app_board'는 'board_app' 프로젝트에 있는 'board' 모델의 테이블이라고 해석하면 됩니다.

`PRAGMA table_info(board_app_board);` 명령어로 우리가 설정한 필드들이 잘 설정되었는지 확인해봅시다
.  
![Table Info](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_14.png)

위와 같이 출력되는데 아래와 같이 해석하면 됩니다.

```
순서 | 이름 | 형태 | notnull 여부 | pk 여부
```

이 순서로 보면 우리가 설정한 필드들이 잘 설정되었다는 걸 확인할 수 있습니다.

이제 테이블을 생성했으니, 데이터를 넣어봅시다.  
`post.html`을 보면 아래와 같이 되어있습니다.

```html
{% raw %}
<div class="container">
  <form action="/post" method="post">
    {% csrf_token %}
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
    <div class="row">
      <div class="col-auto mr-auto"></div>
      <div class="col-auto">
        <input class="btn btn-primary" type="submit" role="button" value="글쓰기" />
      </div>
    </div>
  </form>
</div>
{% endraw %}
```

`<form>` 태그를 보면, 아래의 `/post`로 POST 방식을 통하여 `<input>`에 있는 내용을 전달하게 되어있습
니다.  
우리는 `views.py`에서 아까 만든 `post()` 함수를 수정해 주면 됩니다.

```python
from django.http import HttpResponseRedirect
from django.shortcuts import render
from .models import *

# Create your views here.
def index(request):
    return render(request, 'list.html')

def post(request):
    if request.method == "POST":
        author = request.POST['author']
        title = request.POST['title']
        content = request.POST['content']
        board = Board(author=author, title=title, content=content)
        board.save()
        return HttpResponseRedirect('/')
    else:
        return render(request, 'post.html')
```

`post()` 함수에 'POST' 요청이 들어오면 실행할 코드를 넣어주었습니다.  
`request.POST[]`에는 `<input>`에 있는 `name` 속성의 값을 넣어, 변수에 입력한 내용의 값이 저장되도록
하였습니다.  
`python manage.py runserver 8080`를 실행시켜 '글쓰기' 버튼을 눌러 글을 하나 작성해봅시다. 테이블에데
이터가 생성되었는지 확인하기 위해 `python manage.py dbshell` 명령어를 통하여 데이터베이스에 접근합니
다. 그리고, `SELECT * FROM board_app_board;` 명령어로 `board_app_board`의 내용을 확인합니다. 아래와
같이 잘 저장된 것을 확인할 수 있습니다.  
![Database Check](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_15.png)

그런데 이상한 점이 있습니다. `created_date`와 `modified_date` 필드의 시간이 컴퓨터 시간과 다르게 저
장되어 있습니다.  
그 이유는 `Board` 폴더에 있는 `settings.py`의 `TIME_ZONE`가 `UTC`로 설정되어 있어서 그렇습니다.
`TIME_ZONE`를 `Asia/Seoul`로 변경하고, `USE_TZ`를 `False`로 변경하여 다시 글을 써봅시다.  
아래와 같이 시간이 제대로 적용되어 저장되는 걸 확인할 수 있습니다.  
![Database Check](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_16.png)

`post()` 함수를 보면 `HttpResponseRedirect()` 함수를 사용하여, 글 작성이 완료되면 다시 메인 페이지의
URL로 돌아가게 해주고 있습니다.  
지금은 `HttpResponseRedirect('/')`와 같이 URL을 직접 입력하고 있습니다. 더 쉬운 방법으로 접근하기 위
해 `urls.py`를 아래와 같이 수정합니다.

```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('post', views.post, name='post')
]
```

위의 코드를 보면 `name`을 추가하였습니다. 이제 URL 대신 `name`을 이용하여 접근할 수 있습니다.  
`views.py`의 `HttpResponseRedirect('/')`를 `HttpResponseRedirect(reverse('index'))`로 수정합니다.

```python
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import *

# Create your views here.
def index(request):
    return render(request, 'list.html')

def post(request):
    if request.method == "POST":
        author = request.POST['author']
        title = request.POST['title']
        content = request.POST['content']
        board = Board(author=author, title=title, content=content)
        board.save()
        return HttpResponseRedirect(reverse('index'))
    else:
        return render(request, 'post.html')
```

# 게시물 목록 구현하기

위의 과정을 통해 게시물이 SQLite에 저장되는 것을 확인하였습니다.  
이제 저장된 데이터를 목록에 출력하는 것을 구현해보겠습니다.

`board_app`에 있는 `views.py`의 `index()`를 아래와 같이 수정합니다.

```python
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import *

# Create your views here.
def index(request):
    boards = {'boards': Board.objects.all()}
    return render(request, 'list.html', boards)

def post(request):
    if request.method == "POST":
        author = request.POST['author']
        title = request.POST['title']
        content = request.POST['content']
        board = Board(author=author, title=title, content=content)
        board.save()
        return HttpResponseRedirect(reverse('index'))
    else:
        return render(request, 'post.html')
```

위에 코드를 보면, `Board` 모델에 접근하고, `objects`에 접근한 후에 `all()` 함수를 통해 모든 데이터를
가져와 `boards` 딕셔너리의 `boards` 키에 할당합니다.  
그리고 `boards` 딕셔너리를 `render()` 함수를 통해 전달합니다.  
이렇게 전달한 데이터는 `list.html`에서 받아 출력하게 되는데, 출력하는 부분은 아래와 같습니다.

```html
{% raw %}{% for board in boards %}
<tr class="text-center">
  <th scope="row">
    <span>{{ board.id }}</span>
  </th>
  <td>
    <a href="/post/{{ board.id }}">
      <span>{{ board.title }}</span>
    </a>
  </td>
  <td>
    <span>{{ board.author }}</span>
  </td>
  <td>
    <span>{{ board.created_date | date:"Y-m-d h:i" }}</span>
  </td>
</tr>
{% endfor %}{% endraw %}
```

`{% raw %}{% for board in boards %}{% endraw %}`를 통해 `boards` 키의 요소를 `board` 변수로 가져옵니
다. (Python에서 사용한 `for` 반복문과 같습니다.)  
그리고 `{% raw %}{{ board.id }}{% endraw %}`, `{% raw %}{{ board.title }}{% endraw %}`,
`{% raw %}{{ board.author }}{% endraw %}`로 `board` 변수에서 `id`, `title`, `author` 값에 접근하여출
력합니다.

> `{% raw %}{{ board.created_date | date:"Y-m-d h:i" }}{% endraw %}`은 `datetime` 타입의 데이터
> (`created_date`)를 `date:"Y-m-d h:i"` 형식에 맞추어 출력해 줍니다.  
> [https://docs.djangoproject.com/en/3.1/ref/templates/builtins/#date](https://docs.djangoproject.com/en/3.1/ref/templates/builtins/#date)를
> 참고해주세요.

`python manage.py runserver 8080`를 실행시켜 아래와 같이 목록이 잘 출력되는지 확인합니다.  
![Board List](/assets/image/2020-08-14-Django-Board-Write-Post/2020-08-14-Django-Board-Write-Post_17.png)

**Source Code :**
[github.com/LeeKyuHyuk/Django-Board-Example](https://github.com/LeeKyuHyuk/Django-Board-Example/tree/ac52195cc570091d601904a09c444548e58eac66)
