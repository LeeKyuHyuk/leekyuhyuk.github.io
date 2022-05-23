---
title: 'react-error-boundary를 사용하여 오류 처리하기'
date: '2022-05-24 02:46:33'
category: React
---

> 이 글은 [Use react-error-boundary to handle errors in React](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)를 번역했습니다.

아래 코드에는 어떤 문제가 있을까요?

```jsx
import ReactDOM from "react-dom/client";

function Greeting({ subject }) {
  return <div>Hello {subject.toUpperCase()}</div>;
}

function Farewell({ subject }) {
  return <div>Goodbye {subject.toUpperCase()}</div>;
}

function App() {
  return (
    <div>
      <Greeting />
      <Farewell />
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
```

만약 위의 코드를 배포하게 되면, 사용자는 하얀 화면을 보게 될것입니다.  
그리고 콘솔창에 오류가 출력될 것입니다.  
![Error](/assets/image/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React_1.png)

위 코드의 문제는 `subject` Prop를 문자열로 전달하거나 기본값을 설정해야 했습니다. 분명히 이것은 일부러 발생시킨 오류이지만, 런타임 오류는 항상 발생하므로 이러한 오류들을 정상적으로 처리하는 것이 좋습니다.  
우선 이 오류를 그대로 두고 이와 같은 런타임 오류를 처리하기 위해 React가 어떤 해결 방법을 가지고 있는지 살펴봅시다.

# try/catch?

이러한 오류를 처리하는 가장 쉬운 접근 방법은 `try`/`catch`를 추가하는 것 입니다.

```jsx
import ReactDOM from "react-dom/client";

function ErrorFallback({ error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
}

function Greeting({ subject }) {
  try {
    return <div>Hello {subject.toUpperCase()}</div>;
  } catch (error) {
    return <ErrorFallback error={error} />;
  }
}

function Farewell({ subject }) {
  try {
    return <div>Goodbye {subject.toUpperCase()}</div>;
  } catch (error) {
    return <ErrorFallback error={error} />;
  }
}

function App() {
  return (
    <div>
      <Greeting />
      <Farewell />
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
```

이 방법은 **'작동합니다'**!

![try/catch](/assets/image/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React_2.png)

모든 컴포넌트를 `try/catch` 블록으로 감싸고 싶지 않다면 어떻게 해야할까요? JavaScript에서는 단순히 호출 함수를 `try/catch`로 감쌀 수 있으며, 호출하는 함수에서 오류를 포착합니다. 아래와 같이 수정해보겠습니다.

```jsx
import ReactDOM from 'react-dom/client';

function ErrorFallback({ error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  );
}

function Greeting({ subject }) {
  return <div>Hello {subject.toUpperCase()}</div>;
}

function Farewell({ subject }) {
  return <div>Goodbye {subject.toUpperCase()}</div>;
}

function App() {
  try {
    return (
      <div>
        <Greeting />
        <Farewell />
      </div>
    );
  } catch (error) {
    return <ErrorFallback error={error} />;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
```

아쉽게도 이 방법은 작동하지 않습니다. 그 이유는 `Greeting`과 `Farewell`를 호출하는 것이 아니기 때문입니다.

# React Error Boundary

"[Error Boundary](https://reactjs.org/docs/error-boundaries.html)"는 위와 같은 런타임 오류를 처리하기 위해 작성하는 특수한 컴포넌트 입니다.  
컴포넌트가 Error Boundary가 되려면,

1. 클래스 컴포넌트 이어야 합니다🙁
2. `getDerivedStateFromError` 또는 `componentDidCatch`를 구현해야 합니다.

다행이게도, 우리에게는 [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)가 있습니다. 이 라이브러리는 React Application에서 런타임 오류를 선언적으로 처리할 수 있도록 도와줍니다.

