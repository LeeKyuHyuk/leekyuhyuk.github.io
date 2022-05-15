---
title: '[React] Context를 사용하여 더 효율적으로 작업해보기'
date: '2021-07-22 00:49:09'
category: React
---

아래와 같은 UI가 있다고 가정해봅시다.  
![Example UI](/assets/image/2021-07-23-React-Context-API/2021-07-23-React-Context-API_1.png)

![Example Structure](/assets/image/2021-07-23-React-Context-API/2021-07-23-React-Context-API_2.png)

Root의 State에 `itemList`라는 값이 있고, 이 값을 변경시키는 `handleSetItemList()`라는 함수가 있습니
다.  
상품을 장바구니에 넣을 때, `ProductItem`에서는 `itemList`의 값을 바꾸기 위해 `handleSetItemList()`를
호출하고, `BasketHeader`에서는 `itemList`의 값을 이용하여 장바구니에 몇 개가 담겼는지 표시해 줍니다
.  
위의 요구 사항을 구현하기 위해서는 `itemList`와 `handleSetItemList()` 함수를 Props를 사용하여 하위컴
포넌트에게 전달을 해야 합니다.

만약 하위 컴포넌트가 엄청 많고 복잡하다면 어떻게 해야 할까요? 계속 아래로 전달해야 할까요?

## React Context를 사용합시다!

React 16.3부터 Context API가 추가되었으며, Context를 사용하면 더 간편하게 값을 읽고 설정할 수 있습니
다.

코드를 간단하게 짜보도록 하겠습니다.

**src/index.tsx :**

```tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

**src/Types.ts :**

```ts
export type Item = {
  name: string;
  price: number;
};
```

**src/App.tsx :**

```tsx
import * as React from 'react';
import Content from './Content';
import Header from './Header';

const App = () => {
  return (
    <>
      <Header />
      <Content />
    </>
  );
};

export default App;
```

**src/Header.tsx :**

```tsx
import * as React from 'react';
import BasketHeader from './BasketHeader';

const Header = () => {
  return (
    <>
      <BasketHeader />
      <br />
    </>
  );
};

export default Header;
```

**src/BasketHeader.tsx :**

```tsx
import * as React from 'react';

const BasketHeader = () => {
  return (
    <>
      <span>이곳에 장바구니의 개수가 출력됩니다.</span>
    </>
  );
};

export default BasketHeader;
```

**src/Content.tsx :**

```tsx
import * as React from 'react';
import ProductList from './ProductList';

const Content = () => {
  return (
    <>
      <ProductList />
    </>
  );
};

export default Content;
```

**src/ProductList.tsx :**

```tsx
import * as React from 'react';
import ProductItem from './ProductItem';
import { Item } from './Types';

const ProductList = () => {
  const foods: Item[] = [
    { name: '탕수육', price: 10000 },
    { name: '마라탕', price: 7500 },
  ];

  return (
    <>
      {foods.map((food, index) => {
        return <ProductItem key={index} food={food} />;
      })}
    </>
  );
};

export default ProductList;
```

**src/ProductItem.tsx :**

```tsx
import * as React from 'react';
import { Item } from './Types';

type ProductItemProps = {
  food: Item;
};

const ProductItem = ({ food }: ProductItemProps) => {
  return (
    <>
      <p>
        {food.name} - {food.price}원
      </p>
      <button>장바구니 담기 +</button>
    </>
  );
};

export default ProductItem;
```

모두 작성했다면, 아래와 같은 화면이 출력 될 것입니다.  
![Example React View](/assets/image/2021-07-23-React-Context-API/2021-07-23-React-Context-API_3.png)

이 화면에서 장바구니 담기를 누르면, Console 창에 무엇이 담겼는지 출력되고 위에 장바구니 개수가 출력
되는 것을 간단하게 구현해보려고 합니다.

**src/BasketContext.tsx :**

```tsx
import * as React from 'react';
import { Item } from './Types';

