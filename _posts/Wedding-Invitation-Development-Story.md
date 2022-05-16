---
title: 'React를 사용한 나만의 모바일 청첩장 개발 후기'
date: '2021-10-01 23:29:24'
category: Ordinary-Life
---

올가을에 결혼을 하게 되는데, 다른 건 몰라도 모바일 청첩장 만큼은 직접 만들어서 지인들에게 나눠주고싶었습니다.

아직 React를 접한지 몇 개월 안됐지만, '시작하면 어떻게 해서든 만들겠지!'라고 생각하고 만들기 시작했습니다.

# 요구사항

- 처음 보이는 화면에 동영상을 넣고 싶었습니다. 웨딩 촬영 중에 예쁘게 찍힌 동영상이 있어 꼭 넣고 싶었습니다.
- 모바일 청첩장의 배경은 종이 느낌이 나게 만들고 싶었습니다.
  - 검색해보니 [https://www.transparenttextures.com](https://www.transparenttextures.com/)에 많은 종이 텍스처가 있었습니다.
- 계좌번호를 클릭하면, 클립보드에 저장되어 간편하게 송금할 수 있게 만들고 싶었습니다.
- 쉽게 카카오톡 또는 링크로 공유할 수 있도록 만들고 싶었습니다.

# 결과물

<video style="width: 100%; max-width: 374px;" src="/assets/video/2021-10-01-Wedding-Invitation-Development-Story/2021-10-01-Wedding-Invitation-Development-Story.mp4" controls></video>

React, Ant Design Comment, Styled-Components를 사용하여 만들었습니다.

사진을 보여주는 기능은 [react-image-gallery](https://www.npmjs.com/package/react-image-gallery)를 사용하였으며, 계좌번호 및 링크 복사 기능은 [react-copy-to-clipboard](https://www.npmjs.com/package/react-copy-to-clipboard)를 사용하여 구현하였습니다.

카카오톡 공유 기능은 카카오톡에서 제공하는 [카카오링크](https://developers.kakao.com/docs/latest/ko/message/js-link)를 사용했으며, Github Pages 로 Hosting하여 사람들에게 공유했습니다.

구현은 어렵지 않았습니다... 하지만...!

# 힘들었던 부분

- 스마트폰에 기본으로 있는 브라우저(Safari 또는 Chrome)로 테스트했을 때는 문제가 없었습니다.  
  하지만, 카카오톡에서 링크를 클릭하면 열리는 WebView로 볼 경우 하단 바(뒤로 가기, 새로 고침 등등)가스크롤을 아래로 내리면 사라지고, 위로 올리면 생기면서 첫 화면에 있는 동영상 배경의 크기가 계속 바뀌게 되었습니다.  
  열심히 찾아보니 제가 동영상 배경의 높이를 `100vh`로 주어서 생긴 문제였습니다. 이 부분은 높이를 `height: ${window.innerHeight}px;`로 변경하여 중간에 화면의 크기가 하단 바로 인해 변경되더라도 동영상 배경의 크기가 바뀌지 않도록 수정하였습니다.

- 동영상 배경이 3MB인데도 불구하고 동영상 배경의 로딩이 매우 느렸습니다.  
  'Chrome 개발자 모드'에서 확인해 보니 동영상 배경에서 사용되는 동영상이 먼저 로드되는 게 아닌, 사진부분에서 사용하는 사진이 먼저 로드 되어 생기는 문제였습니다. 이 부분은 `preload`와 `React.lazy`를사용하여 해결하였습니다.

- Github Pages의 속도가 생각보다 빠르지가 않아서 사진과 영상의 파일 사이즈를 적정선으로 줄이는데 노력을 많이 했습니다.  
  다행이게도 'Chrome 개발자 모드'에서 Cache를 비활성화하는 옵션도 있고, 인터넷 속도를 3G에서 접속하는 속도로 테스트할 수 있는 옵션도 있어 여러 가지 테스트를 해 볼 수 있었습니다.  
  ![Chrome 개발자 모드](/assets/image/2021-10-01-Wedding-Invitation-Development-Story/2021-10-01-Wedding-Invitation-Development-Story.png)

# 마치며

만들 시간도 별로 없었고 빨리빨리 만들다 보니, 결과물이 100% 만족스럽지는 않았습니다.  
기회가 된다면 사진을 보여주는 부분은 외부 라이브러리를 사용하지 않고 제가 직접 만들어 보고 싶습니다.

하지만, 좋은 경험이 된 거 같아 매우 뿌듯했습니다😀 만약 주변에 제 지인이 결혼하게 되면, 용기 있게 ' 혹시, 내가 모바일 청첩장 만들어줘도 될까!?'라고 말을 건넬 수 있을 거 같습니다.

긴 글 읽어주셔서 감사합니다!😀
