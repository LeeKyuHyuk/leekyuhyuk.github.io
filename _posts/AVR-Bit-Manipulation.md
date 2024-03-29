---
title: '[AVR] 비트 연산'
date: '2022-08-28 09:39:22'
category: AVR
---

각각의 비트를 조작하는 것은 마이크로컨트롤러를 프로그래밍할 때 이해해야 할 가장 중요하고 기본적인 개념 중 하나입니다.

구성요소의 상태를 읽고, 매개 변수를 설정하고, 출력 핀의 상태를 변경하려면 비트 조작이 필요합니다.

특정 비트의 상태를 개별적으로 변경하고 바른 비트는 변경하지 않는 방법을 아는 것이 중요합니다.

이 글에서는 C언어를 사용할 수 있는 비트 연산자 중 일부를 소개하고 예시로 LED를 제어하는 방법을 보여줍니다.

# 개별 비트 설정

레지스터의 비트 설정은 OR 연산자(`|`)를 사용합니다.

| A   | B   | A \| B |
| --- | --- | ------ |
| 1   | 0   | 1      |
| 1   | 1   | 1      |
| 0   | 0   | 0      |
| 0   | 1   | 1      |

위와 같이 OR 연산자(`|`)는 특정 비트를 `1`로 설정하고 다른 비트는 변경하지 않습니다. 예를 들어 `0bxxxxxxxx | 0b00000001`를 하면 `0bxxxxxxx1`이 됩니다. 여기서 `0b00000001`를 비트 마스크(Bitmask)라고 합니다. 비트 마스크에서 `0`인 부분은 변경되지 않고 `1`인 부분만 변경됩니다.

한 번의 OR 연산자로 여러 개의 비트도 설정할 수 있습니다. `0bxxxxxxxx | 0b01010101`를 하면 `0bx1x1x1x1`가 됩니다.

# 개별 비트 지우기

비트를 지우는 것은 AND 연산자(`&`)를 사용합니다.

| A   | B   | A & B |
| --- | --- | ----- |
| 1   | 0   | 0     |
| 1   | 1   | 1     |
| 0   | 0   | 0     |
| 0   | 1   | 0     |

AND 연산자의 사용법은 위에서 설명한 OR 연산자와 유사하지만, 비트 마스크에 `0`이 있는 부분의 비트가 지워지고 `1`이 있는 부분은 변경되지 않고 유지됩니다. 예를 들어 `0bxxxxxxxx | 0b11111110`를 하면 `0bxxxxxxx0`이 됩니다.

# LED 깜빡이기

AVR의 `PINB0`에 LED를 연결했다면, 가장 먼저 `PINB0`을 출력핀으로 만들기 위해 `DDRB`의 0번째 Bit를 1로 설정해야 합니다. 그리고 `PORTB`의 0번째 Bit를 변경하여 `PINB0`을 LOW로 하거나 HIGH로 변경합니다.

```c
#include<avr/io.h>
#include<util/delay.h>

/*
  ----------------------------------------------
    DDRx  : 입출력 방향을 결정하는 레지스터
    PORTx : 출력 신호를 결정하는 레지스터
    PINx  : 입력된 값이 저장되어 있는 레지스터
  ----------------------------------------------
*/
void
int main()
{
    // PINB0을 DDRB로 출력하도록 설정
    DDRB |= 0b00000001; // DDRB = DDRB | 0b00000001;로 사용할 수도 있습니다.

    while(1)
    {
        // PINB0을 HIGH로 설정
        PORTB |= 0b00000001;
        _delay_ms(500);

        // PINB0을 LOW로 설정
        PORTB &= 0b11111110;
        _delay_ms(500);
    }
}
```

# 개별 비트 뒤집기

XOR 연산자(`^`)를 사용하면 개별 비트를 뒤집을 수 있습니다.

| A   | B   | A ^ B |
| --- | --- | ----- |
| 1   | 0   | 1     |
| 1   | 1   | 0     |
| 0   | 0   | 0     |
| 0   | 1   | 1     |

