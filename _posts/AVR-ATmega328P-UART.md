---
title: '[AVR] ATmega328P UART 구현'
date: '2022-08-28 10:35:33'
category: AVR
---

ATmega328P의 UART(Universal Asynchronous Receiver and Transmitter) 기능을 사용하면 PC에서 마이크로컨트롤러와 쉽게 통신할 수 있습니다.

이 글에서는 마이크로컨트롤러 프로젝트에서 UART를 활용할 수 있는 몇 가지 기본 기능을 살펴보고 구현해 보겠습니다.

# 회로 연결

아래와 같이 회로를 구성합니다. Arduino를 연결한 이유는 `avrdude`를 사용하여 ATmega328P의 Flash에 프로그래밍(Flash Write)하기 위해 연결했습니다.

![Connections](/assets/image/2022-08-28-AVR-ATmega328P-UART/AVR-ATmega328P-UART_1.png)

# UART 초기화

UART를 초기화하기 위해 구성해야 하는 몇 가지 항목이 있습니다. 가장 먼저 결정해야 할 것은 전송 속도(Buadrate)입니다. UART의 경우 전송 속도는 전송될 초당 비트 수 입니다. 다음과 같이 여러 표준 속도가 있습니다:

- 1200
- 2400
- 4800
- 9600
- 19200
- 38400
- 57600
- 115200

속도가 큰 문제가 되지 않는 대부분의 마이크로컨트롤러 프로젝트의 경우에는 `9600`이 주로 사용됩니다. 초당 1200개의 문자를 전송하는 것과 같습니다. (16MHz 클럭의 ATmega328P는 초당 `1Mbps - 125000`개의 문자를 전송할 수도 있습니다)

# 전송 속도 설정하기

전송 속도 설정은 `UBRR0H`와 `UBRR0L` 레지스터에 기록하여 설정합니다. 이 레지스터에 기록되는 값은 아래 수식의 값입니다.

![Buadrate Calc](/assets/image/2022-08-28-AVR-ATmega328P-UART/AVR-ATmega328P-UART_2.png)

위의 수식에서 `fOSC`는 클럭 속도입니다. 프로젝트에서 16MHz의 외부 발진기를 사용하고 원하는 전송 속도가 9600이라고 가정하면 `UBRRn`의 값은 `(16000000/(16*9600)) - 1 = 103.167`이 됩니다. `103.167`은 정수가 아니므로 반올림해서 `103`이 됩니다.

전송 속도 레지스터(`UBRR`)은 각각 8비트이므로 `103`을 하위 바이트와 상위 바이트로 분리해야 합니다. `255`보다 작기 때문에 상위 바이트가 `0`이고 하위 바이트가 `103`인 것은 분명하지만, 상위 바이트와 하위 바이트를 구분해서 코드를 작성하는 방법은 아래와 같습니다:

```c
    // 하위 바이트를 UBRR0L에 기록
    UBRR0L = (uint8_t)(103 & 0xFF);

    // 상위 바이트를 UBRR0H에 기록
    UBRR0H = (uint8_t)(103 >> 8)
```

# UART 송신기와 수신기 활성화하기

`UCSR` 레지스터를 설정하여 송신 및 수신 기능을 활성화해야 합니다. 이 작업을 하지 않으면 마이크로컨트롤러의 UART RX/TX 핀은 표준 I/O핀으로 작동합니다. `UCSR0B` 레지스터의 `RXEN0`와 `TXEN0`의 비트를 `1`로 설정합니다.

```c
    // UART 송신기와 수신기 활성화
    UCSR0B |= (1 << RXEN0) | (1 << TXEN0)
```

# 프레임 포맷

마지막으로 데이터 비트 수, 정지 비트 수 및 패리티 비트 사용을 포함하는 프레임 포맷을 설정해야 하지만, 기본적으로 시스템은 8개의 데이터 비트에 패리티 비트는 없고 1개의 정지 비트(8N1이라고 불립니다)의 값으로 초기화됩니다. 이 설정은 일반적인 설정이며 대부분 터미널의 기본값이므로 여기서는 변경하지 않습니다.

# 초기화 함수 작성하기

아래와 같이 위의 내용을 바탕으로 UART를 초기화하는 함수를 작성합니다:

```c
void uartInit(uint16_t ubrr)
{
    // UBRR에 전송 속도(Buadrate)를 설정
    UBRR0L = (uint8_t)(ubrr & 0xFF);
    UBRR0H = (uint8_t)(ubrr >> 8);

    // UART 송신기와 수신기 활성화
    UCSR0B |= (1 << RXEN0) | (1 << TXEN0);
}
```

