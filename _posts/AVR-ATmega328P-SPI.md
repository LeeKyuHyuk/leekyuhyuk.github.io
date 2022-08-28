---
title: '[AVR] ATmega328P SPI 구현'
date: '2022-08-28 15:21:12'
category: AVR
---

SPI(Serial Peripheral Interface)는 마이크로컨트롤러에 매우 유용한 데이터 전송 프로토콜입니다.

UART와 달리 SPI는 동기식(Synchronous)입니다. 데이터 전송이 두 통신 장치 간의 공유 클럭 신호에 동기화됩니다. 하드웨어 수준에서 구현을 크게 단순화해서 시프트(Shift) 레지스터만 필요로 하고 장치 간의 전송 속도도 미리 합의할 필요가 없습니다.

SPI는 하나의 장치가 마스터로 작동하고 다른 장치가 슬레이브로 작동해야 합니다. 마스터는 SPI 버스의 모든 상호 작용을 제어하고, 슬레이브는 마스터가 지시할 때만 데이터를 보내거나 받습니다. 마스터는 슬레이브 선택(SS: Slave Select)이라고 하는 라인을 통해 각 슬레이브를 제어합니다. 이 라인은 수신하거나 전송해야한다는것을 슬레이브에게 알려주기 위해 LOW로 작동됩니다. SPI에 대한 일반적인 레이아웃은 아래와 같습니다.

![SPI Layout](/assets/image/2022-08-28-AVR-ATmega328P-SPI/2022-08-28-AVR-ATmega328P-SPI_1.png)

SPI는 모든 장치가 동일한 버스를 공유할 수 있고 서로의 통신을 방해할 염려가 없다는 장점이 있지만, 마스터가 버스의 각 슬레이브에 대해 전용 핀을 가져야 하므로 많은 수의 장치가 있는 경우에는 실용적이지 않을 수 있습니다.

# SPI Master 초기화

이 예제에서는 ATmeaga328P를 마스터로 지정해서 SPI를 초기화해보겠습니다. 하나의 장치가 있고 `PINB2`를 CS(Chip Select)로 사용하고 있다고 가정합니다.

```c
#define SPI_DDR DDRB
#define CS      PINB2
#define MOSI    PINB3
#define MISO    PINB4
#define SCK     PINB5

void spiInit()
{
    // CS와 MOSI, SCK를 출력으로 설정합니다
    SPI_DDR |= (1 << CS) | (1 << MOSI) | (1 << SCK);

    // SPI를 활성화하고 Master로 Clock은 fOSC/128로 설정합니다.
    SPCR = (1 << SPE) | (1 << MSTR) | (1 << SPR1) | (1 << SPR0);
}
```

ATmega328P의 `MOSI`, `MISO` 및 클럭 라인은 `PINB3`, `PINB4`와 `PINB5`입니다. 핀 이름이 아닌 기능으로 보기 위해 `define` 문을 사용했습니다. 마스터로 동작하기 때문에 `CS`, `MOSI`, `SCK`를 출력(Output)으로 설정합니다. `MISO`는 기본값이 입력(Input)으로 설정되어 있습니다.

```c
    // CS와 MOSI, SCK를 출력으로 설정합니다
    SPI_DDR |= (1 << CS) | (1 << MOSI) | (1 << SCK);
```

다음으로 `SPCR`(SPI 제어 레지스터)에서 SPI를 활성화합니다. `SPE`에 `1`을 쓰면 됩니다. `MSTR`에 `1`을 기입하여 마스터로 작동하고 있음도 설정합니다. 마지막으로 클럭 속도를 설정해야 합니다. 기본값으로 fOSC/4로 설정됩니다. 그러나 몇몇 장치에서는 너무 높은 클럭일 수 있습니다. 인터페이스하는 장치의 최대 클럭 속도가 얼마인지 확실하지 않은 경우 클럭을 가능한 가장 느린 속도로 설정하는게 좋습니다. 그래서 이 예제에서는 fOSC/128의 클럭을 제공하도록 설정합니다. `SPR1`과 `SPR0`에 각각 `1`을 기입합니다.

```c
    // SPI를 활성화하고 Master로 Clock은 fOSC/128로 설정합니다.
    SPCR = (1 << SPE) | (1 << MSTR) | (1 << SPR1) | (1 << SPR0);
```

# SPI 데이터 전송

