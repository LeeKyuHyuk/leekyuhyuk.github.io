---
title: 'Node.js로 구현하는 블록체인 - 2. 작업 증명'
date: '2021-12-11 23:51:12'
category: Blockchain
---

> 이 글은 [Building Blockchain in Go. Part 2: Proof-of-Work](https://jeiwan.net/posts/building-blockchain-in-go-part-2/)를 Node.js로 작성하고 번역하였습니다.  
> 소스코드는 [LeeKyuHyuk/blockchain-nodejs](https://github.com/LeeKyuHyuk/blockchain-nodejs)에 있습니다.

# 소개

[이전 글](https://kyuhyuk.kr/article/blockchain/2021/12/11/Building-Blockchain-in-NodeJS-Part-1-Basic-Prototype)에서 우리는 블록체인 데이터베이스의 핵심인 매우 간단한 데이터 구조를 구축했습니다. 그리고 우리는 각 블록을 이전 블록에 연결하여 체인과 같은 관계로 블록을 추가하는 것을 구현하였습니다. 하지만 우리가 만든블록체인에는 하나의 커다란 결함이 있습니다. 그것은 바로 체인에 블록을 추가하는 것이 너무 쉽고 비용이낮습니다. 블록체인과 비트코인의 핵심 중 하나는 새로운 블록을 추가하는 것이 힘든 일이라는 것입니다. 오늘 우리는 이 결함을 고칠 것입니다.

# 작업 증명 (Proof of Work)

블록체인의 핵심 아이디어는 데이터를 입력하기 위해 몇 가지 힘든 작업을 수행해야 한다는 것입니다. 이것은 블록체인을 안전하고 일관성 있게 만들어줍니다. 또한 이러한 힘든 작업을 수행하면 그것에 대한 보상이지급됩니다(이것이 사람들이 채굴을 통하여 코인을 얻는 방법입니다).

이 메커니즘은 실제 삶의 메커니즘, 즉 보상을 받으며 생계를 유지하려면 열심히 일하는 것과 매우 유사합니다. 블록체인에서 네트워크의 일부 참여자(채굴자)는 네트워크를 유지하고, 새 블록을 추가하고, 작업에대한 보상을 받기 위해 노력합니다. 그들의 작업 결과, 블록은 안전한 방식으로 블록체인에 추가되어 전체블록체인 데이터베이스의 안정성을 유지합니다. 작업을 마친 사람이 이 작업을 증명해야 한다는 것에 주목할 필요가 있습니다.

"어려운 작업을 수행하고 이것을 증명하는" 메커니즘을 작업 증명(PoW, Proof of Work)이라고 합니다. 이것은 많은 연산 능력이 필요로 하기 때문에 어렵습니다. 아무리 고성능 컴퓨터라도 이 작업을 빠르게 수행할수 없습니다. 비트코인에서 이러한 작업의 목표는 몇 가지 요구 사항을 충족하는 블록의 해시를 찾는 것입니다. 그리고 이 해시가 증명 역할을 합니다. 따라서 증명을 찾는 것이 실질적인 작업입니다.

마지막으로 주의할 사항입니다. 작업 증명 알고리즘은 작업을 수행하는 것은 어렵지만 증명을 확인하는 것은 쉬워야 합니다. 증명은 일반적으로 다른 사람에게 전달되므로 확인하는 데 많은 시간이 걸리면 안 됩니다.

# 해싱 (Hashing)

이 단락에서는 해싱에 대해 설명합니다. 이 개념에 익숙하다면 이 부분은 건너뛰어도 됩니다.

해싱은 지정된 데이터에 대한 해시를 얻는 과정입니다. 해시는 계산된 데이터의 고유한 표현 값입니다. 해시 함수는 임의의 길이의 데이터를 가져와 고정된 길이의 해시값을 생성하는 함수입니다. 다음은 해싱의 몇가지 주요 기능입니다:

1. 해시에서 원본 데이터를 복원할 수 없습니다. 따라서 해싱은 암호화가 아닙니다.
2. 특정 데이터에는 해시가 하나만 있을 수 있으며 해시는 고유합니다.
3. 입력 데이터에서 1바이트라도 변경하면 완전히 다른 해시가 생성됩니다.

![Hashing Example](/assets/image/2021-12-12-Building-Blockchain-in-NodeJS-Part-2-Proof-of-Work/2021-12-12-Building-Blockchain-in-NodeJS-Part-2-Proof-of-Work_1.png)

해싱 함수는 데이터의 일관성을 확인하는 데 널리 사용됩니다. 일부 소프트웨어 공급자는 소프트웨어 패키지와 체크섬을 함께 게시합니다. 파일을 다운로드한 후 파일에 대해 생성된 해시를 소프트웨어 개발자가 제공한 해시와 비교할 수 있습니다.

블록체인에서 해시는 블록의 일관성을 보장하는 데 사용됩니다. 해싱 알고리즘의 입력 데이터에는 이전 블록의 해시가 포함되어 있으므로 체인에서 블록을 수정하는 것이 불가능하거나 상당히 어렵습니다. 만약 하나의 블록을 변경하면 해당 블록에 대한 해시와 그 이후의 모든 블록들에 대한 해시를 다시 계산해야 합니다.

# 해시 캐시 (Hashcash)

Bitcoin은 처음에 이메일 스팸을 방지하기 위해 개발된 작업 증명 알고리즘인 Hashcash를 사용합니다. 이것은 다음 단계로 나눌 수 있습니다:

1. 공개적으로 알려진 데이터를 가져옵니다. (이메일의 경우 수신자의 이메일 주소, 비트코인의 경우 블록헤더)
2. 여기에 카운터를 추가합니다. 카운터는 0에서 시작합니다.
3. `data + counter` 조합의 해시를 가져옵니다.
4. 해시가 특정 요구 사항을 충족하는지 확인합니다. 충족하면 알고리즘을 끝내고, 충족하지 않는다면 카운터를 증가하고 3단계와 4단계를 반복합니다.

따라서 이것은 무차별 대입(Brute force) 알고리즘입니다. 카운터를 변경하고, 새 해시를 계산하고, 확인하고, 카운터를 증가시키고, 해시를 계산하는 등의 작업이 반복적으로 수행됩니다. 그렇기 때문에 계산 비용이 많이 듭니다.

이제 해시가 충족해야 하는 요구 사항을 자세히 살펴보겠습니다. 원래 Hashcash 구현에서 요구 사항은 "해시의 첫 20비트가 모두 0이어야 함"입니다. 비트코인에서는 시간이 지남에 따라 계산 능력이 증가하고 네트워크에 참여하는 채굴자가 더 많아짐에도 불구하고 설계상 10분마다 하나의 블록이 생성되어야 하기 때문에요구 사항이 수시로 조정됩니다.

이 알고리즘을 시연하기 위해, 앞에서 보여드린 예제인 "I like donuts"에서 3개의 0바이트로 시작하는 해시를 찾았습니다.

![Hashcash Example](/assets/image/2021-12-12-Building-Blockchain-in-NodeJS-Part-2-Proof-of-Work/2021-12-12-Building-Blockchain-in-NodeJS-Part-2-Proof-of-Work_2.png)

`ca07ca`는 카운터의 16진수 값으로 10진수로는 13240266입니다.

# 구현

자, 이론은 끝났으니 코드를 작성해 봅시다! 먼저 채굴의 난이도를 정의해 보겠습니다.

```typescript
const targetBits = BigInt(24n);
```

비트코인에서 '타겟 비트'는 블록이 채굴되는 난이도를 저장하는 블록 헤더입니다. 지금은 목표 조정 알고리즘을 구현하지 않으므로 난이도를 전역 상수로 정의할 수 있습니다.

24는 임의의 숫자입니다. 우리의 목표는 메모리에서 256비트 미만을 차지하는 타겟을 갖는 것입니다. 그리고 차이가 클수록 적절한 해시를 찾기가 더 어렵기 때문에, 우리는 그 차이가 충분히 중요하지만 너무 크지않기를 원합니다.

```typescript
type ProofOfWork = {
  block: Block;
  target: BigInt;
};

function createProofOfWork(block: Block): ProofOfWork {
  const target = BigInt(1n << (256n - targetBits));
  const pow: ProofOfWork = { block, target };
  return pow;
}
```

여기에서 블록에 대한 포인터와 타겟에 대한 포인터를 가지고 있는 **ProofOfWork** 타입을 만들었습니다. '타겟'은 앞에서 설명한 요구 사항의 다른 이름입니다. 해시를 타겟과 비교하는 방식 때문에 [BigInt](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/BigInt)를 사용합니다. 해시를 BigInt로 변환하고 타겟보다 작은지 확인합니다.

`createProofOfWork()`에서 1을 `256 - targetBits` 비트만큼 좌측 시프트 연산을 합니다. 256은 SHA-256 해시 길이이며 우리가 사용할 SHA-256 해시 알고리즘입니다. `target`의 16진수 표현은 다음과 같습니다.

```
0x10000000000000000000000000000000000000000000000000000000000
```

그리고 메모리에서 29바이트를 차지합니다. 다음은 이전 예제의 해시와 시각적으로 비교한 것입니다:

```
0fac49161af82ed938add1d8725835cc123a1a87b1b196488360e58d4bfb51e3
0000010000000000000000000000000000000000000000000000000000000000
0000008b0f41ec78bab747864db66bcb9fb89920ee75f43fdaaeb5544f7f76ca
```

첫 번째 해시("I like donuts"의 해시)는 타겟보다 크므로 유효한 작업 증명이 아닙니다. 두 번째 해시("I like donutsca07ca"의 해시)는 타겟보다 작으므로 유효한 증거입니다.

그렇다면, 이 타겟값을 유효한 범위의 경계라고 생각할 수 있습니다. 해시가 경계보다 낮으면 유효하고, 경계를 낮추면 유효한 숫자가 줄어들어 유효한 숫자를 찾는 데 난이도가 높아져 더 많은 작업이 필요하게 됩니다.

이제 해시 계산을 할 데이터가 필요합니다. 준비해 봅시다:

```typescript
function prepareData(pow: ProofOfWork, nonce: number): string {
  const data = `${pow.block.prevBlockHash}${pow.block.data}${pow.block.timestamp.toString(
    16
  )}${targetBits.toString(16)}${nonce.toString(16)}`;
  return data;
}
```

이 부분은 간단합니다. 블록 필드 값들과 타겟 및 nonce를 합치기만 합니다. `nonce`는 위의 Hashcash 설명에서 나온 카운터와 동일한 암호화 용어입니다.

자, 모든 준비가 끝났습니다. PoW 알고리즘의 핵심을 구현해 보겠습니다.

```typescript
type ProofOfWorkOutput = {
  nonce: number;
  hash: string;
};

function run(pow: ProofOfWork): ProofOfWorkOutput {
  let hashInt: BigInt;
  let hash: string;
  let nonce = 0;

  console.log(`Mining the block containing "${pow.block.data}"`);

  while (nonce < Number.MAX_SAFE_INTEGER) {
    const data = prepareData(pow, nonce);
    hash = createHash('sha256').update(data).digest('hex');
    hashInt = BigInt(`0x${hash}`);

    if (hashInt < pow.target) {
      console.log(`\r${hash}`);
      break;
    } else {
      nonce++;
    }
  }
  console.log('\n');

  return { nonce, hash };
}
```

먼저 변수를 초기화합니다: `hashInt`는 해시의 정수값입니다. `nonce`는 카운터입니다. 그리고 반복문을실행합니다. `Number.MAX_SAFE_INTEGER`에 의해 제한되는데, 그 이유는 `nonce`의 오버플로우 가능성을 피하기 위해 제한합니다. PoW 구현의 난이도는 카운터가 오버플로우 되기에는 너무 낮지만 만일을 대비하여제한하는 것이 좋습니다.

반복문에서는 다음의 작업들이 수행됩니다:

1. 데이터를 준비합니다.
2. SHA-256으로 해싱 합니다.
3. 해시를 정수로 변환하여 `hashInt`에 저장합니다.
4. `hashInt`와 타겟을 비교합니다.

앞에서 설명한 것처럼 간단합니다. 이제 **Block**의 `SetHash()`를 제거하고 `createBlock()`를 수정합니다:

```typescript
function createBlock(data: string, prevBlockHash: string): Block {
  const block: Block = {
    timestamp: Date.now(),
    data,
    prevBlockHash,
  };
  const pow = createProofOfWork(block);
  const { nonce, hash } = run(pow);
  block.hash = hash;
  block.nonce = nonce;
  return block;
}
```

여기서 `nonce`가 **Block**의 프로퍼티로 추가되어 있음을 알 수 있습니다. 이것은 증명을 확인하기 위해 `nonce`가 필요하기 때문에 필요합니다. 이제 블록의 구조가 다음과 같이 보일 것입니다:

```typescript
type Block = {
  timestamp: number;
  data: string;
  prevBlockHash: string;
  hash?: string;
  nonce?: number;
};
```

이제 모든 준비는 끝났습니다! 모든 것이 잘 작동하는지 확인하기 위해 프로그램을 실행해 봅시다:

```
Mining the block containing "Genesis Block"
000000be2c4e89c18ef89d7e189cbb333276788d1f6613a1c0f756720e70b097


Mining the block containing "Send 1 BTC to KyuHyuk"
00000085b01645853f44dfab90de1931d753f8318f004913bbfd9c2068905a5b


Mining the block containing "Send 2 more BTC to KyuHyuk"
000000b357f7f3a924eb64899832ea2bd7f7e04577ad2018fbd3be60d35b9b39


Prev. hash:
Data: Genesis Block
Hash: 000000be2c4e89c18ef89d7e189cbb333276788d1f6613a1c0f756720e70b097

Prev. hash: 000000be2c4e89c18ef89d7e189cbb333276788d1f6613a1c0f756720e70b097
Data: Send 1 BTC to KyuHyuk
Hash: 00000085b01645853f44dfab90de1931d753f8318f004913bbfd9c2068905a5b

Prev. hash: 00000085b01645853f44dfab90de1931d753f8318f004913bbfd9c2068905a5b
Data: Send 2 more BTC to KyuHyuk
Hash: 000000b357f7f3a924eb64899832ea2bd7f7e04577ad2018fbd3be60d35b9b39
```

오예! 모든 해시가 3개의 0바이트로 시작하는 것을 볼 수 있습니다. 또한 이러한 해시를 가져오는 데 시간이 걸린다는 것을 확인할 수 있습니다.

한 가지 더 해야 할 일이 남아 있습니다. 작업 증명을 검증할 수 있도록 합시다.

```typescript
function validate(pow: ProofOfWork): boolean {
  let hashInt: BigInt;

  const data = prepareData(pow, pow.block.nonce);
  const hash = createHash('sha256').update(data).digest('hex');
  hashInt = BigInt(`0x${hash}`);

  const isVaild = hashInt < pow.target;

  return isVaild;
}
```

위에서 저장된 `nonce`는 검증하는 동작에서 필요합니다.

작업 증명을 검증하는 게 잘 동작하는지 확인해 봅시다:

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

    const pow = createProofOfWork(block);
    console.log(`PoW: ${validate(pow)}\n`);
  }
}
```

출력:

```
Mining the block containing "Genesis Block"
0000002d6821756a92be8b008f22b066b743b5c250c86bb561e9872267f3a3e6


Mining the block containing "Send 1 BTC to KyuHyuk"
000000fd28eb30d8a948df7fb5c05e129857a3bd828bd6721c45bb7caa6cbc85


Mining the block containing "Send 2 more BTC to KyuHyuk"
0000007f3ac6e00b965f4dd41272ee698e2e594699d95bf3115da81567886bef


Prev. hash:
Data: Genesis Block
Hash: 0000002d6821756a92be8b008f22b066b743b5c250c86bb561e9872267f3a3e6
PoW: true

Prev. hash: 0000002d6821756a92be8b008f22b066b743b5c250c86bb561e9872267f3a3e6
Data: Send 1 BTC to KyuHyuk
Hash: 000000fd28eb30d8a948df7fb5c05e129857a3bd828bd6721c45bb7caa6cbc85
PoW: true

Prev. hash: 000000fd28eb30d8a948df7fb5c05e129857a3bd828bd6721c45bb7caa6cbc85
Data: Send 2 more BTC to KyuHyuk
Hash: 0000007f3ac6e00b965f4dd41272ee698e2e594699d95bf3115da81567886bef
PoW: true
```

# 결론

우리의 블록체인은 실제 아키텍처에 한 걸음 더 가까워졌습니다. 이제 블록을 추가하는 데 힘든 작업이 필요하고 채굴이 가능합니다. 그러나 여전히 몇 가지 중요한 기능이 빠져있습니다. 블록체인 데이터베이스가영구적이지 않고 지갑, 주소, 트랜잭션이 없으며 합의 메커니즘이 없습니다. 이 모든 것은 우리가 다음 글에서 구현할 것입니다!