이 초기화 함수는 UART 관련 함수를 사용하기 전에 꼭 호출해야 합니다. 만약 호출하지 않는다면 UART는 작동하지 않습니다.

# 단일 문자 전송

UART에서 모든 전송 기능은 단일 문자를 UART를 통해 보내는 것으로 시작됩니다.

```c
void uartPut(unsigned char data)
{
    // 전송 버퍼가 비어 있을 때까지 기다립니다
    while(!(UCSR0A & (1 << UDRE0)));

    // 데이터를 UDR(전송 레지스터)에 입력
    UDR0 = data;
}
```

데이터를 전송하려면 전송 버퍼가 비어 있는지 확인해야 합니다. 데이터시트에 따르면 `UDREn`이 `1`이면 버퍼가 비어있는 것을 의미하며 데이터를 전송할 준비가 된 것이라고 설명하고 있습니다. `UDRE0`은 USART 제어 및 상태 레지스터인 `UCSR0A` 있으므로, `UCSR0A`를 `(1 << UDRE0)`으로 마스킹 해서 값을 얻을 수 있습니다.

`UDRE0`가 `1`이 되면 버퍼가 비어있는 것으로 버퍼가 비어있을 때 전송하려는 문자를 `UDR0` 레지스터에 입력만 하면 나머지는 하드웨어가 알아서 처리하게 됩니다.

# 문자열 전송

단일 문자 전송 함수가 있으면 문자열을 보내는 함수를 작성하는 것은 매우 간단합니다.

```c
void uartPuts(char* s)
{
    // 문자열의 끝을 알리는 NULL이 나올때까지 단일 문자를 전송합니다
    while(*s > 0) uartPut(*s++);
}
```

위의 함수는 문자열을 입력받아서 `NULL`이 나올 때까지 각 문자를 하나씩 전송합니다.

# 16진수 값 전송

터미널에서 읽을 수 있는 형식으로 16진수의 값을 전송하려면 먼저 ACSII로 변환해야 합니다.

```c
void uartPutHex8(uint8_t val)
{
    // 입력 값에서 상위 및 하위 니블 추출
    uint8_t upperNibble = (val & 0xF0) >> 4;
    uint8_t lowerNibble = val & 0x0F;

    // 니블을 ASCII 16진수로 변환
    upperNibble += upperNibble > 9 ? 'A' - 10 : '0';
    lowerNibble += lowerNibble > 9 ? 'A' - 10 : '0';

    // 문자를 출력
    uartPut(upperNibble);
    uartPut(lowerNibble);
}
```

`uartPutHex8()`을 사용하면 더 큰 16진수 값을 출력하도록 쉽게 확장할 수 있습니다. 예를 들어 16비트의 값을 16진수의 값으로 전송하는 함수는 다음과 같습니다:

```c
void uartPutHex16(uint16_t val)
{
    // 상위 8비트를 전송
    uartPutHex8((uint8_t)(val >> 8));

    // 하위 8비트를 전송
    uartPutHex8((uint8_t)(val & 0x00FF));
}
```

# 10진수 값 전송

10진수 값을 전송하는 것은 바이트를 상위 및 하위 니블로 분할하고 직접 변환할 수 없기 때문에 위에서 구현한 16진수의 값을 전송하는 것보다 조금 더 까다롭습니다. 특히 ATmega328P에는 하드웨어 분할기가 없기 때문에 나누기에 대한 비용이 많이 듭니다. 대신 나누기 연산을 빼기로 대체하여 속도를 높일 수 있습니다.

```c
void uartPutU8(uint8_t val)
{
    uint8_t dig1 = '0', dig2 = '0';

    // 100 단위의 값을 계산합니다
    while(val >= 100)
    {
        val -= 100;
        dig1++;
    }

    // 10 단위의 값을 계산합니다
    while(val >= 10)
    {
        val -= 10;
        dig2++;
    }

    // 첫 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if(dig1 != '0') uartPut(dig1);

    // 두 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if((dig1 != '0') || (dig2 != '0')) uartPut(dig2);

    // 마지막 숫자를 출력
    uartPut(val + '0');
}
```

