---
title: 'NestJS, GraphQL, React을 사용하여 주소록 구현 하기'
date: '2021-12-05 15:21:11'
category: NestJS
---

# MariaDB Installation

> MariaDB는 Oracle 소유의 불확실한 MySQL의 라이선스 상태에 반발하여 만들어졌습니다. MySQL의 소스코드를 Fork하여 만들어졌으므로 사용방법과 구조가 MySQL과 동일합니다.  
> MySQL은 상업용으로 사용하면 유료이지만, MariaDB는 상업용으로 사용해도 비용을 지불하지 않아도 되는장점이 있습니다.

[Download MariaDB Server](https://mariadb.org/download/)에 접속하여 MariaDB Server 설치 파일을 다운로드하고 설치합니다.  
![Download MariaDB Server](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_1.png)

MariaDB에 `address_book` 데이터베이스와 `contact` 테이블을 추가합니다.

```bash
CREATE DATABASE address_book default CHARACTER SET UTF8;
USE `address_book`;
CREATE TABLE `contact` (
	`id` CHAR(50) NOT NULL,
	`name` CHAR(50) NOT NULL,
	`number` CHAR(50) NULL DEFAULT NULL,
	`email` CHAR(50) NULL DEFAULT NULL
)
COLLATE='utf8mb3_general_ci';
```

# Create Address Book Project

Nest.js + GraphQL + React.js 조합의 프로젝트를 생성할 것입니다.  
Address Book 프로젝트에 Backend와 Frontend 프로젝트를 포함시켜 관리할 것입니다.

우선 아래와 같이 `address-book` 프로젝트를 생성합니다.

```bash
mkdir address-book
cd address-book
npm init
```

`npm`의 [workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)를 사용하여 `backend`와 `frontend` 프로젝트를 추가합니다.

```bash
npm init -w backend
npm init -w frontend
```

위 명령어로 `backend`와 `frontend` 프로젝트를 추가하면 아래와 같은 구조로 되어있을 것입니다.

```
├── backend
│   └── package.json
├── frontend
│   └── package.json
└── package.json
```

이제 `backend` 프로젝트를 설정해 봅시다.

# Configuration Backend Project

Backend를 Nest.js와 GraphQL로 구성하기 위해 아래의 패키지를 설치합니다.

```bash
npm install --save @nestjs/axios @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs @nestjs/graphql apollo-server-express graphql @nestjs/typeorm typeorm mysql2 -w backend
npm install --save-dev @nestjs/cli @nestjs/schematics @types/express @types/node ts-loader ts-node tsconfig-paths typescript cross-env -w backend
```

`backend/package.json`에 `"main": "index.js"` 행을 삭제하고 아래 내용을 추가합니다.

```json
"private": true,
"scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "cross-env NODE_ENV=development nest start --watch",
    "start:debug": "cross-env NODE_ENV=development nest start --debug --watch",
    "start:prod": "npm run build && NODE_ENV=production node dist/main"
},
```

`backend/nest-cli.json`, `backend/tsconfig.build.json`, `backend/tsconfig.json`을 아래와 같이 작성하여 저장합니다.

**`backend/nest-cli.json` :**

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

**`backend/tsconfig.build.json` :**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

**`backend/tsconfig.json` :**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2017",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true
  }
}
```

`backend/src` 폴더를 만들고 `backend/src/app.module.ts`와 `backend/src/main.ts`를 생성합니다.

**`backend/src/app.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
    }),
  ],
})
export class AppModule {}
```

**`backend/src/main.ts` :**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(8081);
}
bootstrap();
```

MySQL과 연동하기 위해 `ormconfig.json`를 작성합니다.  
<span style="color:red;">Backend 프로젝트에 생성하지 않고, Address Book 프로젝트에 생성합니다 .</span>

**`ormconfig.json` :**

```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "root",
  "database": "address_book",
  "entities": ["dist/**/*.entity{.ts,.js}"]
}
```

# GraphQL Schema와 Query, Mutation 만들기

Schema는 아래와 같이 정의할 수 있습니다. 간단하게 주소록에 필요한 Schema를 작성해 보겠습니다.  
`backend/graphql` 폴더를 생성하고 `contact.graphql` 파일을 생성합니다.

**`backend/graphql/contact.graphql` :**

```graphql
type Contact {
  id: String!
  name: String!
  number: String
  email: String
}

input ContactInput {
  name: String!
  number: String
  email: String
}

type ContactResponse {
  result: String!
  msg: String!
}

type Query {
  getAllContact: [Contact]
  getContact(id: String!): Contact
}

type Mutation {
  addContact(contact: ContactInput!): ContactResponse
  removeContact(id: String!): ContactResponse
}
```

# Resolver 만들기