export enum Action {
  SET = 'SET',
}

type BasketAction = {
  type: Action;
  itemList: Item[];
};

type BasketState = {
  itemList: Item[];
};

type BasketDispatch = React.Dispatch<BasketAction>;

export const BasketStateContext = React.createContext<BasketState | null>(null);
export const BasketDispatchContext = React.createContext<BasketDispatch | null>(null);

export const reducer = (state: BasketState, action: BasketAction): BasketState => {
  switch (action.type) {
    case Action.SET:
      return {
        ...state,
        itemList: state.itemList.concat(action.itemList),
      };
    default:
      throw new Error('Unhandled action');
  }
};
```

**src/BasketProvider.tsx :**

```tsx
import * as React from 'react';
import { BasketDispatchContext, BasketStateContext, reducer } from './BasketContext';

const BasketProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = React.useReducer(reducer, {
    itemList: [],
  });

  return (
    <BasketStateContext.Provider value={state}>
      <BasketDispatchContext.Provider value={dispatch}>{children}</BasketDispatchContext.Provider>
    </BasketStateContext.Provider>
  );
};

export default BasketProvider;
```

**src/BasketHook.tsx :**

```tsx
import * as React from 'react';
import { BasketDispatchContext, BasketStateContext } from './BasketContext';

export function useBasketState() {
  const state = React.useContext(BasketStateContext);
  if (!state) throw new Error('Cannot find BasketProvider');
  return state;
}

export function useBasketDispatch() {
  const dispatch = React.useContext(BasketDispatchContext);
  if (!dispatch) throw new Error('Cannot find BasketProvider');
  return dispatch;
}
```

이제 Context, Provider, Custom Hooks 모두 준비가 완료되었습니다.  
`index.tsx`를 아래와 같이 수정하면, `App` 컴포넌트 안에 있는 모든 곳에서 `state`와 `dispatch`를 위에
서 만든 Custom Hooks를 사용하여 쉽게 사용할 수 있습니다.

**src/index.tsx :**

```tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import BasketProvider from './BasketProvider';

ReactDOM.render(
  <BasketProvider>
    <App />
  </BasketProvider>,
  document.getElementById('root')
);
```

`BasketHeader.tsx`와 `ProductItem.tsx`을 아래와 같이 수정하여, `itemList`의 값을 읽고 변경해봅시다.

**src/BasketHeader.tsx :**

```tsx
import * as React from 'react';
import { useBasketState } from './BasketHook';

const BasketHeader = () => {
  const state = useBasketState();

  React.useEffect(() => {
    console.log(state.itemList);
  }, [state.itemList]);

  return (
    <>
      <span>총 {state.itemList.length}개의 상품이 담겼습니다.</span>
    </>
  );
};

export default BasketHeader;
```

**src/ProductItem.tsx :**

```tsx
import * as React from 'react';
import { Action } from './BasketContext';
import { useBasketDispatch } from './BasketHook';
import { Item } from './Types';

type ProductItemProps = {
  food: Item;
};

const ProductItem = ({ food }: ProductItemProps) => {
  const dispatch = useBasketDispatch();

  return (
    <>
      <p>
        {food.name} - {food.price}원
      </p>
      <button
        onClick={() =>
          dispatch({
            type: Action.SET,
            itemList: [{ name: food.name, price: food.price }],
          })
        }
      >
        장바구니 담기 +
      </button>
    </>
  );
};

export default ProductItem;
```

모두 마치셨다면, '장바구니 담기' 버튼을 눌러 확인해봅시다.  
![Example React View](/assets/image/2021-07-23-React-Context-API/2021-07-23-React-Context-API_4.png)

긴 글을 읽어주셔서 감사합니다.  
시간이 나신다면 `Action`에 'REMOVE'와 같은 여러 Action을 추가하여 여러 기능을 추가하여 더 완성도 있
게 만들어봅시다.