위의 `uartPutU8()`은 부호가 없는 값을 출력합니다. 만약 부호가 있는 값을 출력해야 하면 어떻게 해야 할까요? 방법은 간단합니다. `MSB`가 1로 설정되어 있나 확인해서 `MSB`가 1이면 음수 기호를 출력하고 `uartPutU8()`을 호출합니다.

```c
void uartPutS8(int8_t val)
{
    // 값이 음수인지 확인합니다
    if(val & 0x80)
    {
        // 음수 기호를 출력합니다
        uartPut('-');

        // 부호 없는 값을 가져옵니다
        val = ~(val - 1);
    }

    // 부호 없는 값을 출력합니다
    uartPutU8((uint8_t)val);
}
```

이 개념을 더 큰 자료형으로 확장하는 것은 간단합니다. 예를 들어 16비트의 값은 아래와 같이 확장할 수 있습니다:

```c
void uartPutU16(uint16_t val)
{
    uint8_t dig1 = '0', dig2 = '0', dig3 = '0', dig4 = '0';

    // 10000 단위의 값을 계산합니다
    while(val >= 10000)
    {
        val -= 10000;
        dig1++;
    }

    // 1000 단위의 값을 계산합니다
    while(val >= 1000)
    {
        val -= 1000;
        dig2++;
    }

    // 100 단위의 값을 계산합니다
    while(val >= 100)
    {
        val -= 100;
        dig3++;
    }

    // 10 단위의 값을 계산합니다
    while(val >= 10)
    {
        val -= 10;
        dig4++;
    }

    // 이전 값이 출력되었는지 저장하는 변수입니다
    uint8_t prevPrinted = 0;

    // 첫 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if(dig1 != '0') {uartPut(dig1); prevPrinted = 1;}

    // 두 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if(prevPrinted || (dig2 != '0')) {uartPut(dig2); prevPrinted = 1;}

    // 세 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if(prevPrinted || (dig3 != '0')) {uartPut(dig3); prevPrinted = 1;}

    // 네 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if(prevPrinted || (dig4 != '0')) {uartPut(dig4); prevPrinted = 1;}

    // 마지막 숫자를 출력
    uartPut(val + '0');
}
```

```c
void uartPutS16(int16_t val)
{
    // check for negative number
    if(val & 0x8000)
    {
        // print minus sign
        uartPut('-');

        // convert to unsigned magnitude
        val = ~(val - 1);
    }

    // print unsigned magnitude
    uartPutU16((uint16_t) val);
}
```

# UART를 통해 수신하기

UART를 통해 단일 문자를 수신하는 건 위에서 구현한 `uartPut()`와 비슷합니다. 문자를 수신할 때는 `RXC0` 비트가 Set 될 때까지 `UCSR0A` 레지스터를 폴링 하면 됩니다. 그리고 `UDR0`에서 수신한 문자를 반환할 수 있습니다.

```c
void uartGet(void)
{
    // 데이터 수신을 기다립니다
    while(!(UCSR0A & (1 << RXC0)));

    // 데이터를 반환합니다
    return UDR0;
}
```

캐리지 리턴(`\r`)로 끝나는 데이터의 전체 라인을 수신하기 위해 `uartGetLine()`을 구현해 봅시다.

```c
void uartGetLine(char* buf, uint8_t n)
{
    uint8_t bufIdx = 0;
    char c;

    // 수신된 문자가 캐리지 리턴(\r)이 나올때까지 수신합니다
    do
    {
        // 단일 문자를 수신합니다
        c = uartGet();

        // 수신한 단일 문자를 출력합니다
        uartPut(c);

        // 버퍼에 단일 문자를 저장합니다
        buf[bufIdx++] = c;
    }
    while((bufIdx < n) && (c != '\r'));

    // 문자열 버퍼의 마지막에 NULL을 입력해서 문자열의 끝을 지정합니다
    buf[bufIdx] = 0;
}
```

앞에서 구현한 함수와 달리 여기서는 실제로 버퍼를 할당하여 문자를 저장하고, 수신 함수에 전달합니다. 예를 들면 아래와 같습니다:

```c
    // Buffer를 할당합니다.
    const uint8_t bufSize = 20;
    char buf[bufSize];

    // UART를 통해 데이터의 전체라인을 수신합니다
    uartGetLine(buf, bufSize);

    // 수신한 데이터를 출력합니다
    uartPuts("You entered: ");
    uartPuts(buf);
    uartPut('\n');
```

# ATmega328P에서 실행하기

프로젝트에 아래의 파일을 생성합니다.

**MakeFile :**