위에서 정의한 GraphQL Schema를 바탕으로 Type를 만들어줍니다.  
`backend/src/types` 폴더를 생성하고 `contact.ts` 파일을 생성합니다.

```typescript
export type Contact = {
  id: string;
  name: string;
  number?: string;
  email?: string;
};

export type ContactInput = {
  name: string;
  number?: string;
  email?: string;
};

export type ContactResponse = {
  result: string;
  msg: string;
};
```

TypeORM을 사용하여 Repository Design Pattern을 정의합니다. 아래와 같이 `Contact` Entity를 정의합니다 .

**`backend/src/repository/contact.entity.ts` :**

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  name: string;

  @Column()
  number?: string;

  @Column()
  email?: string;
}
```

`backend/src/models` 폴더를 만들고, `contact.service.ts`, `contact.resolver.ts`, `contact.module.ts`를 작성합니다.

**`backend/src/models/contact.service.ts` :**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../repository/contact.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private ContactRepository: Repository<Contact>
  ) {}

  findAll(): Promise<Contact[]> {
    return this.ContactRepository.find();
  }

  findOne(id: string): Promise<Contact> {
    return this.ContactRepository.findOne(id);
  }

  async add(Contact: Contact): Promise<void> {
    await this.ContactRepository.save(Contact);
  }

  async remove(id: string): Promise<void> {
    await this.ContactRepository.delete(id);
  }
}
```

**`backend/src/models/contact.resolver.ts` :**

```typescript
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Contact } from 'src/repository/contact.entity';
import { ContactInput, ContactResponse } from '../types/Contact';
import { ContactService } from './contact.service';

@Resolver('Contact')
export class ContactResolver {
  constructor(private contactService: ContactService) {}

  @Query()
  async getAllContact(): Promise<Contact[]> {
    return await this.contactService.findAll();
  }

  @Query()
  async getContact(@Args('id') id: string): Promise<Contact> {
    const result = await this.contactService.findOne(id);
    if (result) return result;
    return {
      id: 'Error',
      name: 'There is no information about that Contact ID.',
    };
  }

  @Mutation()
  async addContact(@Args('contact') contact: ContactInput): Promise<ContactResponse> {
    try {
      await this.contactService.add(contact);
      return {
        result: 'Success',
        msg: 'Added successfully.',
      };
    } catch (error) {
      return {
        result: 'Error',
        msg: error,
      };
    }
  }

  @Mutation()
  async removeContact(@Args('id') id: string): Promise<ContactResponse> {
    try {
      await this.contactService.remove(id);
      return {
        result: 'Success',
        msg: 'Removed successfully.',
      };
    } catch (error) {
      return {
        result: 'Error',
        msg: error,
      };
    }
  }
}
```

**`backend/src/models/contact.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../repository/contact.entity';
import { ContactResolver } from './contact.resolver';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  providers: [ContactResolver, ContactService],
})
export class ContactModule {}
```

`backend/src/app.module.ts`에 `ContactModule`를 추가합니다.

**`backend/src/models/app.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactModule } from './models/contact.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
    }),
    ContactModule,
  ],
})
export class AppModule {}
```

# GraphQL Playground

GraphQL Playground를 통하여 원하는 대로 동작하는지 확인을 해보겠습니다.

```bash
npm run start:dev --workspace=backend
```

