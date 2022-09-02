---
title: '[AVR] ATmega328P SDCard 구현 (3)'
date: '2022-09-02 23:57:51'
category: AVR
---

[이전 글](https://kyuhyuk.kr/article/avr/2022/09/01/AVR-ATmega328P-SDCard-2)에서 `CMD0`, `CMD8` 그리고 `CMD58`을 사용하는 방법을 소개했습니다. 이제 SDCard의 초기화 과정을 거의 완료했습니다. 아래 다이어그램을 보면 다음 단계는 `ACMD41`라는 것을 알 수 있습니다.

![SDCard SPI Mode Initalization Flow](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_5.png)

# `ACMD41` (SD_SEND_OP_COND)

`ACMD41`(Send Operating Condition)는 SDCard의 초기화 과정을 시작합니다. 여기서 주의해야 하는 점은 `ACMD41`과 같이 `A`로 시작하는 Command는 사용하기 전에 `CMD55`(APP_CMD)를 보내서 다음에 사용하려는 Command이 `ACMD`라는 것을 SDCard에게 알려야 합니다.

다음은 `CMD55`의 형식입니다:

![CMD55 Format](/assets/image/2022-09-02-AVR-ATmega328P-SDCard-3/AVR-ATmega328P-SDCard-3_1.png)

`ACMD41`의 형식은 아래와 같습니다:

![ACMD41 Format](/assets/image/2022-09-02-AVR-ATmega328P-SDCard-3/AVR-ATmega328P-SDCard-3_2.png)

`ACMD41`의 대부분 비트는 Reserved이지만, 고용량 카드를 지원함을 나타내기 위해 Bit 30을 1로 설정하는 부분이 있습니다. CRC는 이러한 명령에 대해 무시되므로 아무거나 설정할 수 있습니다.

```c
#define CMD55       55
#define CMD55_ARG   0x00000000
#define CMD55_CRC   0x00

#define ACMD41      41
#define ACMD41_ARG  0x40000000
#define ACMD41_CRC  0x00
```

`ACMD41`은 `CMD41`과 마찬가지로 Command Index를 `41`을 사용합니다. `CMD55`가 먼저 전송되지 않는 경우에는 `CMD41`가 전송됩니다.

`CMD55`와 `ACMD41`은 `R1`의 Response를 반환합니다.

```c
uint8_t sdSendApp()
{
    // SDCard CS Assert
    spiTransfer(0xFF);
    CS_ENABLE();
    spiTransfer(0xFF);

    // CMD55 전송
    sdCommand(CMD55, CMD55_ARG, CMD55_CRC);

    // Response를 읽습니다
    uint8_t r1 = sdReadRes1();

    // SDCard CS Deassert
    spiTransfer(0xFF);
    CS_DISABLE();
    spiTransfer(0xFF);

    return r1;
}

uint8_t sdSendOpCond()
{
    // SDCard CS Assert
    spiTransfer(0xFF);
    CS_ENABLE();
    spiTransfer(0xFF);

    // ACMD41 전송
    sdCommand(ACMD41, ACMD41_ARG, ACMD41_CRC);

    // Response를 읽습니다
    uint8_t r1 = sdReadRes1();

    // SDCard CS Deassert
    spiTransfer(0xFF);
    CS_DISABLE();
    spiTransfer(0xFF);

    return r1;
}
```

위에서 설명했듯이 `ACMD41`은 초기화 과정을 시작합니다. Startup Sequence에서 SDCard가 `R1 = 0x00`인 'in_idle_state'로 응답할 때까지 `ACMD41`(항상 `CMD55`를 먼저 보내고 실행)을 계속 보냅니다.

`R1 = 0x00`을 받으면 CCS 값을 보기 위해 `CMD58`을 보내야 합니다. CCS를 통해 SDCard가 SDHC(고용량 SDCard)인지 SCXC(확장 용량 SDCard)인지 알 수 있습니다.

[이전 글](https://kyuhyuk.kr/article/avr/2022/09/01/AVR-ATmega328P-SDCard-2)에서 작성한 `main()`을 아래와 같이 수정합니다.

```c
/*
  CPU의 Frequency를 16MHz로 설정합니다
*/
#define F_CPU 16000000UL
#include <util/delay.h>

int main(void)
{
  uint8_t res[5];
  char c;

  // UART를 초기화 합니다
  const unsigned int baudRate = (F_CPU / 16 / 9600) - 1;
  uartInit(baudRate);

  // SPI를 초기화 합니다
  spiInit();

  // SDCard에 VCC가 충분히 공급될때까지 기다립니다
  _delay_ms(10);

  // Power Up Sequence를 시작합니다
  sdPowerUpSeq();

  while (1)
  {
    // 메뉴를 출력합니다
    uartPuts("MENU\r\n");
    uartPuts("------------------\r\n");
    uartPuts("0 - Send CMD0\r\n1 - Send CMD8\r\n2 - Send CMD58\r\n");
    uartPuts("3 - Send CMD55\r\n4 - Send ACMD41\r\n");
    uartPuts("------------------\r\n");

    // 사용자에게 명령(문자)를 입력받습니다
    c = uartGet();

    if (c == '0')
    {
      // CMD0을 보내고 응답을 읽고 출력합니다
      uartPuts("Sending CMD0...\r\n");
      res[0] = sdGoIdleState();
      uartPuts("Response:\r\n");
      sdPrintR1(res[0]);
    }
    else if (c == '1')
    {
      // CMD8을 보내고 응답을 읽고 출력합니다
      uartPuts("Sending CMD8...\r\n");
      sdSendIfCond(res);
      uartPuts("Response:\r\n");
      sdPrintR7(res);
    }
    else if (c == '2')
    {
      // CMD58을 보내고 응답을 읽고 출력합니다
      uartPuts("Sending CMD58...\r\n");
      sdReadOcr(res);
      uartPuts("Response:\r\n");
      sdPrintR3(res);
    }
    else if (c == '3')
    {
      // CMD55를 보내고 응답을 읽고 출력합니다
      uartPuts("Sending CMD55...\r\n");
      res[0] = sdSendApp();
      uartPuts("Response:\r\n");
      sdPrintR1(res[0]);
    }
    else if (c == '4')
    {
      // ACMD41을 보내고 응답을 읽고 출력합니다
      uartPuts("Sending ACMD41...\r\n");
      res[0] = sdSendOpCond();
      uartPuts("Response:\r\n");
      sdPrintR1(res[0]);
    }
    else
    {
      uartPuts("Unrecognized command\r\n");
    }
  }
}
```

`CMD0`을 보낸 다음 `CMD8`과 `CMD58`을 보냅니다. SDCard가 Ready 되었다고 출력될 때까지 `CMD55`와 `ACMD41`을 차례대로 보냅니다.  
![CLI 1](/assets/image/2022-09-02-AVR-ATmega328P-SDCard-3/AVR-ATmega328P-SDCard-3_3.png)

SDCard가 Ready가 되었다면, CCS를 얻기 위해 마지막에 `CMD58`을 보냅니다.  
![CLI 2](/assets/image/2022-09-02-AVR-ATmega328P-SDCard-3/AVR-ATmega328P-SDCard-3_4.png)

`ACMD41`을 처음 보낼 때는 IDLE 상태로 출력되었지만, 두 번째에는 Ready 상태임을 확인할 수 있습니다. 그 이후에 `CMD58`을 사용해서 OCR을 읽을 때 SDCard가 Power Up Process를 완료했으므로 CCS 비트가 유효하다고 볼 수 있습니다. 위의 경우에는 `1`로 설정되어 있는데, 이것은 SDXC 또는 SDHD를 사용하고 있음을 의미합니다.

# SDCard 초기화

이제 SDCard를 초기화하는 `sdInit()`을 구현해 보겠습니다. SDCard 초기화를 구현하기 위해서 Power Up Diagram을 다시 봐봅시다:

![Power-up Diagram](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_3.png)

위의 다이어그램을 보면, `ACMD41`의 타임아웃은 1초입니다. 최소 1초 동안 SDCard 초기화를 계속 시도해야 합니다. 우리는 `ACMD41`을 다시 시도할 때 10ms의 Delay를 설정하고, 최대 100번을 시도하도록 구현할 것입니다.

```c
#define SD_READY    0
#define SD_SUCCESS  0
#define SD_ERROR    1

uint8_t sdInit()
{
    uint8_t res[5], cmdAttempts = 0;

    sdPowerUpSeq();

    /*
      CMD0을 보내서 SDCard를 IDLE로 만듭니다
      최대 10번 Retry 합니다
    */
    while((res[0] = sdGoIdleState()) != 0x01)
    {
        cmdAttempts++;
        if(cmdAttempts > 10) return SD_ERROR;
    }

    // CMD8을 보냅니다
    sdSendIfCond(res);
    if(res[0] != 0x01)
    {
        return SD_ERROR;
    }

    // Echo Pattern을 확인합니다
    if(res[4] != 0xAA)
    {
        return SD_ERROR;
    }

    // ACMD41을 통해 SDCard 초기화를 시도합니다
    cmdAttempts = 0;
    do
    {
        if(cmdAttempts > 100) return SD_ERROR;

        // ACMD41을 보내기전에 CMD55를 보냅니다
        res[0] = sdSendApp();

        // Response에 Error가 없다면 ACMD41을 보냅니다
        if(res[0] < 2)
        {
            res[0] = sdSendOpCond();
        }

        // 10ms동안 기다립니다
        _delay_ms(10);

        cmdAttempts++;
    }
    while(res[0] != SD_READY);

    // OCR을 읽습니다
    sdReadOcr(res);

    // SDCard가 Ready 상태인지 확인합니다
    if(!(res[1] & 0x80)) return SD_ERROR;

    return SD_SUCCESS;
}
```

여기까지 모두 진행했다면 SPI 모드에서 SDCard를 초기화하는 것을 성공한 것입니다!
