---
title: 'Node.js를 사용하여 간단한 블록체인 만들기'
date: '2021-12-11 00:39:22'
category: Blockchain
---

> 블록체인(Blockchain)은 관리 대상 데이터를 '블록'이라고 하는 소규모 데이터들이 P2P 방식을 기반으로
> 생성된 체인 형태의 연결고리 기반 분산 데이터 저장 환경에 저장하여 누구라도 임의로 수정할 수 없고누
> 구나 변경의 결과를 열람할 수 있는 분산 컴퓨팅 기술 기반의 원장 관리 기술이다.  
> 출처 : [블록체인 - ko.wikipedia.org](https://ko.wikipedia.org/wiki/블록체인)

이 글을 통하여 블록체인에 대해 간단하게 구현하고 이해할 수 있을 것입니다.  
[TypeScript](https://www.typescriptlang.org), [Node.js](https://nodejs.org)를 통하여 설명할 것이며,
진행하기 위해서는 Node.js가 작업 환경에 설치되어 있어야 합니다.

# 블록체인은 무엇인가요?

우리가 알고 있는 비트코인과 이더리움은 블록체인이라는 기술로 만들어져있으며 이들을 암호화폐라고 부릅
니다.  
블록체인은 암호화를 사용하여 블록들을 하나하나 사슬처럼 연결하여 유지하고 관리합니다.  
데이터베이스와 비슷하지만 오직 추가만 가능하며 수정, 삭제가 불가합니다.  
이 데이터들을 P2P(Peer to Peer) 분산 저장을 하게 됩니다. 여기서 P2P는 인터넷에 연결된 다수의 사용자
들이 중개기관을 거치지 않고 직접 데이터를 주고받는 것을 의미합니다.  
중개기관을 거치지 않고 사용자들과 직접 데이터를 주고받는다는 개념이 이해하기 어려울 수 있는데, 아래
와 같이 생각하면 이해하기 쉬울것 입니다.

예를 들어, 회사 동료 누군가가 '이규혁'의 전화번호를 알고 싶다면 어떻게 해야 할까요?  
아마 조직도와 같은 직원 명단을 찾아서 '이규혁'의 전화번호를 검색해야 할 것입니다. 여기서 조직도를 제
공하는 회사는 중개기관이라고 할 수 있습니다.  
하지만 위의 방법 말고 다른 방법도 있습니다. '이규혁'과 친한 동료들에게 전화번호를 물어보는 것입니다.
**모든 동료**들이 '이규혁'의 전화번호가 010-1234-5678이라고 말한다면, '이규혁'의 전화번호는
010-1234-5678가 확실합니다.

위와 같이 모든 사용자가 같은 데이터를 가지고 있고, 블록이 체인에 추가될 때마다 모든 사용자들이 같은
데이터를 주고받는다면 그 데이터는 신뢰할 수 있는 데이터가 됩니다.

# 간단한 블록체인 구현하기

아래와 같이 Node.js 프로젝트를 생성합니다.

```bash
mkdir simple-blockchain
cd simple-blockchain
npm init --y
npm install --save-dev @types/node typescript ts-node
```

`tsconfig.json` 파일을 생성하고 아래와 같이 내용을 입력합니다.

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "target": "ES5",
    "moduleResolution": "node",
    "outDir": "dist",
    "baseUrl": ".",
    "sourceMap": true,
    "downlevelIteration": true,
    "noImplicitAny": false,
    "paths": {
      "*": ["node_modules/*"]
    }
  },
  "include": ["src/**/*"]
}
```

`package.json` 파일을 열고 아래와 같이 `main`과 `scripts`를 수정합니다.

```json
{
  "name": "simple-blockchain",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "scripts": {
    "dev": "ts-node src",
    "build": "tsc && node dist"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/node": "^16.11.12",
    "ts-node": "^10.4.0",
    "typescript": "^4.5.3"
  }
}
```

`src` 폴더를 만들고, 그 안에 `BlockCrypto.ts`를 아래와 같이 작성합니다.  
`BlockCrypto`는 입력받은 데이터로 블록을 생성하는 데 사용됩니다.

**`src/BlockCrypto.ts` :**

```typescript
/**
 * 각 블록의 해시를 계산하기 위해 "crypto" 모듈을 사용합니다.
 */
import { createHash } from 'crypto';

class BlockCrypto {
  /** 블록체인의 모든 블록의 Index를 추적하는 고유한 숫자입니다. */
  private index: number;
  /** 트랜잭션이 완료된 시간을 기록합니다. */
  private currentTime: number;
  /** 블록에 기록되는 데이터입니다. */
  private data: any;
  /** 체인에서 이전 블록의 Hash Key를 가리키고 있습니다. 블록체인의 무결성을 유지하고 유지하는 데 사용됩니다. */
  private prevHash: string;
  /** 해당 블록이 가지고 있는 Hash Key입니다. */
  private hash: string;

  constructor(index: number, currentTime: number, data: any, prevHash = '') {
    this.index = index;
    this.currentTime = currentTime;
    this.data = data;
    this.prevHash = prevHash;
    this.hash = this.computeHash();
  }