```makefile
CC = avr-gcc
CFLAGS = -Wall -Os -mmcu=atmega328p
OBJCOPY = avr-objcopy

OBJ = main.o uart.o

all: atmega328p-uart.hex

%.o: %.c
	$(CC) $(CFLAGS) -c $<

atmega328p-uart.elf: $(OBJ)
	$(CC) $(CFLAGS) -o atmega328p-uart.elf $(OBJ)

atmega328p-uart.hex: atmega328p-uart.elf
	$(OBJCOPY) atmega328p-uart.elf -O ihex atmega328p-uart.hex

clean:
	rm -f *.o *.elf *.hex
```

**uart.h :**

```c
#include <stdint.h>

void uartInit(uint16_t ubrr);
void uartPut(unsigned char data);
void uartPuts(char *s);
void uartPutHex8(uint8_t val);
void uartPutHex16(uint16_t val);
void uartPutU8(uint8_t val);
void uartPutS8(int8_t val);
void uartPutU16(uint16_t val);
void uartPutS16(int16_t val);
unsigned char uartGet(void);
void uartGetLine(char *buf, uint8_t n);
```

**uart.c :**

```c
#include <avr/io.h>
#include "uart.h"

void uartInit(uint16_t ubrr)
{
    // UBRR에 전송 속도(Buadrate)를 설정
    UBRR0L = (uint8_t)(ubrr & 0xFF);
    UBRR0H = (uint8_t)(ubrr >> 8);

    // UART 송신기와 수신기 활성화
    UCSR0B |= (1 << RXEN0) | (1 << TXEN0);
    uartPuts("\n\r");
    uartPuts("[INFO] UART initialized!\n\r");
}

void uartPut(unsigned char data)
{
    // 전송 버퍼가 비어 있을 때까지 기다립니다
    while (!(UCSR0A & (1 << UDRE0)))
        ;

    // 데이터를 UDR(전송 레지스터)에 입력
    UDR0 = data;
}

void uartPuts(char *s)
{
    // 문자열의 끝을 알리는 NULL이 나올때까지 단일 문자를 전송합니다
    while (*s > 0)
        uartPut(*s++);
}

void uartPutHex8(uint8_t val)
{
    // 입력 값에서 상위 및 하위 니블 추출
    uint8_t upperNibble = (val & 0xF0) >> 4;
    uint8_t lowerNibble = val & 0x0F;

    // 니블을 ASCII 16진수로 변환
    upperNibble += upperNibble > 9 ? 'A' - 10 : '0';
    lowerNibble += lowerNibble > 9 ? 'A' - 10 : '0';

    // 문자를 출력
    uartPut(upperNibble);
    uartPut(lowerNibble);
}

void uartPutHex16(uint16_t val)
{
    // 상위 8비트를 전송
    uartPutHex8((uint8_t)(val >> 8));

    // 하위 8비트를 전송
    uartPutHex8((uint8_t)(val & 0x00FF));
}

void uartPutU8(uint8_t val)
{
    uint8_t dig1 = '0', dig2 = '0';

    // 100 단위의 값을 계산합니다
    while (val >= 100)
    {
        val -= 100;
        dig1++;
    }

    // 10 단위의 값을 계산합니다
    while (val >= 10)
    {
        val -= 10;
        dig2++;
    }

    // 첫 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if (dig1 != '0')
        uartPut(dig1);

    // 두 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if ((dig1 != '0') || (dig2 != '0'))
        uartPut(dig2);

    // 마지막 숫자를 출력
    uartPut(val + '0');
}

void uartPutS8(int8_t val)
{
    // 값이 음수인지 확인합니다
    if (val & 0x80)
    {
        // 음수 기호를 출력합니다
        uartPut('-');

        // 부호 없는 값을 가져옵니다
        val = ~(val - 1);
    }

    // 부호 없는 값을 출력합니다
    uartPutU8((uint8_t)val);
}

void uartPutU16(uint16_t val)
{
    uint8_t dig1 = '0', dig2 = '0', dig3 = '0', dig4 = '0';

    // 10000 단위의 값을 계산합니다
    while (val >= 10000)
    {
        val -= 10000;
        dig1++;
    }

    // 1000 단위의 값을 계산합니다
    while (val >= 1000)
    {
        val -= 1000;
        dig2++;
    }

    // 100 단위의 값을 계산합니다
    while (val >= 100)
    {
        val -= 100;
        dig3++;
    }

    // 10 단위의 값을 계산합니다
    while (val >= 10)
    {
        val -= 10;
        dig4++;
    }

    // 이전 값이 출력되었는지 저장하는 변수입니다
    uint8_t prevPrinted = 0;

    // 첫 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if (dig1 != '0')
    {
        uartPut(dig1);
        prevPrinted = 1;
    }

    // 두 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if (prevPrinted || (dig2 != '0'))
    {
        uartPut(dig2);
        prevPrinted = 1;
    }

    // 세 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if (prevPrinted || (dig3 != '0'))
    {
        uartPut(dig3);
        prevPrinted = 1;
    }

    // 네 번째 숫자를 출력 (0이면 출력하지 않습니다)
    if (prevPrinted || (dig4 != '0'))
    {
        uartPut(dig4);
        prevPrinted = 1;
    }

    // 마지막 숫자를 출력
    uartPut(val + '0');
}

void uartPutS16(int16_t val)
{
    // check for negative number
    if (val & 0x8000)
    {
        // print minus sign
        uartPut('-');

        // convert to unsigned magnitude
        val = ~(val - 1);
    }

    // print unsigned magnitude
    uartPutU16((uint16_t)val);
}

unsigned char uartGet(void)
{
    // 데이터 수신을 기다립니다
    while (!(UCSR0A & (1 << RXC0)))
        ;

    // 데이터를 반환합니다
    return UDR0;
}

void uartGetLine(char *buf, uint8_t n)
{
    uint8_t bufIdx = 0;
    char c;

    // 수신된 문자가 캐리지 리턴(\r)이 나올때까지 수신합니다
    do
    {
        // 단일 문자를 수신합니다
        c = uartGet();

        // 수신한 단일 문자를 출력합니다
        uartPut(c);

        // 버퍼에 단일 문자를 저장합니다
        buf[bufIdx++] = c;
    } while ((bufIdx < n) && (c != '\r'));

    // 문자열 버퍼의 마지막에 NULL을 입력해서 문자열의 끝을 지정합니다
    buf[bufIdx] = 0;
}
```

