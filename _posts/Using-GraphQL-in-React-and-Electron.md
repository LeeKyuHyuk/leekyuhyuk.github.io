---
title: 'React & Electron에서 GraphQL 사용하기'
date: '2021-09-17 03:27:23'
category: GraphQL
---

[이전 글](https://kyuhyuk.kr/article/graphql/2021/09/16/Building-a-GraphQL-Server-with-NestJS)에서구축했던 GraphQL 서버와 React & Electron Project와 연동하는 방법을 정리해 보았습니다.

# React & Electron 프로젝트 생성

[Electron-Typescript-React-Webpack-Boilerplate](https://github.com/LeeKyuHyuk/Electron-Typescript-React-Webpack-Boilerplate)을사용하여 React & Electron 프로젝트를 생성합니다.  
설정 방법은 [`README.md`](https://github.com/LeeKyuHyuk/Electron-Typescript-React-Webpack-Boilerplate/blob/master/README.md) 파일을 참고합니다.

# React & Electron 프로젝트에 Apollo GraphQL Client 추가 및 설정

아래의 패키지를 설치합니다.

```bash
npm install @apollo/client apollo graphql
```

`package.json`의 `scripts`에 아래를 추가합니다.

```json
"apollo:codegen": "apollo client:codegen src/types --target=typescript --outputFlat",
```

`apollo.config.js`를 프로젝트 최상위 폴더에 생성합니다.

**`apollo.config.js` :**

```javascript
module.exports = {
  client: {
    service: {
      name: 'My GraphQL Server',
      url: 'http://localhost:8080/graphql',
      // Optional disable SSL validation check
      skipSSLValidation: true,
    },
    includes: ['./src/**/*.tsx', './src/**/*.ts'],
    tagName: 'gql',
  },
};
```

# GraphQL에서 데이터 가져오기

`src/renderer/renderer.tsx`를 아래와 같이 작성합니다.

**`src/renderer/renderer.tsx` :**

```tsx
import { ApolloClient, ApolloProvider, gql, InMemoryCache, useQuery } from '@apollo/client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
});

const GET_ALL_PERSON = gql`
  query GetAllPerson {
    getAllPerson {
      id
      name
      number
      email
    }
  }
`;

ReactDOM.render(
  <ApolloProvider client={client}>
    <div className="app"></div>
  </ApolloProvider>,
  document.getElementById('root')
);
```

프로젝트에서 사용되는 Query, Mutation의 Type를 생성합니다.  
`npm run apollo:codegen`를 실행하면, `src` 폴더 안에 `gql`로 명시한 구문에서 사용한 Type를 `src/types`에 생성합니다.  
![npm run apollo:codegen](/assets/image/2021-09-18-Using-GraphQL-in-React-and-Electron/2021-09-18-Using-GraphQL-in-React-and-Electron_1.png)

**`src/renderer/renderer.tsx` :**

```tsx
import { ApolloClient, ApolloProvider, gql, InMemoryCache, useQuery } from '@apollo/client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { GetAllPerson, GetAllPerson_getAllPerson } from '_/types/GetAllPerson';

const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
});

const GET_ALL_PERSON = gql`
  query GetAllPerson {
    getAllPerson {
      id
      name
      number
      email
    }
  }
`;

function AllPersonTable() {
  const { loading, error, data } = useQuery<GetAllPerson>(GET_ALL_PERSON);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Number</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {data?.getAllPerson?.map((person: GetAllPerson_getAllPerson) => (
          <tr key={person.id}>
            <td>{person.name}</td>
            <td>{person.number}</td>
            <td>{person.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

ReactDOM.render(
  <ApolloProvider client={client}>
    <div className="app">
      <AllPersonTable />
    </div>
  </ApolloProvider>,
  document.getElementById('root')
);
```

`npm run dev`를 실행하면, 아래와 같이 정상적으로 데이터를 가져오는 것을 확인할 수 있습니다.  
![npm run dev](/assets/image/2021-09-18-Using-GraphQL-in-React-and-Electron/2021-09-18-Using-GraphQL-in-React-and-Electron_2.png)  
![GraphQL Playground](/assets/image/2021-09-18-Using-GraphQL-in-React-and-Electron/2021-09-18-Using-GraphQL-in-React-and-Electron_3.png)