위의 명령어로 Nest.js Dev Server를 실행하고, [http://localhost:8081/graphql](http://localhost:8081/graphql)에 접속합니다.  
접속하면 아래와 같이 우리가 구현한 Query와 Mutation이 Docs에 출력되는 것을 확인할 수 있습니다.  
![GraphQL Playground](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_2.png)

아래와 같이 Mutation을 작성하여 요청해봅시다.

```graphql
mutation {
  addContact(contact: { name: "이규혁", number: "+82 10-1234-5678", email: "lee@kyuhyuk.kr" }) {
    result
    msg
  }
}
```

아래와 같이 성공적으로 추가되었다는 메세지가 출력됩니다.  
![addContact Mutation](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_3.png)

이제 `getAllContact` Query를 사용하여 추가된 주소록을 확인해 봅시다.

```graphql
query {
  getAllContact {
    id
    name
    number
    email
  }
}
```

![getAllContact Query](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_4.png)

위에 출력된 `id`를 사용하여 `getContact` Query를 테스트해봅시다.  
![getContact Query](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_5.png)

정상적으로 작동되는 것을 확인했으니, 마지막으로 `removeContact` Mutation을 사용하여 정상적으로 삭제되는지도 확인해 봅시다.  
![removeContact Mutation](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_6.png)

`getAllContact` Query를 사용하여 주소록을 확인해 봅시다.  
![getAllContact Query](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_7.png)

모두 정상적으로 동작되는 것을 확인하였으니, 다음 단계인 React를 사용하여 Frontend를 구현해 봅시다.

# Configuration Frontend Project

```bash
npm install --save @apollo/client graphql@15.7.2 react react-dom react-router react-router-dom -w frontend
npm install --save-dev @types/react @types/react-dom @types/react-router @types/react-router-dom @types/webpack apollo apollo-language-server clean-webpack-plugin cross-env css-loader file-loader html-webpack-plugin style-loader ts-loader typescript webpack webpack-cli webpack-dev-server -w frontend
```

`frontend/package.json`에 `"main": "index.js"` 행을 삭제하고 아래 내용을 추가합니다.

```json
"private": true,
"scripts": {
  "dev": "cross-env NODE_ENV=development webpack serve --progress",
  "build": "cross-env NODE_ENV=production webpack --progress",
  "apollo:codegen": "apollo client:codegen src/types --target=typescript --outputFlat"
},
```

`frontend/apollo.config.js`, `frontend/tsconfig.json`, `frontend/webpack.config.js`을 아래와 같이 작성하여 저장합니다.

**`frontend/apollo.config.js` :**

```javascript
module.exports = {
  client: {
    service: {
      name: 'My GraphQL Server',
      url: 'http://localhost:8081/graphql',
      // Optional disable SSL validation check
      skipSSLValidation: true,
    },
    includes: ['./src/**/*.tsx', './src/**/*.ts'],
    tagName: 'gql',
  },
};
```

**`frontend/tsconfig.json` :**

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "target": "es5",
    "module": "esnext",
    "jsx": "react",
    "noImplicitAny": true,
    "allowSyntheticDefaultImports": true,
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": false
  },
  "include": ["src/**/*"]
}
```

**`frontend/webpack.config.js` :**

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const mode = process.env.NODE_ENV || 'development';

module.exports = {
  mode,
  devServer: {
    historyApiFallback: true,
    port: 8080,
  },
  entry: {
    app: path.join(__dirname, 'src', 'index.tsx'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|css)$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|png)$/,
        use: 'file-loader?name=assets/[name].[ext]',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      templateParameters: {
        env: process.env.NODE_ENV === 'production' ? '' : 'development',
      },
      minify:
        process.env.NODE_ENV === 'production'
          ? {
              collapseWhitespace: true,
              removeComments: true,
            }
          : false,
    }),
    new CleanWebpackPlugin(),
  ],
};
```

`frontend/src` 폴더를 생성하고, `index.html`을 아래와 같이 작성합니다.

**`frontend/src/index.html` :**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta property="og:type" content="website" />
    <title>Address Book</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

# GraphQL API의 Type 받아오기

`frontend/src/GraphQL` 폴더를 만들고, `Contact.ts`를 아래와 같이 작성합니다.  
`frontend/src/GraphQL/Contact.ts`에는 Frontend에서 사용하는 GraphQL Query, Mutation가 정의됩니다.

**`frontend/src/GraphQL/Contact.ts` :**

```typescript
import { gql } from '@apollo/client';

export const GET_ALL_CONTACT = gql`
  query GetAllContact {
    getAllContact {
      id
      name
      number
      email
    }
  }
`;

export const GET_CONTACT = gql`
  query GetContact($id: String!) {
    getContact(id: $id) {
      name
      number
      email
    }
  }
`;

export const ADD_CONTACT = gql`
  mutation AddContact($contact: ContactInput!) {
    addContact(contact: $contact) {
      result
      msg
    }
  }
`;

export const REMOVE_CONTACT = gql`
  mutation RemoveContact($id: String!) {
    removeContact(id: $id) {
      result
      msg
    }
  }
`;
```

사용할 Query와 Mutation을 모두 작성했다면, 아래 명령을 실행하여 GraphQL Type을 생성합니다.

```bash
npm run apollo:codegen --workspace=frontend
```

<span style="color:red;">2021년 12월 5일 기준으로 아래와 같은 오류가 발생하고 있습니다.</span>  
![apollo:codegen Error](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_8.png)

`node_modules/apollo-language-server/node_modules/graphql` 폴더를 삭제하면 아래와 같이 정상적으로 생성됩니다.  
![apollo:codegen](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_9.png)

# List, Add, Detail 컴포넌트 만들기

주소록 목록을 보여주는 `frontend/src/List.tsx`를 간단하게 만들어봅시다.

**`frontend/src/List.tsx` :**

