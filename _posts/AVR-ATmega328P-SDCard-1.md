---
title: '[AVR] ATmega328P SDCard 구현 (1)'
date: '2022-08-28 16:49:27'
category: AVR
---

SPI(Serial Peripheral Iterface) 모드에서 ATmega328P를 사용하여 SDCard를 초기화하는 방법을 소개합니다. SPI에 익숙하지 않은 경우에는 [이 글](https://kyuhyuk.kr/article/avr/2022/08/28/AVR-ATmega328P-SPI)을 읽어보시기 바랍니다.

이 글에서 제공하는 정보의 대부분은 [SDCard Physical Specification](/assets/file/2022-08-28-AVR-ATmega328P-SDCard-1/Part_1_Physical_Layer_Simplified_Specification_Ver2.00_060925.pdf)를 참고하였습니다.

# 회로 연결

아래와 같이 회로를 구성합니다. Arduino를 연결한 이유는 `avrdude`를 사용하여 ATmega328P의 Flash에 프로그래밍(Flash Write)하기 위해 연결했습니다.

![Connections](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_1.png)

# SPI 초기화

SPI를 설정하려면 클럭의 극성, 위상 및 속도와 같은 몇 가지 설정이 필요합니다. 아쉽게도 버스 타이밍 다이어그램은 SDCard Physical Specification에는 없습니다. 그러나 다행이게도 [SanDisk SDCard 제품 설명서](/assets/file/2022-08-28-AVR-ATmega328P-SDCard-1/SecureDigitalCard_1.9.pdf)에는 아래 타이밍 다이어그램이 제공됩니다.

![Timing Diagram Data Input/Output Referenced to Clock](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_2.png)

위의 그림과 같이 클럭은 LOW로 IDLE 상태를 유지하고 출력(OUTPUT)은 `CPOL = 0` 및 `CPHA = 0`에 해당하는 Leading Edge에서 샘플링됩니다. 이 작동 방식은 다른 SDCard에서도 동일하게 작동한다고 가정할 수 있습니다.

`CPOL`과 `CPHA`는 SPI 제어 레지스터인 `SPCR`에서 기본적으로 `00`으로 설정되어 있으므로 SPI 초기화 과정에서 이것에 대해서는 아무것도 할 필요가 없습니다. 최신 SDCard는 매우 빠른 속도로 작동할 수 있지만, 일단은 디버깅을 위해 SCK를 가장 낮은 값으로 설정하고 나중에 코드가 작동하면 다시 높일 계획입니다.

코드에 사용되는 핀을 추상화하려면 기능적 이름을 지정하는게 좋습니다. 또한 SDCard에 대한 모든 SPI 명령은 마이크로컨트롤러가 먼저 `CS`(Chip Select)라인을 Assert(Inactive에서 Active 상태로 전환) 해야 합니다. 이것이 완료되면 CS를 HIGH 상태로 되돌려야 합니다. 이러한 간단한 명령을 간단하게 전처리기 매크로를 사용하여 구현합니다.

아래는 SPI 초기화 및 송신/수신 기능과 핀 정의 및 유용한 매크로가 있는 코드입니다:

```c
#define DDR_SPI         DDRB
#define PORT_SPI        PORTB
#define CS              PINB2
#define MOSI            PINB3
#define MISO            PINB4
#define SCK             PINB5

#define CS_ENABLE()     PORT_SPI &= ~(1 << CS)
#define CS_DISABLE()    PORT_SPI |= (1 << CS)

void spiInit()
{
    // CS와 MOSI, SCK를 출력으로 설정합니다
    DDR_SPI |= (1 << CS) | (1 << MOSI) | (1 << SCK);

    // MISO를 Pull-up 레지스터로 활성화 합니다
    DDR_SPI |= (1 << MISO);

    // SPI를 활성화하고 Master로 Clock은 fOSC/128로 설정합니다.
    SPCR = (1 << SPE) | (1 << MSTR) | (1 << SPR1) | (1 << SPR0);
}

uint8_t spiTransfer(uint8_t data)
{
    // SPI로 전송할 데이터를 SPDR(SPI Data Register)에 저장
    SPDR = data;

    /*
      SPIF(SPI Interrupt Flag)가 Set될 때까지 기다립니다
      SPIF가 Set이 되었다면 SPI로 데이터가 전송이 완료된것입니다
    */
    while(!(SPSR & (1 << SPIF)));

    // SPDR을 반환합니다
    return SPDR;
}
```

# Power Up Sequence

SDCard Physical Specification에서 Power Up Sequence는 아래와 같습니다.

![Power-up Diagram](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_3.png)

SDCard에 명령을 보내기 전에는 최소 1msec의 Delay와 74개의 클럭 사이클을 보내야 합니다. 각 바이트에 대해 8개의 클럭 사이클이 있으므로 총 80개의 클럭 사이클에 대해 10바이트를 보낼 수 있습니다. 또한 이 작업을 할 동안에는 CS를 HIGH로 유지해야 합니다.

```c
/* CPU의 Frequency를 16MHz로 설정합니다 */
#define F_CPU 16000000UL
#include<util/delay.h>

void sdPowerUpSeq()
{
    // SDCard CS Assert
    CS_ENABLE();

    // SDCard에 전원이 공급되는데 최소로 필요한 1msec의 Dealy 실행
    _delay_ms(1);

    /*
      동기화하기 위해 80개의 클럭사이클을 보냅니다
      SPI는 직렬 통신이기 때문에 각 클럭 사이클당 1비트의 데이터가 전송됩니다
      0xFF(11111111b)는 8비트이기 때문에 10번을 보내면
      80개의 클럭 사이클을 보내는 것과 같습니다
    */
    for(uint8_t i = 0; i < 10; i++)
        spiTransfer(0xFF);

    // SDCard CS Deassert
    CS_DISABLE();
    spiTransfer(0xFF);
}
```

# SDCard Command 전송

아래는 SDCard Command의 포맷입니다. 모든 Command의 길이는 6바이트이며 Command Index, Arguments와 CRC가 포함되어 있습니다. Command Index는 SDCard에 어떤 명령을 보내고 있는지 알려주는데 사용됩니다. 예를 들어 `CMD0`을 전송하는 경우에는 Command Index의 6비트를 `000000b`로 설정합니다. Arguments 필드는 일부 명령에서 사용되며 다른 명령에서는 SDCard에서 무시됩니다. Arguments가 필요하지 않을 때마다 이 필드를 모두 `0`으로 채웁니다. 마지막으로 CRC(Cyclic Redundancy Check)를 사용하여 명령 내용이 SDCard에서 올바르게 수신되었는지 확인합니다. 참고로 SPI 모드에서는 몇 가지 명령만 올바른 CRC를 필요로 합니다. 필요하지 않은 경우에는 모두 `0`으로 설정합니다.

![Command Format](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_4.png)

아래는 SDCard에 Command를 전송하는 함수입니다. 8비트의 Command Index, 32비트의 Arguments와 8비트의 CRC를 전달합니다.

```c
void sdCommand(uint8_t cmd, uint32_t arg, uint8_t crc)
{
    // SDCard에 Command를 전송합니다
    spiTransfer(cmd | 0x40);

    // Argument를 전송합니다
    spiTransfer((uint8_t)(arg >> 24));
    spiTransfer((uint8_t)(arg >> 16));
    spiTransfer((uint8_t)(arg >> 8));
    spiTransfer((uint8_t)(arg));

    // CRC를 전송합니다
    spiTransfer(crc | 0x01);
}
```

Command Index를 전송하는 것으로 시작합니다. 그러나 Command Format을 보면 Command Index의 길이는 6비트입니다. 명령의 최상위 2비트는 항상 `01b`로 설정됩니다. 우리가 항상 128보다 작은 Command Index를 전달하려면 `cmd` 인수의 48번째 Bit는 항상 0이 됩니다. 그러나 47번째 Bit를 1로 설정하려면 `cmd`를 `0x40`과 OR 연산을 해야 합니다.

```c
    // SDCard에 Command를 전송합니다
    spiTransfer(cmd | 0x40);
```

다음으로 4바이트 Argument를 8비트씩 아래로 이동하면서, 한 번에 한 바이트씩 전송합니다.

```c
    // Argument를 전송합니다
    spiTransfer((uint8_t)(arg >> 24));
    spiTransfer((uint8_t)(arg >> 16));
    spiTransfer((uint8_t)(arg >> 8));
    spiTransfer((uint8_t)(arg));
```

마지막으로 CRC를 전송합니다. CRC의 길이는 7비트에 불과하고 모든 명령의 마지막 비트는 항상 `1`로 설정됩니다. 더 쉽게 구현하기 위해 `crc` 인수를 `0x01`과 OR 연산하여 최종 비트가 항상 `1`이 되도록 합니다.

```c
    // CRC를 전송합니다
    spiTransfer(crc | 0x01);
```

# SDCard 초기화 과정

SD 카드의 SPI 모드 초기화 과정은 아래 다이어그램과 같습니다:

![SDCard SPI Mode Initalization Flow](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_5.png)

이 과정의 첫 번째 단계는 `CMD0`을 보내는 것입니다. 아래는 SDCard Physical Specification의 `CMD0`에 대한 설명입니다.

![CMD0 Description](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_6.png)

`CMD0`은 SDCard에 대해 Software Reset을 합니다. Argument는 'Stuff Bits'이며, 이는 SDCard에서 무시되고 응답은 R1으로 받습니다.

SPI 모드는 SDCard를 위한 보조 통신 모드입니다. 'SD Bus Protocol Mode'에서 전원이 켜지며, `CS`(Chip Select)가 LOW로 구동되고 `CMD0`가 전송될 때만 SDCard가 SPI로 전환됩니다. SPI 모드에서 CRC는 기본적으로 무시되지만 시작되는 SD Bus Mode에서는 CRC가 필요합니다. 따라서 첫 번째 명령의 경우 올바른 체크섬이 있어야 합니다.

Command에서 Command Index를 0으로 설정하여 `CMD0`을 간단하게 지정하고, Argument는 Stuff Bits이므로 `0x00000000`으로 설정합니다. 이제 이 비트에 해당하는 CRC가 필요한데, 다행이게도 SDCard Physical Specification 43페이지를 보면 `10010100b`라는 7비트의 값을 제공합니다.

```c
#define CMD0        0
#define CMD0_ARG    0x00000000
#define CMD0_CRC    0x94

// CMD0 전송
sdCommand(CMD0, CMD0_ARG, CMD0_CRC);
```

위에서 설명했듯이 `CMD0`은 R1 응답을 반환합니다. R1의 형태는 아래와 같습니다:

![R1 Response Format](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_7.png)

R1은 7번째 Bit가 항상 `0`이고 다른 모든 비트는 오류 조건을 나타내는 단일 바이트입니다.

이것을 알면 `CMD0`을 보낸 후 단일 바이트 응답을 찾는 함수를 작성할 수 있습니다.

```c
uint8_t sdReadRes1()
{
    uint8_t index = 0, res1;

    // 실제 데이터가 수신될 떄까지 폴링을 유지합니다.
    while((res1 = spiTransfer(0xFF)) == 0xFF)
    {
        index++;
        // 8바이트 동안 수신된 데이터가 없으면 멈춥니다
        if(index > 8) break;
    }

    return res1;
}
```

`MISO`는 기본값이 HIGH이기 때문에, SDCard가 응답하지 않으면 단순히 `0xFF`를 읽습니다. SDCard는 명령이 전송된 후 처리하는데 시간이 걸릴 수 있으므로 데이터를 수신할 때까지 폴링을 계속합니다. 그러나 카드는 8 Cycle 이내에 응답해야 합니다. 그때까지 응답하지 않으면 응답을 중단하고 반환합니다. (이런 경우에는 `0xFF`를 반환하게 됩니다)

이 모든 것을 종합하면 `CMD0`(`GO_IDLE_STATE`)를 보내는 전체 시퀀스를 아래와 같이 작성할 수 있습니다:

```c
uint8_t sdGoIdleState()
{
    // SDCard CS Assert
    spiTransfer(0xFF);
    CS_ENABLE();
    spiTransfer(0xFF);

    // CMD0를 전송합니다
    sdCommand(CMD0, CMD0_ARG, CMD0_CRC);

    // Response를 읽습니다
    uint8_t res1 = sdReadRes1();

    // SDCard CS Deassert
    spiTransfer(0xFF);
    CS_DISABLE();
    spiTransfer(0xFF);

    return res1;
}
```

여기에서 `CS`를 LOW로 하기 전과 후에 8개의 클럭을 보내고, 명령을 보내기 전에 또 다른 8개의 클럭을 보냅니다. 이는 SDCard가 `CS`의 변경 사항을 인식하도록 하는 것입니다. 또한 `CS`를 HIGH로 전환하기 전후에 추가 바이트를 전송합니다. 이러한 추가적인 바이트 전송이 항상 필요한 것은 아니지만 여러 SDCard가 버스에 있다면 이러한 방법으로 문제를 피할 수 있습니다.

# ATmega328P에서 실행하기

위에서 작성한 모든 코드를 합쳐서 ATmega328P에서 실행해 봅시다. 아래는 이 글에서 정의한 함수를 사용하는 `main()` 함수입니다. 여기에서는 단순히 Power Up Sequence를 살펴보고 SDCard를 IDLE 상태로 만듭니다.

```c
int main(void)
{
    // SPI 초기화
    spiInit();

    // Power Up Sequence 시작
    sdPowerUpSeq();

    // command card to idle
    sdGoIdleState();

    while(1);
}
```

Logic Analyzer를 사용하여 의도한 대로 작동하는지 봐봅시다.  
아래와 같이 Logic Analyzer를 설정했습니다.

![Logic Analyzer Setting](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_8.png)

Logic Analyzer를 사용하면 아래와 같은 화면이 출력됩니다.

![Logic Analyzer](/assets/image/2022-08-28-AVR-ATmega328P-SDCard-1/AVR-ATmega328P-SDCard-1_9.png)

전송된 첫 번째 바이트는 `0x40`(`CMD0 | 0x40`)이고 Argument는 모두 `0`이며 마지막 바이트는 `0x95` 입니다. 응답하기 위해 명령을 보낸 후 SDCard에 8 Clock Cycle이 전송됩니다. 일단 실행되면 `0x01`을 보내며, R1에 대한 정의를 다시 확인하면 SDCard가 IDLE 상태(오류가 없는)인 것을 확인할 수 있으며 정상적으로 Command 전달이 작동한 것을 알 수 있습니다.