XOR 연산자(`^`)를 사용하면 특정 비트의 값을 뒤집고 다른 비트는 변경하지 않고 그대로 유지할 수 있습니다. 임의의 비트 `x`와 `0`을 XOR 연산하면 `x`가 생성되며, `x`와 `1`을 XOR 연산하면 `¬x`가 생성됩니다.

예를 들면, `0bxxxxxxxx1 ^ 0b00000001`은 `0bxxxxxxx0`이고 반대로 `0bxxxxxxx0 ^ 0b00000001`은 `0bxxxxxxx1` 입니다.

XOR 연산자를 사용하면 위에서 작성한 LED를 500ms마다 켰다 끄는 코드를 아래와 같이 개선할 수 있습니다.

```c
#include<avr/io.h>
#include<util/delay.h>

/*
  ----------------------------------------------
    DDRx  : 입출력 방향을 결정하는 레지스터
    PORTx : 출력 신호를 결정하는 레지스터
    PINx  : 입력된 값이 저장되어 있는 레지스터
  ----------------------------------------------
*/
void
int main()
{
    // PINB0을 DDRB로 출력하도록 설정
    DDRB |= 0b00000001; // DDRB = DDRB | 0b00000001;로 사용할 수도 있습니다.

    while(1)
    {
        // PINB0를 토글(Toggle)합니다
        PORTB ^= 0b00000001;
        _delay_ms(500);
    }
}
```

# 비트 이동하기

`<<`와 `>>` 연산자를 사용하면 비트를 이동할 수 있습니다. 비트를 이동하게 되면, 지정된 양만큼 모든 비트를 이동하고 빈 공간을 `0`으로 채웁니다. 예를 들면, `0b1110101 << 2`은 `0b11010100`가 되며 `0b11110000 >> 3`은 `0b00011110`가 됩니다.

비트의 이동을 레지스터의 특정 비트를 지정할 때 표기법으로 유용하게 사용됩니다.

```c
    // DDRB에 PINB4를 출력 모드로 설정합니다.
    // 1 << 4 = 0b00010000
    DDRB |= (1 << 4);
```

AVR 마이크로컨트롤러 핀에 대한 정의를 가지고 있는 `#include <avr/io.h>`를 코드에 추가하면, `DDRB`에서 `PINB4`를 출력 모드로 설정할 때 아래와 같이 간편하게 할 수 있습니다.

```c
    // DDRB에 PINB4를 출력 모드로 설정합니다.
    DDRB |= (1 << PINB4);
```

# NOT 연산자

마지막으로 소개할 비트 연산자는 NOT 연산자(`~`)입니다. NOT은 앞에서 설명한 OR, AND, XOR 연산자와 달리 단항 연산자입니다. NOT은 주어진 값에 대해 `0`은 `1`로, `1`은 `0`으로 변경합니다. AND 연산자와 결합하여 사용하면 특정 비트를 지울 때 유용하게 사용할 수 있습니다. 예를 들어 처음에 작성한 LED 코드에서 PINB0의 0번째 비트를 지우려고 할 때 아래와 같은 표현식을 사용했습니다.

```c
    // PINB0을 LOW로 설정
    PORTB &= 0b11111110;
```

위의 코드는 보기에도 헷갈리고, 코드를 작성하는 것 또한 힘듭니다. 아래와 같이 NOT 연산자를 사용하여 개선할 수 있습니다.

```c
    // PINB0을 LOW로 설정
    PORTB &= ~(1 << PINB0);
```

# 복합적으로 사용하기

위에서 소개한 모든 연산자들은 결합하여 사용할 수 있습니다. 예를 들어 3개의 다른 핀을 동시에 Set 할 수 있습니다.

```c
    // PINB0, PINB2, PINB4를 HIGH로 설정
    PORTB |= (1 << PINB0)|(1 << PINB2)|(1 << PINB4);
```

또는 아래와 같이 세 개의 핀을 Clear 할 수 있습니다.

```c
    // PINB0, PINB2, PINB4를 LOW로 설정
    PORTB &= ~((1 << PINB0)|(1 << PINB2)|(1 << PINB4));
```

그러나 논리 연산자로 다른 핀을 동시에 Set 하면서 Clear 할 수는 없습니다. 이 경우에는 각각 별도의 작업이 필요합니다.
