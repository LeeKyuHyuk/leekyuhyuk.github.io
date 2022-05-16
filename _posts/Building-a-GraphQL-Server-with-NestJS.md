---
title: 'Nest.js로 GraphQL 서버 구축하기'
date: '2021-09-16 00:12:10'
category: GraphQL
---

[Nest.js](https://nestjs.com)에 GraphQL 서버를 구축하는 방법을 정리해보았습니다.

# Nest.js 프로젝트 생성

`npm init`를 사용하여 아래와 같이 `package.json`을 생성합니다.  
![Create NestJS Project](/assets/image/2021-09-16-Building-a-GraphQL-Server-with-NestJS/2021-09-16-Building-a-GraphQL-Server-with-NestJS_1.png)

아래의 패키지를 설치합니다.

```bash
npm install --save @nestjs/axios @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
npm install --save-dev @nestjs/cli @nestjs/schematics @types/express @types/node ts-loader ts-node tsconfig-paths typescript
```

`package.json`에 `"main": "index.js"` 행을 삭제하고 아래 내용을 추가합니다.

```json
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "NODE_ENV=development nest start --watch",
    "start:debug": "NODE_ENV=development nest start --debug --watch",
    "start:prod": "npm run build && NODE_ENV=production node dist/main"
  },
```

`nest-cli.json`, `tsconfig.build.json`, `tsconfig.json`을 아래와 같이 작성하여 저장합니다.

**`nest-cli.json` :**

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

**`tsconfig.build.json` :**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

**`tsconfig.json` :**

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

# Nest.js 프로젝트에 GraphQL 추가 및 설정

아래의 패키지를 설치합니다.

```bash
npm install --save @nestjs/graphql apollo-server-express graphql
```

`src` 폴더를 만들고 `src/app.module.ts`와 `src/main.ts`를 생성합니다.

**`src/app.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [GraphQLModule.forRoot({})],
})
export class AppModule {}
```

위의 코드에서 `forRoot()`에 [여러 설정](https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html#constructor-options-lt-ApolloServer-gt)을넣을 수 있습니다. [설정값](https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server.html#constructor-options-lt-ApolloServer-gt)은기본 Apollo 인스턴스로 전달됩니다.  
예를 들어 `playground`와 `debug`를 끄려면 다음과 같이 사용할 수 있습니다.

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot({
      debug: false,
      playground: false,
    }),
  ],
})
export class AppModule {}
```

**`src/main.ts` :**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(8080);
}
bootstrap();
```

# Resolver, Schema 생성

아마 위의 코드를 모두 작성하고 `npm run start:dev`를 하면 `UnhandledPromiseRejectionWarning: Error: Apollo Server requires either an existing schema, modules or typeDefs`라고 오류가 발생할 것입니다.

이 오류가 발생하는 이유는 Resolver, Schema가 없어서 발생하는 오류입니다.  
여기서 말하는 Resolver는 GraphQL 작업(Query, Mutation, Subscription)을 데이터로 변환하기 위해 사용됩니다.

Schema는 아래와 같이 정의할 수 있습니다. 간단하게 주소록에 필요한 Schema를 작성해보겠습니다.

`graphql` 폴더를 생성하고 `person.graphql` 파일을 생성합니다.

**`graphql/person.graphql` :**

```graphql
type Person {
  id: String!
  name: String!
  number: String
  email: String
}

type Query {
  getAllPerson: [Person]
}
```