SPI 마스터에서 바이트를 전송하는 것은 매우 간단합니다. 아래와 같이 함수를 구현합니다.

```c
void spiTransmitByte(uint8_t data)
{
    // SPI로 전송할 데이터를 SPDR(SPI Data Register)에 저장
    SPDR = data;

    /*
      SPIF(SPI Interrupt Flag)가 Set될 때까지 기다립니다
      SPIF가 Set이 되었다면 SPI로 데이터가 전송이 완료된것입니다
    */
    while(!(SPSR & (1 << SPIF)));
}
```

먼저 SPI 데이터 레지스터 `SPDR`에 전송해야 하는 데이터를 저장합니다.

```c
    // SPI로 전송할 데이터를 SPDR(SPI Data Register)에 저장
    SPDR = data;
```

그리고 `SPIF` 플래그가 Clear 되기를 기다리면서 SPI 상태 레지스터인 `SPSR`을 폴링 합니다.

```c
    /*
      SPIF(SPI Interrupt Flag)가 Set될 때까지 기다립니다
      SPIF가 Set이 되었다면 SPI로 데이터가 전송이 완료된것입니다
    */
    while(!(SPSR & (1 << SPIF)));
```

SPI를 통해 장치로 전송할 때 데이터가 전송되기 전에 전송하려는 장치의 슬레이브 선택 라인이 LOW로 구동되어 한다는 점은 항상 명심해야 합니다.

```c
    // SS(Slave Select)를 LOW로 설정
    SPI_DDR &= ~(1 << SS);

    // 슬레이브로 데이터 전송
    spiTransmitByte(0x55);

    // SS(Slave Select)를 HIGH로 설정
    SPI_DDR |= (1 << SS);
```

# SPI 데이터 수신

SPI를 통해 데이터를 수신하는 것은 데이터 전송과 비슷합니다.

```c
uint8_t spiReceive()
{
    /*
      SPI에서 데이터를 전송하면 항상 0xFF를 전송하고 SPI 데이터 레지스터를
      반환합니다. 슬레이브가 데이터를 다시 전송하기 위해 클럭을 생성하기
      때문에 0xFF를 전송하는데, 이것을 사용하여 SPDR에 0xFF를 Dummy Byte로
      전송하면 SPI 수신을 받을 수 있습니다
    */
    SPDR = 0xFF;

    /*
      SPIF(SPI Interrupt Flag)가 Set될 때까지 기다립니다
      SPIF가 Set이 되었다면 SPI로 데이터가 전송이 완료된것입니다
    */
    while(!(SPSR & (1 << SPIF)));

    // SPI로 수신한 데이터(SPDR)을 반환합니다
    return SPDR;
}
```

SPI에서 데이터를 전송하면 항상 `0xFF`를 전송하고 SPI 데이터 레지스터를 반환합니다. 슬레이브가 데이터를 다시 전송하기 위해 클럭을 생성하기 때문에 `0xFF`를 전송하는데, 이것을 사용하여 `SPDR`에 `0xFF`를 Dummy Byte로 전송하면 SPI 수신을 받을 수 있습니다.

만약, 항상 입력 바이트를 사용하여 전송하고 항상 SPI 데이터 레지스터를 반환하도록 함수를 작성하고 싶다면, 아래와 같이 작성할 수 있습니다.

```c
uint8_t spiTxRx(uint8_t data)
{
    // SPI로 전송할 데이터를 SPDR(SPI Data Register)에 저장
    SPDR = data;

    /*
      SPIF(SPI Interrupt Flag)가 Set될 때까지 기다립니다
      SPIF가 Set이 되었다면 SPI로 데이터가 전송이 완료된것입니다
    */
    while(!(SPSR & (1 << SPIF)));

    // SPI로 수신한 데이터(SPDR)을 반환합니다
    return SPDR;
}
```

위의 코드를 사용하면 송신 수신 시퀀스는 아래와 같습니다:

```c
    // SS(Slave Select)를 LOW로 설정
    SPI_DDR &= ~(1 << SS);

    // 데이터를 슬레이브로 전송합니다 (응답은 무시)
    spiTransmitByte(0x55);

    // 슬레이브로 부터 데이터를 수신합니다
    uint8_t ret = spiTxRx(0xFF);

    // SS(Slave Select)를 HIGH로 설정
    SPI_DDR |= (1 << SS);
```