  /**
   * prevHash, currentTime, data를 기반으로 블록의 Hash Key를 생성하는 데 사용됩니다.
   * @returns SHA256으로 생성된 블록의 Hash Key
   */
  public computeHash(): string {
    return createHash('sha256')
      .update(this.prevHash + this.currentTime + JSON.stringify(this.data).toString())
      .digest('hex');
  }

  public getIndex(): number {
    return this.index;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getData(): any {
    return this.data;
  }

  public getPrevHash(): string {
    return this.prevHash;
  }

  public setPrevHash(prevHash: string): string {
    return (this.prevHash = prevHash);
  }

  public getHash(): string {
    return this.hash;
  }

  public setHash(hash: string): string {
    return (this.hash = hash);
  }
}

export default BlockCrypto;
```

`src` 폴더 안에 `Blockchain.ts`를 아래와 같이 작성합니다.  
`Blockchain`는 입력받은 데이터로 블록을 생성하는 데 사용됩니다.

**`src/Blockchain.ts` :**

```typescript
import BlockCrypto from './BlockCrypto';

class Blockchain {
  private blockChain: BlockCrypto[];

  constructor() {
    this.blockChain = [this.initGenesisBlock()];
  }

  /**
   * 블록체인의 첫 번째 블록을 생성합니다.
   * 이 블록은 다른 블록과 연결되지 않은 상태입니다.
   * @returns 블록체인의 첫 번째 블록
   */
  private initGenesisBlock(): BlockCrypto {
    return new BlockCrypto(0, Date.now(), '나의 첫 블록체인!', '0');
  }

  /**
   * 블록체인에 추가된 마지막 블록을 찾는 데 사용합니다.
   * @returns 블록체인의 마지막 블록
   */
  private obtainLatestBlock(): BlockCrypto {
    return this.blockChain[this.blockChain.length - 1];
  }

  /**
   * 새로운 블록을 블록체인에 추가 합니다.
   * 새로운 블록의 prevHash에는 블록체인의 마지막 블록의 Hash가 설정되어
   * 블록체인의 변조를 최소화하거나 방지합니다.
   * @param newBlock 블록체인에 추가할 새로운 블록
   */
  public addNewBlock(newBlock: BlockCrypto) {
    newBlock.setPrevHash(this.obtainLatestBlock().getHash());
    newBlock.setHash(newBlock.computeHash());
    this.blockChain.push(newBlock);
  }

  /**
   * 블록체인에 있는 모든 블록의 prevHash와 hash가 서로를 가리키는지 확인하여
   * Hash가 변조되었는지를 여부를 확인합니다.
   * @returns 블록체인의 무결성이 손상된 경우 false를 반환합니다.
   */
  public isValidChain(): boolean {
    for (let index = 1; index < this.blockChain.length; index++) {
      const currentBlock = this.blockChain[index];
      const prevHash = this.blockChain[index - 1];
      if (currentBlock.getHash() !== currentBlock.computeHash()) return false;
      if (currentBlock.getPrevHash() !== prevHash.getHash()) return false;
    }
    return true;
  }
}

export default Blockchain;
```

마지막으로 `src` 폴더에 `index.ts`를 아래와 같이 작성합니다.

**`src/index.ts` :**

```typescript
import Blockchain from './Blockchain';
import BlockCrypto from './BlockCrypto';

const blockChain = new Blockchain();

console.log('블록체인 생성중....');

blockChain.addNewBlock(
  new BlockCrypto(1, Date.now(), {
    sender: '이규혁',
    receives: '변정원',
    content: '오늘 저녁은 마라탕이다!',
  })
);

blockChain.addNewBlock(
  new BlockCrypto(2, Date.now(), {
    sender: '변정원',
    receives: '배달의민족',
    content: '마라탕 2개 주문이요~',
  })
);

console.log(JSON.stringify(blockChain, null, 4));

if (blockChain.isValidChain()) {
  console.log('✅ 유효한 블록체인 입니다.');
} else {
  console.error('🚫 유효하지 않은 블록체인 입니다.');
}
```

모든 코드의 작성이 끝났다면 터미널에서 `npm run dev`를 입력해 봅시다.

![npm run dev](/assets/image/2021-12-11-Make-a-Simple-Cryptocurrency-Blockchain-using-NodeJS/2021-12-11-Make-a-Simple-Cryptocurrency-Blockchain-using-NodeJS_1.png)

위의 결과를 그림으로 그려보면 아래와 같습니다.

![Simple Blockchain](/assets/image/2021-12-11-Make-a-Simple-Cryptocurrency-Blockchain-using-NodeJS/2021-12-11-Make-a-Simple-Cryptocurrency-Blockchain-using-NodeJS_2.png)

그림과 같이 블록과 블록이 모두 체인과 같이 연결되어 있으며, 만약 위의 블록 중에 하나라도 내용이 조금
변경되면 해당 블록의 Hash가 변경되기 때문에 블록의 연결이 끊기게 됩니다.

오늘은 Node.js를 사용하여 간단한 블록체인을 구현해 보았습니다. 이 글을 통해 블록체인에 대해 이해하는
데 조금이라도 도움이 되었으면 좋겠습니다.