GraphQL에서 사용되는 Schema와 Type이 궁금하다면 [https://graphql.org/learn/schema](https://graphql.org/learn/schema/)를 읽어보세요.

그리고 `src/app.module.ts`에 `typePaths`를 추가하여 `.graphql` 확장자를 가진 파일을 GraphQL의 Schema 로 사용하도록 설정합니다.

**`src/app.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
    }),
  ],
})
export class AppModule {}
```

Schema를 만들었으니 이제 Resolver를 만들어 봅시다.

`src` 폴더 안에 `models` 폴더를 생성하고, `src/models/person.resolver.ts`와 `src/models/person.module.ts` 파일을 작성합니다.  
아직 데이터베이스와 연결하지 않았기 때문에 `getAllPerson` Query 요청이 오면 아래와 같은 데이터를 반환하도록 작성합니다.

**`src/models/person.resolver.ts` :**

```typescript
import { Query, Resolver } from '@nestjs/graphql';

@Resolver('Person')
export class PersonResolver {
  @Query()
  async getAllPerson() {
    return [
      {
        id: '1',
        name: '이규혁',
        number: '+82 10-1234-5678',
        email: 'lee@kyuhyuk.kr',
      },
      { id: '2', name: '변정원', number: '+82 10-8765-4321' },
    ];
  }
}
```

**`src/models/person.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { PersonResolver } from './person.resolver';

@Module({
  providers: [PersonResolver],
})
export class PersonModule {}
```

`src/app.module.ts`에 `PersonModule`를 추가합니다.

**`src/app.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PersonModule } from './models/person.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
    }),
    PersonModule,
  ],
})
export class AppModule {}
```

`npm run start:dev`를 실행하고 [http://localhost:8080/graphql](http://localhost:8080/graphql)에 접속합니다.  
GraphQL Playground가 브라우저에 출력되면, 아래와 같이 입력하여 실행해봅니다.

우리가 의도한 대로 동작하는 것을 확인할 수 있습니다.  
![GraphQL Playground](/assets/image/2021-09-16-Building-a-GraphQL-Server-with-NestJS/2021-09-16-Building-a-GraphQL-Server-with-NestJS_2.png)

# 데이터베이스와 연결

이 글에서는 MongoDB를 GraphQL과 연결하도록 하겠습니다.  
[https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)에접속하여 MongoDB Community Server를 다운로드하고 설치합니다.

간편하게 MongoDB를 사용하기 위해서 [Robo 3T](https://robomongo.org)를 사용하도록 하겠습니다.  
아래와 같이 데이터 몇 개를 삽입하였습니다.  
![Robo 3T - Insert Document](/assets/image/2021-09-16-Building-a-GraphQL-Server-with-NestJS/2021-09-16-Building-a-GraphQL-Server-with-NestJS_3.png)

Nest.js 프로젝트에 아래의 패키지를 추가합니다.

```bash
npm install --save mongoose
```

`src/database.providers.ts`와 `src/database.module.ts` 파일을 작성하여, 데이터베이스와의 연결을 설정합니다.

**`src/database.providers.ts` :**

```typescript
import * as mongoose from 'mongoose';

const DATABASE_NAME = 'GraphQL';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(`mongodb://localhost/${DATABASE_NAME}`),
  },
];
```

**`src/database.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

Mongoose를 사용하면 모든 것이 Schema에서 파생됩니다.  
`src`에 `schemas` 폴더를 만들고, `person.schema.ts` 파일을 작성합니다.

**`src/schemas/person.schema.ts` :**

```typescript
import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export const PersonSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: String,
  number: String,
  email: String,
});

@ObjectType()
export class Person extends Document {
  @Field()
  _id: string;

  @Field()
  name: string;

  @Field()
  number: string;

  @Field()
  email: string;
}
```

위에서 만든 `PersonSchema`를 사용하여 Model Provider를 만들어봅시다.  
아래와 같이 `person.providers.ts` 파일을 작성합니다.

**`src/models/person.providers.ts` :**

```typescript
import { Connection } from 'mongoose';
import { PersonSchema } from '../schemas/person.schema';

export const PersonProviders = [
  {
    provide: 'PERSON_MODEL',
    useFactory: (connection: Connection) => connection.model('Person', PersonSchema, 'Person'),
    inject: ['DATABASE_CONNECTION'],
  },
];
```

> `PERSON_MODEL`과 `DATABASE_CONNECTION`은 `constants.ts` 파일을 따로 만들어 분리하여 보관하는 것을권장합니다.

이제 `@Inject()`를 사용하여 `PersonService`에 `PERSON_MODEL`를 추가합니다.  
`src/models/person.service.ts` 파일을 아래와 같이 작성합니다.

**`src/models/person.service.ts` :**

```typescript
import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { Person } from '../schemas/person.schema';

@Injectable()
export class PersonService {
  constructor(
    @Inject('PERSON_MODEL')
    private personModel: Model<Person>
  ) {}

  async findAll(): Promise<Person[]> {
    return this.personModel.find().exec();
  }
}
```

`src/models/person.module.ts`에 `DatabaseModule`과 `PersonService`, `PersonProviders`를 추가합니다.

**`src/models/person.module.ts` :**

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { PersonProviders } from './person.providers';
import { PersonResolver } from './person.resolver';
import { PersonService } from './person.service';

@Module({
  imports: [DatabaseModule],
  providers: [PersonResolver, PersonService, ...PersonProviders],
})
export class PersonModule {}
```

기존에 작성했던 `src/models/person.resolver.ts`를 아래와 같이 수정하여 실제 데이터베이스에 있는 데이터를 가져오도록 구현합니다.

```typescript
import { Query, Resolver } from '@nestjs/graphql';
import { Person } from 'src/schemas/person.schema';
import { PersonService } from './person.service';

@Resolver('Person')
export class PersonResolver {
  constructor(private personService: PersonService) {}

  @Query(() => [Person])
  async getAllPerson() {
    return await this.personService.findAll();
  }
}
```

켜져 있는 NestJS 서버를 중단하고, `npm run start:dev`를 다시 실행한 뒤 [http://localhost:8080/graphql](http://localhost:8080/graphql)에 접속합니다.

Query를 요청하면, 아래와 같이 MongoDB에 있는 데이터가 정상적으로 나오고 있음을 확인할 수 있습니다.  
![GraphQL Playground](/assets/image/2021-09-16-Building-a-GraphQL-Server-with-NestJS/2021-09-16-Building-a-GraphQL-Server-with-NestJS_4.png)

Query를 구현했으니 이제 Mutation을 구현해봅시다.

`graphql/person.graphql`에 아래와 같이 Mutation을 추가합니다.

**`graphql/person.graphql` :**

```graphql
type Person {
  id: String!
  name: String!
  number: String
  email: String
}

input CreatePersonInput {
  name: String!
  number: String
  email: String
}

type Query {
  getAllPerson: [Person]
}

type Mutation {
  addPerson(person: CreatePersonInput): Person
}
```

`src/schemas/person.schema.ts`에도 `CreatePersonInput`을 추가합니다.

**`src/schemas/person.schema.ts` :**

```typescript
import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export const PersonSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: String,
  number: String,
  email: String,
});

