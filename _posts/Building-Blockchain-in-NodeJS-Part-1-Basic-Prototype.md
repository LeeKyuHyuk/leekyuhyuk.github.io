---
title: 'Node.js로 구현하는 블록체인 - 1. 기본 프로토타입'
date: '2021-12-11 22:22:43'
category: Blockchain
---

> 이 글은
> [Building Blockchain in Go. Part 1: Basic Prototype](https://jeiwan.net/posts/building-blockchain-in-go-part-1/)를
> Node.js로 작성하고 번역하였습니다.  
> 소스코드는 [LeeKyuHyuk/blockchain-nodejs](https://github.com/LeeKyuHyuk/blockchain-nodejs)에 있습
> 니다.

# 소개

블록체인은 21세기의 가장 혁신적인 기술 중 하나로, 아직 성숙 단계에 있으며 그 잠재력이 아직 완전히 실
현되지 않았습니다. 본질적으로 블록체인은 분산된 기록 데이터베이스입니다. 그러나 블록체인이 특별한 이
유는 개인 데이터베이스가 아니라 공용 데이터베이스라는 것입니다. 그리고 새로운 기록은 데이터베이스의
다른 보관자의 동의가 있어야만 추가될 수 있습니다. 또한 암호화폐와 스마트 계약을 가능하게 한 것은 블
록체인입니다.

우리는 이제 간단한 블록체인 구현을 기반으로 하는 단순화된 암호화폐를 구축할 것입니다.

# 블록 (Block)

'블록체인'의 '블록' 부분부터 알아보겠습니다. 블록체인에서 블록은 정보를 저장하는 공간입니다. 블록에
는 버전, 현재 타임스탬프 및 이전 블록의 해시와 같은 정보가 포함되어 있습니다.

이 글에서는 블록체인이나 비트코인 사양(Specification)에 설명된 대로 블록을 구현하지 않고, 간단하게중
요한 정보만 포함하도록 만들 것입니다.

블록의 구조는 다음과 같습니다:

```typescript
type Block = {
  timestamp: number;
  data: string;
  prevBlockHash: string;
  hash: string;
};
```

`timestamp`는 현재 타임스탬프(블록이 생성되었을 때), `data`는 블록에 포함된 데이터,
`prevBlockHash`는 이전 블록의 해시를 저장하고 `hash`는 블록의 해시입니다. Bitcoint 사양에서
`timestamp`, `prevBlockHash` 및 `hash`는 블록 헤더라는 별도의 데이터 구조가 있으며, 트랜잭션(여기서
는 `data`)은 별도의 데이터 구조를 가지고 있습니다. 이 글에서는 구현을 간단하게 하기 위하여 블록 헤더
와 트랜젝션을 합쳤습니다.

그렇다면 해시를 어떻게 계산할까요? 해시가 계산되는 방식은 블록체인의 매우 중요한 기능이며 블록체인을
안전하게 만드는 기능입니다. 문제는 해시를 계산하는 것은 어려운 작업이며 빠른 컴퓨터에서도 시간이 걸
립니다(그래서 사람들은 Bitcoin을 채굴하기 위해 강력한 GPU를 구입합니다). 새 블록을 추가하기 어렵게하
여 추가된 후 블록의 수정을 방지하기 위해서 입니다.

블록을 구성하는 필드를 하나로 이은 뒤 이어진 문자열에 대해 SHA-256 해시를 계산할 것입니다. 다음과 같
이 `setHash()`를 작성합니다.

```typescript
function setHash(block: Block): string {
  const timeStamp = block.timestamp.toString();
  const headers = `${block.prevBlockHash}${block.data}${timeStamp}`;
  return createHash('sha256').update(headers).digest('hex');
}
```

다음으로 블록을 생성하는 `createBlock()`을 구현합니다.

```typescript
function createBlock(data: string, prevBlockHash: string): Block {
  const block: Block = {
    timestamp: Date.now(),
    data,
    prevBlockHash,
  };
  block.hash = setHash(block);
  return block;
}
```

# 블록체인 (Blockchain)

이제 블록체인을 구현해 봅시다. 본질적으로 블록체인은 특정 구조를 가진 데이터베이스일 뿐입니다. 순서
가 있고 연결된 목록입니다. 이는 블록이 추가된 순서대로 저장되고, 각 블록이 이전 블록에 연결된다는 것
을 의미합니다. 이 구조를 사용하면 체인의 최신 블록을 빠르게 얻을 수 있고 해시 값을 통하여 블록을 효
율적으로 얻을 수 있습니다.

```typescript
type Blockchain = {
  blocks: Block[];
};
```

이것은 우리의 첫 번째 블록체인 입니다. 이렇게 쉬울 줄은 상상도 못했겠죠?!😉

이제 블록을 추가할 수 있습니다:

```typescript
function addBlock(blockchain: Blockchain, data: string) {
  const prevBlock = blockchain.blocks[blockchain.blocks.length - 1];
  const newBlock = createBlock(data, prevBlock.hash);
  blockchain.blocks.push(newBlock);
}
```

이게 다일까요!? 아닙니다...!

새 블록을 추가하려면 기존 블록이 필요하지만, 우리가 가지고 있는 블록체인에는 아직 블록이 없습니다!
따라서 모든 블록체인에는 적어도 하나의 블록이 있어야 하며, 이러한 체인의 첫 번째 블록을 **제네시스블
록(Genesis Block**이라고 합니다. 이러한 블록을 생성하는 `createGenesisBlock()`를 구현해 보겠습니다 .

```typescript
function createGenesisBlock(): Block {
  return createBlock('Genesis Block', '');
}
```

이제 제네시스 블록으로 블록체인을 생성하는 기능을 구현할 수 있습니다:

```typescript
function createBlockchain(): Blockchain {
  return {
    blocks: [createGenesisBlock()],
  };
}
```

블록체인이 올바르게 작동하는지 확인합시다:

```typescript
function main() {
  const blockchain = createBlockchain();

  addBlock(blockchain, 'Send 1 BTC to KyuHyuk');
  addBlock(blockchain, 'Send 2 more BTC to KyuHyuk');

  for (let index = 0; index < blockchain.blocks.length; index++) {
    const block = blockchain.blocks[index];
    console.log(`Prev. hash: ${block.prevBlockHash}`);
    console.log(`Data: ${block.data}`);
    console.log(`Hash: ${block.hash}`);
    console.log();
  }
}
```

출력:

```
Prev. hash:
Data: Genesis Block
Hash: 9f50a344368018cbd86eb62ca405b9179cd9d39603e3b0f2939bad6e32af4034

Prev. hash: 9f50a344368018cbd86eb62ca405b9179cd9d39603e3b0f2939bad6e32af4034
Data: Send 1 BTC to KyuHyuk
Hash: c214ef7639423a219bb2ee2acd13f2adcfddee46d84ec7e9c6832f301606d10f

Prev. hash: c214ef7639423a219bb2ee2acd13f2adcfddee46d84ec7e9c6832f301606d10f
Data: Send 2 more BTC to KyuHyuk
Hash: 93e1f4dacfdbe0bcc8e3c31c6bf61e1c264176b34ea4e25b9067577069b25be7
```

잘 동작합니다!

# 결론

우리는 매우 간단한 블록체인 프로토타입을 만들어봤습니다. 우리가 만든 블록체인은 각 블록이 이전 블록
과 연결되어 있는 블록 배열일 뿐입니다. 실제 블록체인은 훨씬 더 복잡합니다. 우리 블록체인에서 새 블록
을 추가하는 것은 쉽고 빠르지만 실제 블록체인에서 새 블록을 추가하려면 약간의 작업이 필요합니다. 블록
추가 권한을 받기 전에 무거운 계산을 수행해야 합니다(이 메커니즘을 작업 증명(Proof of Work)이라고 합
니다). 또한 블록체인은 단일 의사결정자가 없는 분산 데이터베이스입니다. 따라서 새 블록은 네트워크의다
른 참가자가 확인하고 승인해야 합니다(이 메커니즘을 합의(Consensus)라고 합니다). 그리고 아직 우리블록
체인에는 트랜잭션(Transactions)이 없습니다!

다음 글에서 위의 각 기능에 대해 다룰 것입니다.