```typescript
import { useQuery } from '@apollo/client';
import React from 'react';
import { Link } from 'react-router-dom';
import { GET_ALL_CONTACT } from './GraphQL/Contact';
import { GetAllContact } from './types/GetAllContact';

const List = () => {
  const { loading, error, data } = useQuery<GetAllContact>(GET_ALL_CONTACT);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <>
      <h1>Address Book :</h1>
      <Link to="/add">
        <button>Add</button>
      </Link>
      <ul>
        {data?.getAllContact?.map((contact) => (
          <li key={contact?.id}>
            <a href={`/detail/${contact?.id}`}>{contact?.name}</a>
          </li>
        ))}
      </ul>
    </>
  );
};

export default List;
```

주소록을 추가하는 `frontend/src/Add.tsx`도 아래와 같이 만들어봅시다.

**`frontend/src/Add.tsx` :**

```typescript
import { useMutation } from '@apollo/client';
import React from 'react';
import { ADD_CONTACT } from './GraphQL/Contact';
import { AddContact, AddContactVariables } from './types/AddContact';

const Add = () => {
  const [name, setName] = React.useState<string>('');
  const [number, setNumber] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');

  const [addContact] = useMutation<AddContact, AddContactVariables>(ADD_CONTACT);

  const handleSubmit = async () => {
    await addContact({
      variables: {
        contact: {
          name,
          number,
          email,
        },
      },
    });
  };

  return (
    <>
      <form action="/" onSubmit={handleSubmit}>
        <label>
          Name :
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Number :
          <input type="text" value={number} onChange={(event) => setNumber(event.target.value)} />
        </label>
        <label>
          Email :
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </>
  );
};

export default Add;
```

주소록 내용을 보여주는 `frontend/src/Detail.tsx`도 작성합니다.

**`frontend/src/Detail.tsx` :**

```typescript
import { useQuery } from '@apollo/client';
import React from 'react';
import { useParams } from 'react-router';
import { GET_CONTACT } from './GraphQL/Contact';
import { GetContact, GetContactVariables } from './types/GetContact';

const Detail = () => {
  const { id } = useParams();
  const { loading, error, data } = useQuery<GetContact, GetContactVariables>(GET_CONTACT, {
    variables: { id: id || '' },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <>
      <h1>{data?.getContact?.name}</h1>
      <ul>
        <li>Number : {data?.getContact?.number || 'N/A'}</li>
        <li>Email : {data?.getContact?.email || 'N/A'}</li>
      </ul>
    </>
  );
};

export default Detail;
```

이제 필요한 Component는 모두 만들어졌습니다.

`frontend/src/index.tsx`를 아래와 같이 작성합니다.  
`index.tsx`에서는 `ApolloClient`와 Router를 설정합니다.

**`frontend/src/index.tsx` :**

```typescript
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Detail from './Detail';
import Add from './Add';
import List from './List';

const client = new ApolloClient({
  uri: 'http://localhost:8081/graphql',
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<List />} />
        <Route path="/add" element={<Add />} />
        <Route path="detail/:id" element={<Detail />} />
      </Routes>
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById('root')
);
```

# 결과물 확인하기

아래 명령어로 Backend와 Frontend의 Dev Server를 실행합니다.

```bash
npm run start:dev --workspace=backend
npm run dev --workspace=frontend
```

[http://localhost:8080](http://localhost:8080)에 접속하면 아래와 같은 화면이 출력될 것입니다.  
![List](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_10.png)  
Add 버튼을 눌러 주소록을 추가해 봅시다.  
![Add](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_11.png)  
추가한 주소록이 목록에 보입니다. 클릭해 봅시다.  
![List Check](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_12.png)  
입력한 정보가 정상적으로 출력되고 있음을 확인할 수 있습니다.  
![Detail](/assets/image/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book/2021-12-05-NestJS-GraphQL-MySQL-React-Address-Book_13.png)

> 삭제 기능은 `Detail.tsx`에 추가해 봅시다. `Add.tsx`에 있는 `useMutation()`를 참고하여 구현할 수 있습니다.

# 마무리

간편하게 프로젝트 관리를 하기 위해 `address-book`에 있는 `package.json`을 수정해 봅시다.  
우선, 아래 명령어로 `concurrently`와 `rimraf` 패키지를 추가합니다.

```bash
npm install --save concurrently rimraf
```

`package.json`의 `scripts`를 아래와 같이 수정합니다.

```json
"scripts": {
  "postinstall": "rimraf node_modules/apollo-language-server/node_modules/graphql",
  "dev": "concurrently \"npm run start:dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
  "build": "npm run build --workspace=backend --workspace=frontend",
  "apollo:codegen": "npm run apollo:codegen --workspace=frontend"
},
```

- `postinstall`은 현재(2021년 12월 5일 기준) 발생되는 GraphQL의 문제를 해결하기 위해 넣었습니다.
- `dev`를 위와 같이 설정하면, `address-book`에서 `npm run dev` 명령어 한 번으로 Backend, Frontend의 Dev Server를 동시에 실행할 수 있습니다.
