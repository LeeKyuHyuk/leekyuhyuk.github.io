---
title: 'Frontend Clean Code! 더 깔끔하고 더 나은 코드를 작성하는 방법!'
date: '2021-12-09 21:52:16'
category: React
---

'토스 개발자 컨퍼런스'인 SLASH 21에서 'Frontend Developer 진유림'님이 발표하신
['실무에서 바로 쓰는 Frontend Clean Code'](https://toss.im/slash-21/sessions/3-3)를 듣고 정리한 글입
니다.  
이 글에서는 발표를 듣고 이해한 내용을 간단하게 정리만 하였습니다.

우선, **클린 코드**라 하면 대다수의 사람들은 '명확한 이름'과 '중복 줄이기'라고 생각하겠지만 실무에서
는 이것 말고도 더 섬세하게 코드를 정리하는 것을 말합니다.  
Frontend에서 읽기 좋은 코드를 짜기 위해 염두 해야 하는 개념을 소개하도록 하겠습니다.

# 클린 코드란 무엇일까?

'흐름 파악이 어렵고 도메인 맥락 표현이 안되어 동료에게 물어봐야 알 수 있는 코드'는 개발할 때 병목의
원인이 되고 유지 보수를 어렵게 만듭니다. 심하면 기능 추가가 불가능한 상태가 되기도 합니다.  
**클린 코드**는 유지 보수 시간을 단축시킬 수 있는 코드라고 할 수 있습니다. 동료, 혹은 과거의 내가 작
성한 코드를 금방 이해할 수 있다면 유지 보수로 인한 개발 시간이 짧아지게 됩니다.  
읽기 좋은 코드는 코드 리뷰의 시간도 단축시키며, 버그가 발생하였을때 디버깅 시간도 단축시킵니다.

# 처음부터 클린 코드가 아니었던 것은 아닙니다!

처음부터 클린 코드가 아니었을까요? 아닙니다. 코드를 처음 설계하고 작성했을 때는 클린 코드였을 것입니
다. 하지만, 기존 코드에 기능을 추가하면서 점점 클린 코드와 거리가 멀어지게 되는 경우가 많아집니다.

아래와 같이 기존에는 버그 제보를 하면 완료 창만 출력되었던 것을, 이미 유사한 버그가 제보되었으면 버
그가 이미 수정 중이라는 창을 먼저 보여주고 그다음에 기존의 완료창을 띄워주는 기능을 추가해야 한다고
생각해 봅시다.

![예시](/assets/image/2021-12-09-Frontend-Clean-Code/2021-12-09-Frontend-Clean-Code_1.png)

기존의 코드가 아래와 같다고 가정해 봅시다.

```typescript
function BugReportPage() {
  async function handleBugReportSubmit() {
    await 버그_제보_전송(bugReportValue);
    alert('버그 제보 완료!');
  }

  return (
    <form>
      <textarea placeholder="어떤 버그가 발생했나요?" />
      <button onClick={handleBugReportSubmit}>제출하기</button>
    </form>
  );
}
```

사용자가 버그에 대해 작성하고 '제출하기' 버튼을 누르면 작성한 내용을 전송하고 성공했다는 알림 창을출
력해 주는 코드입니다.

이 코드에 해당 기능을 추가하려면,

1. `handleBugReportSubmit()`에 이미 유사한 버그가 제보되었으면 팝업을 띄우는 로직을 추가해야 합니다.
2. 팝업 컴포넌트를 추가해야 합니다.

위에서 생각한 설계대로 코드를 작성해 보았습니다.

```typescript
function BugReportPage() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  async function handleBugReportSubmit() {
    const 유사한_버그 = await 유사한_버그_받아오기();
    if (유사한_버그 !== null) {
      setIsPopupVisible(true);
    } else {
      await 버그_제보_전송(bugReportValue);
      alert('버그 제보가 완료되었습니다.');
    }
  }

  async function handleMyAnotherBugReportSubmit() {
    await 비슷하지만_새로운_버그_제보_전송(bugReportValue, 유사한버그.id);
    alert('버그 제보가 완료되었습니다.');
  }

  return (
    <>
      <form>
        <textarea placeholder="어떤 버그가 발생했나요?" />
        <button onClick={handleBugReportSubmit}>제출하기</button>
      </form>
      {isPopupVisible && <유사한버그팝업 onSubmit={handleMyAnotherBugReportSubmit} />}
    </>
  );
}
```

팝업이 열려있는지에 대한 State를 추가하고, 기존에 있던 `handleBugReportSubmit()`에 유사한 버그가 있
는지 확인하는 조건문을 추가했습니다.  
팝업에서 확인 눌렀을 때 호출할 `handleMyAnotherBugReportSubmit()`도 만들고 팝업 컴포넌트도 추가하였
습니다.

**이 코드가 좋은 방법으로 추가된 것일까요?** 사실은 아닙니다.  
원래는 하나의 목적을 가지고 있었던 코드였지만, 지금은 여러 가지가 섞여있는 코드가 되어버렸습니다.

```typescript
function BugReportPage() {
  const [isPopupVisible, setIsPopupVisible] = useState(false); /* 유사한 버그 팝업 관련 코드 */

  async function handleBugReportSubmit() {
    const 유사한_버그 = await 유사한_버그_받아오기(); /* 유사한 버그 팝업 관련 코드 */
    if (유사한_버그 !== null) {
      /* 유사한 버그 팝업 관련 코드 */
      setIsPopupVisible(true);
    } else {
      await 버그_제보_전송(bugReportValue);
      alert('버그 제보가 완료되었습니다.');
    }
  }

  async function handleMyAnotherBugReportSubmit() {
    /* 유사한 버그 팝업 관련 코드 */
    await 비슷하지만_새로운_버그_제보_전송(
      bugReportValue,
      유사한버그.id
    ); /* 유사한 버그 팝업 관련 코드 */
    alert('버그 제보가 완료되었습니다.'); /* 유사한 버그 팝업 관련 코드 */
  }

  return (
    <>
      <form>
        <textarea placeholder="어떤 버그가 발생했나요?" />
        <button onClick={handleBugReportSubmit}>제출하기</button>
      </form>
      {isPopupVisible /* 유사한 버그 팝업 관련 코드 */ && (
        <유사한버그팝업
          onSubmit={handleMyAnotherBugReportSubmit}
        /> /* 유사한 버그 팝업 관련 코드 */
      )}
    </>
  );
}
```

위 코드에서 `/* 유사한 버그 팝업 관련 코드 */`라고 써놓은 줄 모두 유사한 버그 팝업과 관련된 코드입니
다.  
이것들이 서로 떨어져 있기 때문에 나중에 기능을 추가할 때, 소스코드를 위아래로 살펴보면서 추가를 해야
합니다.

또한, `handleBugReportSubmit()`를 보면 하나의 함수가 여러 가지 일을 하고 있습니다.  
이런 경우에는 세부 구현을 모두 읽어야 함수의 역할을 파악할 수 있게됩니다. 이로 인해 코드의 추가 및삭
제 또한 시간이 더 소요됩니다.

함수의 세부 구현 단계가 제각각인 것도 문제입니다.  
`handleBugReportSubmit()`와 `handleMyAnotherBugReportSubmit()` 모두 이벤트 핸들링으로 사용되는 함수
인데, 이름이 서로 비슷합니다.  
하지만 `handleBugReportSubmit()`은 버그 레포트를 전송하는 것 외에도 여러 가지 일을 하고 있어서 코드
를 읽기가 힘듭니다. 이런 경우에는 코드를 대충 이해하게 되는 일도 발생하게 됩니다.

전에는 깔끔했던 코드가 기능 하나를 추가했더니 좋지 않은 코드가 되어버렸습니다.  
여기서 중요한 점은 누군가 이 코드를 PR(Pull Request)를 올려도 **코드의 전체가 아닌, 변경점만 본다면
이 코드가 좋지 않은 코드라는 것을 파악하기는 어려울 것**입니다.

# 어떻게 수정해야 할까요?

먼저 함수의 세부 구현 단계를 통일합니다.

```typescript
function BugReportPage() {
  const 유사한_버그 = useFetch(유사한_버그_받아오기);

  async function handleNewBugReportSubmit() {
    await 버그_제보_전송(bugReportValue);
    alert('버그 제보가 완료되었습니다.');
  }

  async function handleSimilarBugReportSubmit() {
    await 비슷하지만_새로운_버그_제보_전송(bugReportValue, 유사한버그.id);
    alert('버그 제보가 완료되었습니다.');
  }

  return (
    <form>
      <textarea placeholder="어떤 버그가 발생했나요?" />

      {유사한_버그.connected ? (
        <PopupTriggerButton popup={<유사한버그팝업 onSubmit={handleSimilarBugReportSubmit} />}>
          제출하기
        </PopupTriggerButton>
      ) : (
        <Button onClick={handleNewBugReportSubmit}>제출하기</Button>
      )}
    </form>
  );
}
```

기존 함수의 이름을 명확하게 변경하였습니다. `handleNewBugReportSubmit()`는 새로운 버그를 제보하는 로
직만, `handleSimilarBugReportSubmit()`는 비슷한 버그가 있을 때 비슷한 버그와 함께 제보하는 로직만 넣
었습니다.  
또한 팝업 관련 코드를 하나로 뭉쳤습니다. 이전 코드는 팝업을 여는 버튼과 팝업 코드가 떨어져 있었는데,
이것들을 모아서 `PopupTriggerButton`라는 컴포넌트를 만들었습니다. 출력할 팝업은 props로 내려줍니다.

코드가 첫 번째 버전보다 길어진 것이 보입니다. 하지만 클린 코드는 짧은 코드가 아닌, **원하는 로직을빠
르게 찾을 수 있는 코드**를 말합니다.

# 원하는 로직을 빠르게 찾으려면?

1. 하나의 목적을 가진 코드가 흩뿌려져 있을 때는, **응집도**를 높여서 뭉쳐두어야 합니다.
2. 함수가 여러 가지 일을 하고 있을 때는, **한 가지 일만 하도록** 쪼개줘야 합니다.
3. 함수의 세부 구현 단계가 제각각일 때는, **추상화** 단계를 조정해서 핵심 개념을 필요한 만큼만 노출
   해야 합니다.

---

일단 (1)에 대한 설명을 해보겠습니다. **응집도**는 같은 목적인 코드를 모아놓는다는 뜻입니다.

```typescript
function BugReportPage() {
  const [isPopupVisible, setIsPopupVisible] = useState(false); /* 팝업을 조작하는 코드 */

  /* 팝업을 조작하는 코드 */
  function handleClick() {
    setIsPopupVisible(true);
  }

  async function handlePopupSubmit() {
    await 비슷하지만_새로운_버그_제보_전송(bugReportValue, 유사한버그.id);
    alert('버그 제보가 완료되었습니다.');
  }

  return (
    <>
      <button onClick={handleClick}>제출하기</button>
      {/* 팝업을 조작하는 코드 */}
      <Popup title="같은 버그 제보가 있어 해결중이에요!" open={isPopupVisible}>
        <div>혹시 아래의 문제 인가요?</div>
        <button onClick={handlePopupSubmit}>확인</button>
      </Popup>
    </>
  );
}
```

위의 코드를 보면 팝업을 조작하는 코드가 세 군데로 떨어져 있습니다. 파악도 한 번에 안되고 버그 발생위
험도 높은 코드입니다.

```typescript
function BugReportPage() {
  const [openPopup] = useBugReportPopup(유사한버그.id);

  function handleClick() {
    openPopup();
  }

  return <button onClick={handleClick}>제출하기</button>;
}
```

Custom Hook을 사용하여 한 군데로 뭉쳐보았습니다. 이제 `openPopup()`을 호출하면 팝업을 열 수 있게 되
었습니다.  
하지만 다시 자세히 보면 오히려 더 읽기 힘든 코드가 되었습니다. 어떤 내용의 팝업을 출력하는지 팝업에
서 버튼을 눌렀을 때 어떤 동작을 하는지가 `BugReportPage`에서 제일 중요한 부분인데, 이 모든게 Hook 속
에 가려져서 알 수 없게 되었습니다.

당장 몰라도 되는 디테일은 뭉치는 게 좋습니다. 이것들을 숨겨둔다면 짧은 코드만 보고도 빠르게 코드의목
적을 파악하는 게 쉬워집니다. 반대로 코드 파악에 필수적인 핵심 정보를 분리해놓으면 여러 모듈을 넘나들
며 흐름을 따라가야 하는 일이 발생하게 됩니다. **무조건 뭉쳐서 짧은 코드를 만든다고 좋은 코드가 아니
라는 것을 항상 기억해야 합니다.** 찾고 싶은 로직을 빠르게 찾을 수 있게 코드를 작성해야 합니다.

우선, 남겨야 할 핵심 데이터와 숨겨도 될 세부 구현을 나눕니다. 위의 예제를 다시 보면 팝업 버튼 클릭시
동작하는 함수와 팝업의 제목과 내용이 핵심 데이터입니다. 세부 구현은 팝업을 열고 닫을 때 사용하는상태
와 컴포넌트의 세부적인 마크업, 팝업의 버튼 클릭 시 특정 함수를 호출을 바인딩 하는 부분이 있습니다.

이렇게 핵심 데이터만 남기고 세부 구현을 숨기면 파악하기 쉬운 코드가 됩니다.

```typescript
function BugReportPage() {
  const [openPopup] = usePopup();

  async function handleClick() {
    const confirmed = await openPopup({
      title: '같은 버그 제보가 있어 해결중이에요!',
      contents: <div>혹시 아래의 문제 인가요?</div>,
    });
    if (confirmed) await submitBugReport();
  }

  async function submitBugReport() {
    await 비슷하지만_새로운_버그_제보_전송(bugReportValue, 유사한버그.id);
    alert('버그 제보가 완료되었습니다.');
  }

  return <button onClick={handleClick}>제출하기</button>;
}
```

`openPopup`이라는 Custom Hook에 모든 코드를 다 숨기지 않고, 세부 구현만 숨기고 핵심 데이터(팝업 제목
, 내용, 동작)을 밖에서 넘기는 방식으로 작성하는 것입니다. 이렇게 하면 세부 구현을 읽지 않고도 어떤팝
업인지 파악할 수 있습니다.

**선언적 프로그래밍 :** 핵심 데이터만 전달받고, 세부 구현은 뭉쳐 숨겨 두는 개발 스타일을 말합니다. '
무엇'을 하는 함수인지 **빠르게 이해**할 수 있습니다. 세부 구현은 안쪽에 뭉쳐두어서 신경 쓸 필요가 없
습니다. 그리고 '무엇'만 바꾸면 쉽게 **재사용**이 가능합니다.

---

이어서 (2)에 대한 설명을 해보겠습니다. 클린 코드에서 중요한 요소 중에 하나는, **하나의 일을 하는 명
확한 이름의 함수**를 만들어야 한다는 것입니다.  
명확한 이름의 함수는 어떻게 만들 수 있을까요? 간단합니다.  
**함수명에는 중요 포인트(함수에서 작동하는 작업에 대한 포인트)가 모두 담겨 있어야 합니다.**  
만약 이와 같이 함수의 이름을 정하지 않는다면 같이 일하는 동료가 함수명만 보고 사용했다가 의도한 대로
동작하지 않는 것을 경험할수있으며, 그로 인해 코드에 대한 신뢰도가 낮아질 수 있습니다.

어떤 함수에 기능이 추가된다면 더 복잡해집니다. 하나의 함수에서 여러 가지 일을 하게 되기 때문입니다
.  
이러한 기능 추가가 계속 반복되면 코드가 복잡해지게 될 것입니다.  
클린 코드를 유지하려면, **한 가지 일만 하는 명확한 이름의 함수를 선언하여 사용**해야 합니다.

예를 들어, React에서는 컴포넌트로 나누어 관리하는 것도 좋은 방법입니다.

---

마지막으로 (3)에 대한 설명을 해보겠습니다. **추상화**는 로직에서 핵심 개념을 뽑아내는 것이라고 생각
하시면 됩니다.  
코드를 모두 디테일하게 구현하는 것보다, 중요한 개념만 남기고 나머지는 추상화하는 방식입니다.

```typescript
<div style={팝업스타일}>
  <button
    onClick={async () => {
      const response = await 로그인();
      if (response.success) 내_정보_화면으로_이동();
    }}
  >
    제출
  </button>
</div>
```

```typescript
<Popup>
  onSubmit={로그인}
  onSuccess={내_정보_화면으로_이동}
/>
```

위의 두 개의 코드 중에 어느 것이 더 이해하기 편한가요? 중요한 개념만 남기고 나머지는 추상화 한 아래
의 코드가 더 눈에 잘 들어오고 이해도 잘 될 것입니다.

얼마나 추상화할 것인지는 상황에 따라서 필요한 만큼 하면 됩니다.  
**단, 한 레벨의 코드 안에 추상화 수준이 섞여있으면 코드 파악이 어렵기 때문에 추상화 단계를 비슷하게
정리하여 추상화 수준이 높은 것끼리, 낮은 것끼리 모아 정리하는 게 좋습니다.**

# 클린 코드, 이렇게 도전해 보세요!

1. **기존의 코드**를 두려워하지 말고 위의 내용을 토대로 **수정**해 봅니다.
2. **큰 그림 보는 연습**을 자주 해봅니다. 기능 추가로만 보면 클린 코드로 보일지 몰라도, 전체적으로보
   면 엉망인 코드가 될 수 있습니다.
3. **팀원들과 공감대를 형성**해야 합니다. 코드에 정답은 없기 때문에 함께 만들어온 코드에서 고치고 싶
   은 포인트를 서로 말해보고, 각자 문제라고 생각하는 지점을 공유한 뒤 어떻게 개선할지 고민하는 것입
   니다.
4. **문서화**를 해야 합니다. 명확하게 문서로 남겨 '향후 어떤 점에서 위험할 수 있는지', '어떻게 개선
   할 수 있는지'에 대해 작성해 봅시다.