**main.c :**

```c
#include <avr/interrupt.h>
#include "uart.h"
/*
  CPU의 Frequency를 16MHz로 설정합니다
*/
#define F_CPU 16000000UL
#include <util/delay.h>

int main(void)
{
  // Buffer를 할당합니다.
  const uint8_t bufSize = 20;
  char buf[bufSize];

  // UART 전송속도를 설정합니다
  const unsigned int baudRate = (F_CPU / 16 / 9600) - 1;

  _delay_ms(100); // VCC 안정화를 위해 100ms 동안 대기합니다

  cli(); // 모든 인터럽트를 비활성화 합니다

  // UART를 초기화 합니다
  uartInit(baudRate);

  // UART를 통해 데이터의 전체라인을 수신합니다
  uartPuts("Please enter any text : ");
  uartGetLine(buf, bufSize);

  // 수신한 데이터를 출력합니다
  uartPuts("\n\r");
  uartPuts("You entered : ");
  uartPuts(buf);
  uartPuts("\n\r");

  return 0;
}
```

이제 빌드하고 ATmega328P의 Flash Write 해봅시다.

브레드보드에 연결된 Arduino에 ArduinoISP 예제를 넣습니다.  
![ArduinoISP](/assets/image/2022-08-28-AVR-ATmega328P-UART/AVR-ATmega328P-UART_3.png)

그리고 아래의 명령어를 실행하여 ATmega328P UART 프로젝트를 빌드하고 ATmega328P에 기록합니다.

> `/dev/tty.usbmodem2112201` 부분은 Arduino Board를 입력합니다. ArduinoISP가 프로그래밍되어 있는 Arduino Board는 데이터를 받아 브레드보드에 있는 ATmega328P에 기록합니다

```sh
make
avrdude -c stk500v1 -b 19200 -F -p m328p -P /dev/tty.usbmodem2112201 -Uflash:w:atmega328p-uart.hex:i
```

![Build and Flash](/assets/image/2022-08-28-AVR-ATmega328P-UART/AVR-ATmega328P-UART_4.png)

`minicom`로 ATmega328P에 연결된 UART에 접속해서 정상적으로 동작하는지 확인해 봅니다.  
입력한 값이 그대로 출력된다면 정상 작동하는 것입니다.  
![minicom](/assets/image/2022-08-28-AVR-ATmega328P-UART/AVR-ATmega328P-UART_5.png)
