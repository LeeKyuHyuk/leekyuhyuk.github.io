---
title: '[AVR] ATmega328P SDCard 구현 (2)'
date: '2022-09-01 22:50:19'
category: AVR
---

[이전 글](https://kyuhyuk.kr/article/avr/2022/08/28/AVR-ATmega328P-SDCard-1)에서 `CMD0`를 사용해서 SDCard를 IDLE 상태로 만들었습니다. 이 글에서는 그 이후의 초기화 과정을 소개하고 구현해 볼 것입니다.

![SDCard SPI Mode Initalization Flow](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_5.png)

# `CMD8` (SEND_IF_COND)

`CMD8`(SEND_IF_COND, Send Interface Condition)은 장착된 SDCard가 Version 1.0인지 Version 2.0 (또는 그 이상)인지 확인하는 데 사용됩니다. SDCard가 Version 1.0인 경우에는 R1의 형태의 응답의 Bit 2가 `1` 입니다. 이럴 경우에는 초기화 다이어그램에서 왼쪽(Illegal Command)으로 내려갑니다. 만약 그렇지 않으면 Version 2.0로 이동하게 됩니다. 참고로 이 글에서는 Version 2.0의 SDCard를 사용하고 있습니다.

![SDCard SPI Mode Initalization Flow](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_1.png)

`CMD8`를 전송하기 위해 Command Index를 `8 (001000b)`로 설정합니다. 3.3V에서 작동하므로 `VHS`는 `0001b`로 설정합니다. Check Pattern은 아무 값이나 설정이 가능하며, SDCard는 명령이 올바르게 처리되었는지 확인하기 위해 응답으로 반환합니다. 참고로 [SDCard Physical Specification](/assets/file/2022-08-28-AVR-ATmega328P-SDCard-1/Part_1_Physical_Layer_Simplified_Specification_Ver2.00_060925.pdf) 51페이지를 보면 `10101010b`를 권장하고 있습니다. 그리고 마지막으로 CRC를 설정해야 하는데 `CMD8`은 올바른 CRC가 필요한 `CMD0` 이외의 유일한 명령입니다. 3.3V `VHS`를 사용하고 권장되는 Check Pattern를 Command에 지정된 대로 모든 비트를 설정하면 올바른 CRC는 `01000011b` 입니다. 아래와 같이 `CMD8` 명령을 전송할 수 있습니다.

만약, CRC 계산을 직접 하고 싶다면, [CRC7-MMC Calculator](https://kyuhyuk.kr/crc7-mmc-calc/)에 접속해서 계산할 수 있습니다.  
계산 방법은 [https://github.com/LeeKyuHyuk/crc7-mmc-calc](https://github.com/LeeKyuHyuk/crc7-mmc-calc)를 참조하시길 바랍니다.  
![CRC7-MMC Calculator](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_2.png)

```c
#define CMD8        8
#define CMD8_ARG    0x000001AA // 0000000110101010b
/*
    CMD8_CRC = (01000011 << 1)
    End Bit자리를 만들어줘야 하기 때문에 << 1 을 합니다
    End Bit을 1로 설정하는 부분은 sdCommand()의
    spiTransfer(crc | 0x01); 에서 처리합니다
*/
#define CMD8_CRC    0x86

// send CMD8
sdCommand(CMD8, CMD8_ARG, CMD8_CRC);
```

# R7 Response

`CMD8`에 대한 응답은 `R7` 형식으로 수신받으며, 아래와 같습니다:

![R7 Response Format](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_3.png)

`R7`의 길이는 5바이트이며, 첫 번째 바이트는 `R1`과 동일합니다. 그다음에는 Command Version, Voltage Accepted 필드와 Command에서 보낸 Check Pattern의 'Echo-Back'이 있습니다. 만약 SDCard가 Version 1.0이면 Illegal Bit Command가 Set된 `R1`을 반환합니다.

이제 `R7`을 수신하는 `sdReadRes7()`를 작성해 봅시다.

> [이전 글](https://kyuhyuk.kr/article/avr/2022/08/28/AVR-ATmega328P-SDCard-1)에서 작성한 `sdReadRes1()`을 사용합니다.

```c
void sdReadRes7(uint8_t *res)
{
    // R7에서 R1 Response를 읽습니다
    res[0] = sdReadRes1();

    /*
      R1 Response에 Error가 존재하면
      더 이상 진행하지 않고 반환합니다
    */
    if(res[0] > 1) return;

    /*
      R1 Response에 Error가 없다면
      남은 바이트를 읽습니다
    */
    res[1] = spiTransfer(0xFF);
    res[2] = spiTransfer(0xFF);
    res[3] = spiTransfer(0xFF);
    res[4] = spiTransfer(0xFF);
}
```

# `CMD8` 함수 구현하기

위에서 작성한 코드를 바탕으로 `CMD8`을 전송하고 응답을 받아보겠습니다.

```c
void sdSendIfCond(uint8_t *res)
{
    // SDCard CS Assert
    spiTransfer(0xFF);
    CS_ENABLE();
    spiTransfer(0xFF);

    // CMD8 전송
    sdCommand(CMD8, CMD8_ARG, CMD8_CRC);

    // CMD8에 대한 Rsponse를 읽습니다
    sdReadRes7(res);

    // SDCard CS Deassert
    spiTransfer(0xFF);
    CS_DISABLE();
    spiTransfer(0xFF);
}
```

`sdSendIfCond()`에서 사용되는 `res`는 전체 Response(5바이트)를 담을 수 있는 `uint8_t` 배열에 대한 포인터를 받습니다.

# UART로 출력하기

SDCard가 무엇을 하는지 보기 위해 UART로 출력하는 부분을 구현합니다. UART 구현의 부분은 [이 글](https://kyuhyuk.kr/article/avr/2022/08/28/AVR-ATmega328P-UART)을 참고해 주세요.

일단 `R1`을 출력하는 `sdPrintR1()`을 구현합시다.

```c
#define PARAM_ERROR(X)      X & 0b01000000
#define ADDR_ERROR(X)       X & 0b00100000
#define ERASE_SEQ_ERROR(X)  X & 0b00010000
#define CRC_ERROR(X)        X & 0b00001000
#define ILLEGAL_CMD(X)      X & 0b00000100
#define ERASE_RESET(X)      X & 0b00000010
#define IN_IDLE(X)          X & 0b00000001

void sdPrintR1(uint8_t res)
{
    if(res & 0b10000000) {
        uartPuts("\tError: MSB = 1\r\n");
        return;
    }
    if(res == 0) {
        uartPuts("\tCard Ready\r\n");
        return;
    }
    if(PARAM_ERROR(res))
        uartPuts("\tParameter Error\r\n");
    if(ADDR_ERROR(res))
        uartPuts("\tAddress Error\r\n");
    if(ERASE_SEQ_ERROR(res))
        uartPuts("\tErase Sequence Error\r\n");
    if(CRC_ERROR(res))
        uartPuts("\tCRC Error\r\n");
    if(ILLEGAL_CMD(res))
        uartPuts("\tIllegal Command\r\n");
    if(ERASE_RESET(res))
        uartPuts("\tErase Reset Error\r\n");
    if(IN_IDLE(res))
        uartPuts("\tIn Idle State\r\n");
}
```

`sdPrintR1()`는 Response에 존재할 수 있는 오류들을 확인하고 설명을 출력합니다. 만약, MSB가 `1`(Response 수신 오류를 나타냅니다)이고 Flag가 설정되어 있지 않은 경우(이미 SDCard 초기화되어 있을 경우)에는 즉시 반환합니다.

다음으로 위에서 작성한 거와 비슷한 `sdPrintR7()`을 구현하겠습니다.

```c
#define CMD_VER(X)          ((X >> 4) & 0xF0)
#define VOL_ACC(X)          (X & 0x1F)

#define VOLTAGE_ACC_27_33   0b00000001
#define VOLTAGE_ACC_LOW     0b00000010
#define VOLTAGE_ACC_RES1    0b00000100
#define VOLTAGE_ACC_RES2    0b00001000

void sdPrintR7(uint8_t *res)
{
    sdPrintR1(res[0]);

    if(res[0] > 1) return;

    uartPuts("\tCommand Version: ");
    uartPutHex8(CMD_VER(res[1]));
    uartPuts("\r\n");

    uartPuts("\tVoltage Accepted: ");
    if(VOL_ACC(res[3]) == VOLTAGE_ACC_27_33)
        uartPuts("2.7-3.6V\r\n");
    else if(VOL_ACC(res[3]) == VOLTAGE_ACC_LOW)
        uartPuts("LOW VOLTAGE\r\n");
    else if(VOL_ACC(res[3]) == VOLTAGE_ACC_RES1)
        uartPuts("RESERVED\r\n");
    else if(VOL_ACC(res[3]) == VOLTAGE_ACC_RES2)
        uartPuts("RESERVED\r\n");
    else
        uartPuts("NOT DEFINED\r\n");

    uartPuts("\tEcho: ");
    uartPutHex8(res[4]);
    uartPuts("\r\n");
}
```

# `CMD0`와 `CMD8` 보내기

이제 `CMD0`와 `CMD8`을 SDCard로 보내고 Response를 읽어보겠습니다.

```c
#define F_CPU 16000000UL

int main(void)
{
    // Response를 담을 배열을 선언합니다
    uint8_t res[5];

    // UART를 초기화 합니다
    const unsigned int baudRate = (F_CPU / 16 / 9600) - 1;
    uartInit(baudRate);

    // SPI를 초기화 합니다
    spiInit();

    // Power Up Sequence를 시작합니다
    sdPowerUpSeq();

    // CMD0를 SDCard로 전송합니다
    uartPuts("Sending CMD0...\r\n");
    res[0] = sdGoIdleState();
    uartPuts("Response:\r\n");
    sdPrintR1(res[0]);

    // CMD8을 SDCard로 전송합니다
    uartPuts("Sending CMD8...\r\n");
    sdSendIfCond(res);
    uartPuts("Response:\r\n");
    sdPrintR7(res);

    while(1);
}
```

UART를 통해 출력되는 내용은 아래와 같습니다:  
![UART Output](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_4.png)

정상적으로 동작하는 것을 확실하게 보고 싶다면 Logic Analyzer로 `CMD8`에 대한 Output을 확인해 보는 것도 좋습니다.  
![Logic Analyzer](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_5.png)

SDCard에서 받은 응답인 `R7`의 처음 8바이트에서 잘못된 명령으로 출력되지 않았으며, 전압 범위(2.7~3.6V)도 확인했습니다. 또한 Check Pattern인 `0xAA`를 Response에서 받을 수 있었습니다. 모두 정상 작동하는 것을 확인할 수 있습니다.

# `CMD58` (READ_OCR)

이제 다음 단계인 OCR(Operation Conditions Register)를 읽는 `CMD58`를 살펴보겠습니다.  
![CMD58 Format](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_6.png)

Argument는 Stuff Bit이고 CRC는 무시해도 됩니다. Response는 `R3` 형식으로 받으며 아래와 같습니다.  
![R3 Format](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_7.png)

`R7`과 마찬가지로 첫 번째 바이트는 `R1`과 동일하고, 다음 4바이트는 OCR이 담겨있습니다. OCR은 아래와 같이 정의되어 있습니다.  
![OCR Register Definition](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_8.png)

OCR의 Bit 15~24는 SDCard에서 지원하는 전압의 값을 나타냅니다. Bit 31은 SDCard의 Power Up 상태를 나타냅니다. 만약, SDCard가 Power Up Routine을 완료하지 않은 경우에는 LOW로 설정되어 있습니다. 그리고 Bit 30은 Power Up Status(Bit 31)이 Set된 상태에서만 유효한 값을 가지며, SDCard가 고용량(SDHC)인지 확장 용량(SCXC)인지 SDSC인지를 나타냅니다.

`CMD58`에서는 Argument와 CRC가 중요하지 않으므로 모두 `0`으로 설정합니다.

```c
#define CMD58       58
#define CMD58_ARG   0x00000000
#define CMD58_CRC   0x00

// CMD58 전송
sdCommand(CMD58, CMD58_ARG, CMD_CRC);
```

# R3 Response

`R3`을 수신하는 함수는 `R7`과 동일합니다. 둘 다 길이가 5바이트이고 `R1`으로 시작하기 때문입니다. 이전에 구현한 `sdReadRes7()`를 재사용하고 아래와 같이 이름을 바꿀 수 있습니다.

```diff
- void sdReadRes7(uint8_t *res)
+ void sdReadRes3Res7(uint8_t *res)
 {
-    // R7에서 R1 Response를 읽습니다
+    // R1 Response를 읽습니다
     res[0] = sdReadRes1();

     /*
       R1 Response에 Error가 존재하면
       더 이상 진행하지 않고 반환합니다
     */
     if(res[0] > 1) return;

     /*
       R1 Response에 Error가 없다면
       남은 바이트를 읽습니다
     */
     res[1] = spiTransfer(0xFF);
     res[2] = spiTransfer(0xFF);
     res[3] = spiTransfer(0xFF);
     res[4] = spiTransfer(0xFF);
}
```

# `CMD58` 함수 구현하기

아래와 같이 `CMD58`을 전송하고, Response를 받는 `sdReadOCR()`를 구현해 봅시다.

```c
void sdReadOCR(uint8_t *res)
{
    // SDCard CS Assert
    spiTransfer(0xFF);
    CS_ENABLE();
    spiTransfer(0xFF);

    // CMD58 전송
    sdCommand(CMD58, CMD58_ARG, CMD58_CRC);

    // Response를 읽습니다
    sdReadRes3Res7(res);

    // SDCard CS Deassert
    spiTransfer(0xFF);
    CS_DISABLE();
    spiTransfer(0xFF);
}
```

# `R3` Response와 OCR 출력하기

`R7`과 마찬가지로 먼저 `R1`을 확인하고 오류가 있으면 나머지 Response의 출력을 건너뜁니다. `R1`에 오류가 없으면 OCR을 출력합니다.

```c
#define POWER_UP_STATUS(X)  X & 0x40
#define CCS_VAL(X)          X & 0x40
#define VDD_2728(X)         X & 0b10000000
#define VDD_2829(X)         X & 0b00000001
#define VDD_2930(X)         X & 0b00000010
#define VDD_3031(X)         X & 0b00000100
#define VDD_3132(X)         X & 0b00001000
#define VDD_3233(X)         X & 0b00010000
#define VDD_3334(X)         X & 0b00100000
#define VDD_3435(X)         X & 0b01000000
#define VDD_3536(X)         X & 0b10000000

void sdPrintR3(uint8_t *res)
{
    sdPrintR1(res[0]);

    if(res[0] > 1) return;

    uartPuts("\tCard Power Up Status: ");
    if(POWER_UP_STATUS(res[1]))
    {
        uartPuts("READY\r\n");
        uartPuts("\tCCS Status: ");
        if(CCS_VAL(res[1])){ uartPuts("1\r\n"); }
        else uartPuts("0\r\n");
    }
    else
    {
        uartPuts("BUSY\r\n");
    }

    uartPuts("\tVDD Window: ");
    if(VDD_2728(res[3])) uartPuts("2.7-2.8, ");
    if(VDD_2829(res[2])) uartPuts("2.8-2.9, ");
    if(VDD_2930(res[2])) uartPuts("2.9-3.0, ");
    if(VDD_3031(res[2])) uartPuts("3.0-3.1, ");
    if(VDD_3132(res[2])) uartPuts("3.1-3.2, ");
    if(VDD_3233(res[2])) uartPuts("3.2-3.3, ");
    if(VDD_3334(res[2])) uartPuts("3.3-3.4, ");
    if(VDD_3435(res[2])) uartPuts("3.4-3.5, ");
    if(VDD_3536(res[2])) uartPuts("3.5-3.6");
    uartPuts("\r\n");
}
```

Power Up Status가 `1`인 경우에만 CCS를 출력합니다. Power Up Status가 `1`이 아닐 때는 CCS의 값이 유효하지 않기 때문입니다.

# 간단한 CLI 만들기

SDCard를 초기화하고 디버깅하는 방법을 배우는 가장 좋은 방법 중 하나는 CLI 프로그램을 만드는 것입니다. UART를 사용해서 원하는 Command를 SDCard로 보내고 Response를 출력하도록 만들 것입니다. UART에 `0`~`2`가 입력되면 `CMD0`, `CMD8`, `CMD58`을 보낼 것입니다.

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
    uartPuts("------------------\r\n");

    // 사용자에게 명령(문자)를 입력받습니다
    c = uartGet();

    if (c == '0')
    {
      // send CMD0 and read response
      uartPuts("Sending CMD0...\r\n");
      CS_ENABLE();
      sdCommand(CMD0, CMD0_ARG, CMD0_CRC);
      res[0] = sdReadRes1();
      CS_DISABLE();
      spiTransfer(0xFF);

      // print R1
      uartPuts("Response: \r\n");
      sdPrintR1(res[0]);
    }
    else if (c == '1')
    {
      // send CMD8 and read response
      uartPuts("Sending CMD8...\r\n");
      CS_ENABLE();
      sdCommand(CMD8, CMD8_ARG, CMD8_CRC);
      sdReadRes3Res7(res);
      CS_DISABLE();
      spiTransfer(0xFF);

      // print R7
      uartPuts("Response: \r\n");
      sdPrintR7(res);
    }
    else if (c == '2')
    {
      // send CMD58 and read response
      uartPuts("Sending CMD58...\r\n");
      CS_ENABLE();
      sdCommand(CMD58, CMD58_ARG, CMD58_CRC);
      sdReadRes3Res7(res);
      CS_DISABLE();
      spiTransfer(0xFF);

      // print R3
      uartPuts("Response: \r\n");
      sdPrintR3(res);
    }
    else
    {
      uartPuts("Unrecognized command\r\n");
    }
  }
}
```

SDCard의 초기화 과정과 같이 `CMD0`, `CMD8`, `CMD58`을 `0`, `1`, `2`를 차례대로 입력하여 전송해 봅시다. 그러면 아래와 같이 출력됩니다.  
![SDCard CLI](/assets/image/2022-09-01-AVR-ATmega328P-SDCard-2/AVR-ATmega328P-SDCard-2_9.png)

`CMD58`의 Response를 보면, SDCard가 2.7~3.6V 사이의 모든 전압을 지원하며, Power Up Status는 BUSY 상태입니다. (CCS가 없다는 것을 의미합니다). 만약 여기서 카드가 지원하지 않는 전압 값을 반환하면 사용할 수 없는 SDCard라고 볼 수 있습니다. 다행이게도 제가 사용한 SDCard는 실행 중인 값인 3.3V를 지원하기 때문에 초기화 과정을 계속 진행할 수 있습니다.
