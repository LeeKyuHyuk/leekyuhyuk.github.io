---
title: '[Django] 게시판 구현 하기 (2) - 글 조회'
date: '2020-08-15 17:22:10'
category: Django
---

이번 시간에는 [이전 글](https://kyuhyuk.kr/article/python/2020/08/14/Django-Board-Write-Post)에서 만든 게시글 목록을 클릭하면, 글을 조회하는 기능을 추가해보도록 하겠습니다.

글을 조회하면 보여지는 Template을 만들어 보겠습니다.  
아래 내용을 `templates` 폴더의 `detail.html` 파일명으로 저장합니다.

```html
{% raw %}{% load static %}
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>게시판 - {{ board.title }}</title>
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
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">{{ board.title }} - {{ board.author }}</h5>
          <p class="card-text">
            <small class="text-muted">{{ board.created_date | date:"Y-m-d h:i" }}</small>
          </p>
          <p class="card-text">{{ board.content }}</p>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-auto mr-auto"></div>
        <div class="col-auto">
          <a class="btn btn-info" href="/post/edit/{{ board.id }}" role="button">수정</a>
        </div>
        <div class="col-auto">
          <form id="delete-form" action="/post/delete/{{ board.id }}" method="post">
            <input type="hidden" name="_method" value="delete" />
            <button id="delete-btn" type="submit" class="btn btn-danger">삭제</button>
          </form>
        </div>
      </div>
    </div>
    <script src="{% static 'bootstrap/js/bootstrap.min.js' %}"></script>
  </body>
</html>
{% endraw %}
```

글 목록에서 글을 클릭하면, 'http://127.0.0.1:8080/post/1'와 같이 `post/{id}`로 이동하는 것을 볼 수있습니다.  
`board_app` 폴더에 있는 `urls.py`를 아래와 같이 수정합니다.

```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('post', views.post, name='post'),
    path('post/<int:id>', views.detail, name='detail')
]
```

`urls.py`에 `views.detail`를 추가했으니, `views.py` 파일에 `detail()` 함수를 아래와 같이 추가합니다.

```python
from django.http import HttpResponseRedirect, Http404
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

def detail(request, id):
    try:
        board = Board.objects.get(pk=id)
    except Board.DoesNotExist:
        raise Http404("Does not exist!")
    return render(request, 'detail.html', {'board': board})
```

`Board` 모델에 접근하고, `objects`에 접근한 후에 `get()` 함수를 통해 Primary Key가 `id`인 데이터를가져와 `board` 변수에 저장합니다.  
그리고 `board` 키에 `board` 변수를 할당한 딕셔너리를 `render()` 함수를 통해 전달합니다.

이렇게 전달한 데이터는 `detail.html`에서 받아 출력하게 되는데, 출력하는 부분은 아래와 같습니다.

```html
{% raw %}
<div class="card">
  <div class="card-body">
    <h5 class="card-title">{{ board.title }} - {{ board.author }}</h5>
    <p class="card-text">
      <small class="text-muted">{{ board.created_date | date:"Y-m-d h:i" }}</small>
    </p>
    <p class="card-text">{{ board.content }}</p>
  </div>
</div>
{% endraw %}
```

`python manage.py runserver 8080`를 실행시켜 아래와 같이 글이 잘 출력되는지 확인합니다.  
![Detail View](/assets/image/2020-08-15-Django-Board-Post-View/2020-08-15-Django-Board-Post-View_1.png)

**Source Code :** [github.com/LeeKyuHyuk/Django-Board-Example](https://github.com/LeeKyuHyuk/Django-Board-Example/tree/043ce77511d3f004f24f27c2a101cd85993e7093)
