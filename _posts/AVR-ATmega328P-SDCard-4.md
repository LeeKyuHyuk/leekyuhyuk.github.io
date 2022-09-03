---
title: '[AVR] ATmega328P SDCard 구현 (4)'
date: '2022-09-03 04:32:01'
category: AVR
---

[이전 글](https://kyuhyuk.kr/article/avr/2022/09/02/AVR-ATmega328P-SDCard-3)에서 SDCard 초기화 과정을 구현했습니다. 이 글에서는 SDCard에 데이터를 읽고 쓰는 방법을 구현합니다.

# `CMD16` (SET_BLOCKLEN)

SDCard의 읽기 및 쓰기 작업은 설정된 길이의 블록으로 수행됩니다. 블록 길이는 `CMD16`을 사용해서 설정할 수 있습니다. 이 글에서는 블록 길이가 항상 512바이트로 설정되는 SDHC와 SDXC만 고려합니다.

# `CMD17` (READ_SINGLE_BLOCK)

`CMD17`(READ_SINGLE_BLOCK)은 단일 블록 읽기 명령입니다. `CMD17`의 형식은 아래와 같습니다.

![CMD17 Format](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_1.png)

Argument에 SDCard에서 읽을 주소를 지정해야 합니다. SDHC와 SDXC는 블록 주소로 지정됩니다. 예를 들어 주소를 `0`으로 설정하면 `0`~`511` 바이트를 읽어 오고, 주소를 `1`으로 설정하면 `512`~`1023` 바이트를 읽어 옵니다. 32비트를 사용했을 때 SDCard에서 읽을 수 있는 최대 크기는 `(2^32)*512 = 2048MB` 또는 `2TB`입니다.

단일 블록을 읽어오는 과정은 아래 다이어그램을 참고하세요.

![Single Block Read Operation](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_2.png)

`CMD17`이 전송되면 `R1`으로 응답하고 데이터 블록이 CRC와 함께 옵니다. `R1` Response를 보내는 것과 첫 번째 데이터 바이트 사이에 시간이 걸릴 수도 있습니다. 데이터가 실제로 시작되는 시점은 단일 데이터 블록일 경우에는 시작 토큰인 `0xFE`(`11111110b`)가 먼저 옵니다.

![Single Block - Start Token](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_3.png)

시작 토큰과 함께 SDCard는 블록 길이(SDHC와 SDXC는 항상 512바이트) 만큼 데이터를 보냅니다. 그다음에 16비트의 CRC가 옵니다.

```c
#define CMD17                   17
#define CMD17_CRC               0x00
#define SD_MAX_READ_ATTEMPTS    1563

/*
  512바이트 단일 블록을 읽습니다
  token = 0xFE // 읽기 성공
  token = 0x0X // 데이터 에러
  token = 0xFF // 타임아웃
*/
uint8_t sdReadSingleBlock(uint32_t addr, uint8_t *buf, uint8_t *token)
{
    uint8_t res1, read;
    uint16_t readAttempts;

    // Token을 초기화 합니다
    *token = 0xFF;

    // SDCard CS Assert
    spiTransfer(0xFF);
    CS_ENABLE();
    spiTransfer(0xFF);

    // CMD17 전송
    sdCommand(CMD17, addr, CMD17_CRC);

    // Response를 읽습니다
    res1 = sdReadRes1();

    // SDCard에서 Response를 받은 경우
    if(res1 != 0xFF)
    {
        // Response Token을 기다립니다 (Timeout은 100ms 입니다)
        readAttempts = 0;
        while(++readAttempts != SD_MAX_READ_ATTEMPTS)
            if((read = spiTransfer(0xFF)) != 0xFF) break;

        // Response Token이 0xFE(시작 토큰)인 경우
        if(read == 0xFE)
        {
            // 512바이트의 블록을 읽습니다
            for(uint16_t i = 0; i < 512; i++) *buf++ = spiTransfer(0xFF);

            // 16비트의 CRC를 읽습니다
            spiTransfer(0xFF);
            spiTransfer(0xFF);
        }

        // Token을 SDCard의 Response로 설정합니다
        *token = read;
    }

    // SDCard CS Deassert
    spiTransfer(0xFF);
    CS_DISABLE();
    spiTransfer(0xFF);

    return res1;
}
```

`sdReadSingleBlock()`는 32비트의 `addr`을 Argumemt로 사용하고, 데이터를 저장하기 위해 최소 512바이트의 버퍼(`buf`)가 필요합니다. 데이터 토큰을 저장하는 데 사용할 8비트 값에 대한 포인터(`token`)도 함께 전달합니다.

`R1`을 읽을 후 비어 있지 않은 경우(카드가 명령에 응답한 경우) 토큰을 받거나 Timeout까지 SDCard를 계속 폴링 합니다.

```c
// SDCard에서 Response를 받은 경우
    if(res1 != 0xFF)
    {
        // Response Token을 기다립니다 (Timeout은 100ms 입니다)
        readAttempts = 0;
        while(++readAttempts != SD_MAX_READ_ATTEMPTS)
            if((read = spiTransfer(0xFF)) != 0xFF) break;
    }
```

[SDCard Physical Specification](/assets/file/2022-08-28-AVR-ATmega328P-SDCard-1/Part_1_Physical_Layer_Simplified_Specification_Ver2.00_060925.pdf)의 4.6.2.1 섹션을 보면 아래와 같은 내용이 있습니다:

> Host는 단일 및 다중 읽기 작업에 대해 최소 100ms의 Timeout을 사용해야 합니다.

우리의 환경은 16MHz의 발진기(Oscillator)를 사용하고 SPI의 클럭을 128로 나누도록 설정했습니다. 따라서 100ms을 만족하기 위해 SPI를 통해 보내야 하는 바이트의 개수를 얻으려면 아래와 같이 계산할 수 있습니다.

`(0.1s * 16000000 Hz) / (128 * 8 Bytes) = 1562.5 ≈ 1563`

시작 토큰을 받으면 버퍼에 512바이트를 넣고, 16비트 CRC를 읽습니다.

```c
// Response Token이 0xFE(시작 토큰)인 경우
if(read == 0xFE)
{
    // 512바이트의 블록을 읽습니다
    for(uint16_t i = 0; i < 512; i++) *buf++ = spiTransfer(0xFF);

    // 16비트의 CRC를 읽습니다
    spiTransfer(0xFF);
    spiTransfer(0xFF);
}
```

시작 토큰을 받지 못하면 SDCard에서 블록을 읽으려고 시도하지 않습니다. 토큰이 `0xFF` 이면 SDCard에서 아무것도 수신하지 못한 것입니다. 이럴 경우에는 Timeout이 발생하게 됩니다. 만약 이런 경우가 아니라면 오류 토큰을 수신해야 합니다. 오류 토큰을 수신하는 부분은 나중에 다시 자세하게 설명하겠습니다.

# 테스트 해보기

[이전 글](https://kyuhyuk.kr/article/avr/2022/09/02/AVR-ATmega328P-SDCard-3)의 초기화 코드를 사용하여 SDCard에서 맨 처음 블록을 읽어 보겠습니다.

```c
#define SD_R1_NO_ERROR(X)   X < 0x02

int main(void)
{
  // Response를 담을 배열을 선언합니다
  uint8_t res[5], sdBuf[512], token;

  // UART를 초기화 합니다
  const unsigned int baudRate = (F_CPU / 16 / 9600) - 1;
  uartInit(baudRate);

  // SPI를 초기화 합니다
  spiInit();

  // SDCard를 초기화 합니다
  if (sdInit() != SD_SUCCESS)
  {
    uartPuts("Error initializaing SD CARD\r\n");
    while (1)
      ;
  }
  else
  {
    uartPuts("SD Card initialized\r\n");

    // Sector 0을 읽습니다
    res[0] = sdReadSingleBlock(0x00000000, sdBuf, &token);

    // Response를 출력합니다
    if (SD_R1_NO_ERROR(res[0]) && (token == 0xFE))
    {
      for (uint16_t i = 0; i < 512; i++)
      {
        if (i % 32 == 0)
          uartPuts("\r\n");
        uartPutHex8(sdBuf[i]);
      }
      uartPuts("\r\n");
    }
    else
    {
      uartPuts("Error reading sector\r\n");
    }
  }

  while (1)
    ;
}
```

UART에 아래와 같이 출력됩니다:  
![UART - Read Single Block](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_4.png)

마지막 2개의 바이트 `0x55`와 `0xAA`는 MBR에 있는 Boot Signature 입니다. SDCard를 읽기 전에 PC에서 이미 포맷한 경우에는 2개의 바이트는 동일하게 표시될 것입니다.

Logic Analyzer로 보면, `R1`에서 데이터 블록 전송을 하는 부분은 아래와 같이 보일 것입니다.  
![Logic Analyzer - Read Single Block](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_5.png)

위의 스크린샷을 보면 시작 토큰을 보내기 전에 5바이트 동안은 SDCard는 IDLE 상태였습니다. (시작 토큰이 없으면 SDCard가 IDLE 상태인지 모두 `1`인 데이터인지를 구분할 수 없습니다)

# Read Errors

SDCard가 요청된 데이터를 찾을 수 없는 경우에는 데이터 시작 토큰 대신 데이터 오류 토큰을 보냅니다. 이 과정은 아래 다이어그램에서 볼 수 있습니다.

![Read Operation - Data Error](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_6.png)

데이터 오류 토큰의 형식은 아래와 같습니다.

![Data Error Token](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_7.png)

먼저 오류 토큰을 출력하는 `sdPrintDataErrToken()`을 작성하겠습니다:

```c
#define SD_TOKEN_OOR(X)     X & 0b00001000
#define SD_TOKEN_CECC(X)    X & 0b00000100
#define SD_TOKEN_CC(X)      X & 0b00000010
#define SD_TOKEN_ERROR(X)   X & 0b00000001

void sdPrintDataErrToken(uint8_t token)
{
    if(SD_TOKEN_OOR(token))
        uartPuts("\tData out of range\r\n");
    if(SD_TOKEN_CECC(token))
        uartPuts("\tCard ECC failed\r\n");
    if(SD_TOKEN_CC(token))
        uartPuts("\tCC Error\r\n");
    if(SD_TOKEN_ERROR(token))
        uartPuts("\tError\r\n");
}
```

SDCard의 범위를 벗어난 메모리 위치에 접근하려고 하면, 아마 데이터 토큰이 아닌 오류 토큰을 받게 될 것입니다. 메모리 주소 `0xFFFFFFFF`에 접근해 보겠습니다. 2TB의 SDCard가 아니라면 오류가 발생할 것입니다.

```c
uint8_t res, sdBuf[512], token;
res = sdReadSingleBlock(0xffffffff, sdBuf, &token);

uartPuts("Response 1:\r\n");
sdPrintR1(res);

// 오류 토큰을 수신했을때
if(!(token & 0xF0))
{
    uartPuts("Error token:\r\n");
    sdPrintDataErrToken(token);
}
else if(token == 0xFF)
{
    uartPuts("Timeout\r\n");
}
```

다음은 UART를 통해 출력되는 내용입니다.  
![SanDisk SDCard](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_8.png)

`R1`에서 주소 오류가 있다고 출력합니다. 하지만, 오류 토큰은 보이지 않습니다.

사실 이 동작은 SDCard마다 다르게 응답합니다. 방금 UART로 출력된 내용은 SanDisk SDCard에서 출력되었습니다. 만약 Samsung SDCard에서 동일한 코드를 실행하면 아래와 같이 출력됩니다.  
![Samsung SDCard](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_9.png)

혹시 코드가 잘못되었나 확인하기 위해 Logic Analyzer로 확인해 봤지만, 제가 가진 SDCard에서는 오류 토큰을 받은 적이 없으며 ~100ms 후에 Timeout이 되었습니다.  
![Logic Analyzer - Read Single Block](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_10.png)

# `CMD24` (WRITE_BLOCK)

읽기와 마찬가지로 쓰기도 512바이트 블록에서 수행됩니다. `CMD24`를 사용하여 쓰기를 수행합니다. 이 명령의 형식은 아래와 같습니다.

![CMD24](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_11.png)

단일 블록에 쓰는 방법은 아래와 같습니다.

![Single Block Write Operation](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_12.png)

`CMD24`를 보내고 Response(`R1`)을 기다린 다음, Start Block Token(`0xFE`)를 보내고 쓸 데이터 512바이트를 보냅니다. 그리고 SDCard에서 새로운 유형의 토큰인 Data Response Token을 기다립니다. Data Response Token의 형식은 아래와 같습니다.

![Data Response Token](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_13.png)

SDCard가 데이터를 수락하면 Token `xxx00101b`를 받게 됩니다. SDCard는 데이터 쓰기 작업이 완료될 때까지 Busy Token인 `0x00`을 보냅니다.

방금 설명한 내용을 바탕으로 `sdWriteSingleBlock()`를 작성해 보겠습니다.

```c
#define CMD24                   24
#define CMD24_ARG               0x00
#define CMD24_CRC               0x00
#define SD_MAX_WRITE_ATTEMPTS   3907
#define SD_BLOCK_LEN            512
#define SD_START_TOKEN          0xFE
#define SD_ERROR_TOKEN          0x00

/*
  512바이트 단일 블록을 기록합니다
  token = 0x00 // Busy 타임아웃
  token = 0x05 // 데이터 수락
  token = 0xFF // 응답 타임아웃
*/
uint8_t sdWriteSingleBlock(uint32_t addr, uint8_t *buf, uint8_t *token)
{
    uint8_t res1;
    uint8_t readAttempts, read;

    // Token을 초기화 합니다
    *token = 0xFF;

    // SDCard CS Assert
    spiTransfer(0xFF);
    CS_ENABLE();
    spiTransfer(0xFF);

    // CMD24 전송
    sdCommand(CMD24, addr, CMD24_CRC);

    // Response를 읽습니다
    res1 = sdReadRes1();

    // Response에 오류가 없는 경우
    if(res1 == SD_READY)
    {
        // Start Token을 전송합니다
        spiTransfer(SD_START_TOKEN);

        // Buffer의 내용을 전송합니다
        for(uint16_t i = 0; i < SD_BLOCK_LEN; i++) spiTransfer(buf[i]);

        // Response를 기다립니다 (Timeout = 250ms)
        readAttempts = 0;
        while(++readAttempts != SD_MAX_WRITE_ATTEMPTS)
            if((read = spiTransfer(0xFF)) != 0xFF) { *token = 0xFF; break; }

        // 데이터가 수락되면 실행합니다
        if((read & 0x1F) == 0x05)
        {
            // Token을 '데이터 수락'으로 설정
            *token = 0x05;

            // 쓰기 작업이 끝날때까지 기다립니다 (Timeout = 250ms)
            readAttempts = 0;
            while(spiTransfer(0xFF) == 0x00)
                if(++readAttempts == SD_MAX_WRITE_ATTEMPTS) { *token = 0x00; break; }
        }
    }

    // SDCard CS Deassert
    spiTransfer(0xFF);
    CS_DISABLE();
    spiTransfer(0xFF);

    return res1;
}
```

읽기 작업과 마찬가지로 타임아웃 값을 설정합니다. [SDCard Physical Specification](/assets/file/2022-08-28-AVR-ATmega328P-SDCard-1/Part_1_Physical_Layer_Simplified_Specification_Ver2.00_060925.pdf)의 4.6.2.2 섹션을 보면 모든 쓰기 작업에 대해 타임아웃은 250ms로 정의해야 한다고 언급하고 있습니다. `(0.25s * 16000000 Hz) / (128 * 8 Bytes) = 3906.25`이지만, `3907`로 250ms보다 조금 크게 설정했습니다.

```c
#define SD_MAX_WRITE_ATTEMPTS   3907
```

`CMD24`(쓰기 명령)을 SDCard에 보내고 `R1` Response에 오류가 없는지 확인합니다.

```c
// CMD24 전송
sdCommand(CMD24, addr, CMD24_CRC);

// Response를 읽습니다
res[0] = sdReadRes1();

// Response에 오류가 없는 경우
if(res[0] == SD_READY)
{
    /* ... */
}
```

`R1`에 오류가 없으면 Start Token을 보낸 다음 Buffer에서 데이터 전송을 시작합니다.

```c
// Start Token을 전송합니다
spiTransfer(SD_START_TOKEN);

// Buffer의 내용을 전송합니다
for(uint16_t i = 0; i < SD_BLOCK_LEN; i++) spiTransfer(buf[i]);
```

Buffer의 내용을 전송하는 작업이 끝나면, SDCard가 Data Response Token을 보낼 때까지 기다립니다. 데이터 수락 토큰은 `xxx00101b` 입니다.

```c
// Response를 기다립니다 (Timeout = 250ms)
readAttempts = 0;
while(++readAttempts != SD_MAX_WRITE_ATTEMPTS)
    if((read = spiTransfer(0xFF)) != 0xFF) { *token = 0xFF; break; }

// 데이터가 수락되면 실행합니다
if((read & 0x1F) == 0x05)
{
    /* ... */
}
```

마지막으로 SDCard가 데이터를 쓰는 것을 완료할 때까지 기다립니다.

```c
// 쓰기 작업이 끝날때까지 기다립니다 (Timeout = 250ms)
readAttempts = 0;
while(spiTransfer(0xFF) == 0x00)
    if(++readAttempts == SD_MAX_WRITE_ATTEMPTS) { *token = 0x00; break; }
```

이제 간단한 데이터를 한번 기록해 봅시다. `0x55`로 만 이루어진 버퍼를 SDCard의 `0x00000100`에 써보겠습니다.

```c
// 0x55로 버퍼를 채웁니다
for(uint16_t i = 0; i < 512; i++) buf[i] = 0x55;

// 주소 0x100 (256)에 0x55를 기록합니다
res = sdWriteSingleBlock(0x00000100, buf, &token);
```

위의 코드를 실행해 보면 아래와 같이 `0x00`으로 채워져있던 `0x00000100`에 `0x55`가 기록된 것을 볼 수 있습니다.  
![sdWriteSingleBlock UART](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_14.png)

Logic Analyzer로 확인해 보면 `R1`으로 응답한 뒤 바로 시작 토큰을 보내고, 기록할 데이터 전송을 시작합니다.  
![Logic Analyzer](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_15.png)

전송이 끝날 때, SDCard는 응답 토큰 `0xE5`(`11100101b`)를 보냅니다. 데이터 수락 토큰은 `xxx00101b` 형식이므로 데이터를 성공적으로 보낸 것을 확인할 수 있습니다. 그 이후에 SDCard는 Busy 상태인 것을 나타내기 위해 `0x00`을 보냅니다.  
![Logic Analyzer](/assets/image/2022-09-03-AVR-ATmega328P-SDCard-4/AVR-ATmega328P-SDCard-4_16.png)

참고로 `sdWriteSingleBlock()`을 호출한 후 확인해야 하는 4가지 경우가 있습니다. 이 부분은 각자 구현해 보면 좋을 거 같습니다.

- `R1 != 0x00` → 블록 쓰기 오류 (자세한 내용은 `R1`을 분석해야 합니다)
- `R1 == 0x00` && `token == 0x05` → 성공
- `R1 == 0x00` && `token == 0x00` → 타임아웃
- `R1 == 0x00` && `token == 0xFF` → `R1` 이후 응답 없음