@ObjectType()
export class Person extends Document {
  @Field()
  _id: string;

  @Field()
  name: string;

  @Field()
  number: string;

  @Field()
  email: string;
}

@ObjectType()
export class CreatePersonInput {
  @Field()
  name: string;

  @Field()
  number: string;

  @Field()
  email: string;
}
```

`PersonService`에 `addPerson()`을 추가합니다.

**`src/models/person.service.ts` :**

```typescript
import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { CreatePersonInput, Person } from '../schemas/person.schema';

@Injectable()
export class PersonService {
  constructor(
    @Inject('PERSON_MODEL')
    private personModel: Model<Person>
  ) {}

  async findAll(): Promise<Person[]> {
    return this.personModel.find().exec();
  }

  async addPerson(person: CreatePersonInput): Promise<Person> {
    return this.personModel.create(person);
  }
}
```

`PersonResolver`에 `addPerson` Mutation을 추가합니다.

**`src/models/person.resolver.ts` :**

```typescript
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreatePersonInput, Person } from '../schemas/person.schema';
import { PersonService } from './person.service';

@Resolver('Person')
export class PersonResolver {
  constructor(private personService: PersonService) {}

  @Query(() => [Person])
  async getAllPerson() {
    return await this.personService.findAll();
  }

  @Mutation(() => Person)
  async addPerson(@Args('person') person: CreatePersonInput) {
    return await this.personService.addPerson(person);
  }
}
```

켜져 있는 NestJS 서버를 중단하고, `npm run start:dev`를 다시 실행한 뒤 [http://localhost:8080/graphql](http://localhost:8080/graphql)에 접속합니다.

Mutation을 요청하면, 아래와 같이 MongoDB에 정상적으로 데이터가 삽입된 것을 확인할 수 있습니다.  
![GraphQL Playground](/assets/image/2021-09-16-Building-a-GraphQL-Server-with-NestJS/2021-09-16-Building-a-GraphQL-Server-with-NestJS_5.png)  
![Robo 3T - Documents](/assets/image/2021-09-16-Building-a-GraphQL-Server-with-NestJS/2021-09-16-Building-a-GraphQL-Server-with-NestJS_6.png)