[react-error-boundary](https://www.npmjs.com/package/react-error-boundary)를 프로젝트에 추가하고, `ErrorBoundary` 컴포넌트를 렌더링 해보겠습니다.

```jsx
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
}

function Greeting({ subject }) {
  return <div>Hello {subject.toUpperCase()}</div>;
}

function Farewell({ subject }) {
  return <div>Goodbye {subject.toUpperCase()}</div>;
}

function App() {
  return (
    <div>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Greeting />
        <Farewell />
      </ErrorBoundary>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
```

이 방법은 완벽하게 작동합니다!

![react-error-boundary](/assets/image/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React_3.png)

# Error Recovery

위의 방법이 좋은 점은 여러분이 `try/catch` 블록을 수행하는 것과 같은 방식으로 `ErrorBoundary` 컴포넌트를 구성할 수 있다는 점입니다. 다양한 오류를 처리하기 위해 React 컴포넌트를 감싸거나 트리의 특정 부분으로 범위를 좁혀 더 세분화된 오류 처리 또는 복구를 수행할 수 있습니다. [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)는 이 모든 것을 제공합니다.

더 복잡한 예시는 아래와 같습니다:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function Bomb({ username }) {
  if (username === "bomb") {
    throw new Error("💥 CABOOM 💥");
  }
  return `Hi ${username}`;
}

function App() {
  const [username, setUsername] = React.useState("");
  const usernameRef = React.useRef(null);

  return (
    <div>
      <label>
        {`Username (don't type "bomb"): `}
        <input
          placeholder={`type "bomb"`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          ref={usernameRef}
        />
      </label>
      <div>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => {
            setUsername("");
            usernameRef.current.focus();
          }}
          resetKeys={[username]}
        >
          <Bomb username={username} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
```

"bomb"를 입력하면, `Bomb` 컴포넌트가 `ErrorFallback` 컴포 넌트로 대체되며 `username`을 변경하거나 "Try again" 버튼을 클릭해서 복구할 수 있습니다. `resetErrorBoundary`과 오류를 유발하지 않는 사용자 이름으로 State를 재설정하는 `onReset`이 있습니다.

![Error Recovery](/assets/image/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React/2022-05-24-Use-react-error-boundary-to-handle-errors-in-React_4.png)

# Handle all errors

아쉽게도, React가 Error Boundary에 넘길 수 없거나 전달할 수 없는 몇 가지 Error가 있습니다. [React 문서](https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries)를 보면 아래와 같습니다:

> "Error Boundary는 다음에 대한 오류는 포착하지 않습니다"
>
> - 이벤트 핸들러 ([자세히 알아보기](https://reactjs.org/docs/error-boundaries.html#how-about-event-handlers))
> - 비동기 코드 (예: `setTimeout` 또는 `requestAnimationFrame` 콜백)
> - 서버 측 렌더링
> - Error Boundary 자체에서 발생한 오류

대부분의 경우에는 다음과 같이 일부 오류 상태를 관리하고 오류 발생시 다른 것을 렌더링 합니다.

```jsx
function Greeting() {
  const [{ status, greeting, error }, setState] = React.useState({
    status: 'idle',
    greeting: null,
    error: null,
  });

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    setState({ status: 'pending' });
    fetchGreeting(name).then(
      (newGreeting) => setState({ greeting: newGreeting, status: 'resolved' }),
      (newError) => setState({ error: newError, status: 'rejected' })
    );
  }

  return status === 'rejected' ? (
    <ErrorFallback error={error} />
  ) : status === 'resolved' ? (
    <div>{greeting}</div>
  ) : (
    <form onSubmit={handleSubmit}>
      <label>Name</label>
      <input id="name" />
      <button type="submit" onClick={handleClick}>
        get a greeting
      </button>
    </form>
  );
}
```

하지만, 위와 같은 방법을 사용하려면 오류를 처리하는 두 가지 방법을 유지해야 합니다.

1. 런타임 오류
2. `fetchGreeting` 오류

역시나 다행이게도, [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)는 이러한 상황에도 도움이 되는 간단한 Hook을 제공하고 있습니다. 아래와 같이 사용할 수 있습니다.

```jsx
function Greeting() {
  const [{ status, greeting }, setState] = React.useState({
    status: 'idle',
    greeting: null,
  });
  const handleError = useErrorHandler();

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    setState({ status: 'pending' });
    fetchGreeting(name).then(
      (newGreeting) => setState({ greeting: newGreeting, status: 'resolved' }),
      (error) => handleError(error)
    );
  }

  return status === 'resolved' ? (
    <div>{greeting}</div>
  ) : (
    <form onSubmit={handleSubmit}>
      <label>Name</label>
      <input id="name" />
      <button type="submit" onClick={handleClick}>
        get a greeting
      </button>
    </form>
  );
}
```

`fetchGreeting` Promise가 Rejected 되면 `handleError` 함수가 오류와 함께 호출되고, [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)는 가장 가까운 Error Boundary로 전달합니다.

추가로 `error`의 유무를 제공하는 Hook을 사용하고 있다고 가정해 보겠습니다.

```jsx
function Greeting() {
  const [name, setName] = React.useState('');
  const { status, greeting, error } = useGreeting(name);
  useErrorHandler(error);

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    setName(name);
  }

  return status === 'resolved' ? (
    <div>{greeting}</div>
  ) : (
    <form onSubmit={handleSubmit}>
      <label>Name</label>
      <input id="name" />
      <button type="submit" onClick={handleClick}>
        get a greeting
      </button>
    </form>
  );
}
```

이 경우에는 `error`가 `true`가 되면 가장 가까운 Error Boundary로 전달됩니다.

두 경우 모두 다음과 같은 오류를 처리할 수 있습니다.

```jsx
const ui = (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Greeting />
  </ErrorBoundary>
);
```

이제 런타임 오류와 `fetchGreeting` 또는 `useGreeting` 코드의 비동기 오류를 처리할 수 있습니다.

만약, [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)를 사용해 보지 않았다면 지금 한번 사용해 보세요! 강력하게 추천드립니다.
