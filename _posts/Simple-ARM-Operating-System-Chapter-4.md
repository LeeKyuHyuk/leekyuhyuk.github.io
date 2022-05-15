---
layout: post
title: 'Chapter 4: GPIO를 제어해보자! (C)'
date: '2019-03-04 23:07:04'
category: Simple-ARM-Operating-System
---

> Source Code는
> [https://github.com/LeeKyuHyuk/Simple-ARM-Operating-System/tree/raspberry-pi-zero/Chapter-4/src](https://github.com/LeeKyuHyuk/Simple-ARM-Operating-System/tree/raspberry-pi-zero/Chapter-4/src)에
> 있습니다.

'[Chapter 3: GPIO를 제어해보자! (ARM Assembly)](/article/simple-arm-operating-system/2019/03/04/Simple-ARM-Operating-System-Chapter-3)'
에서는 ARM Assembly를 사용하여 GPIO를 제어했습니다.  
이번에는 ARM Assembly에서 C함수를 호출하여 GPIO를 제어해보도록 하겠습니다.

### Raspberry Pi Zero ACT LED Toggle

이번 장에서는 ACT LED가 계속 꺼졌다가 켜지는 것을 구현해보도록 하겠습니다.

ARM Assembly 코드에서는 `bl main`으로 C코드에 있는 `main()` 함수를 호출합니다.

**`boot.S`:**

```assembly
.section ".text.boot"
.globl _start

_start:
  mov sp,#0x8000   @ Stack Pointer를 Kernel이 시작하는 지점인 0x8000으로 설정합니다.
  bl main          @ C함수 중에서 main이라는 함수를 호출합니다.

.end
```

GPIO를 C로 제어하기 전에 `gpio.h`를 작성하도록 하겠습니다.

```c
#define MMIO_BASE       0x20000000

/* System Timer Counter registers */
#define SYSTMR_LO       (*(volatile unsigned int*)(MMIO_BASE+0x00003004))
#define SYSTMR_HI       (*(volatile unsigned int*)(MMIO_BASE+0x00003008))

/* GPIO registers */
#define GPFSEL4         (*(volatile unsigned int*)(MMIO_BASE+0x00200010))
#define GPSET1          (*(volatile unsigned int*)(MMIO_BASE+0x00200020))
#define GPCLR1          (*(volatile unsigned int*)(MMIO_BASE+0x0020002C))
```

준비과정은 다 끝났습니다. 이제 `main.c`에서 GPIO를 제어해봅시다.  
아래의 코드는 ACT LED를 ON하는 코드입니다.

**`main.c`:**

```c
#include "gpio.h"

int main(void) {
  GPFSEL4 = 1 << 21;        // GPFSEL4의 21번 비트를 1로 설정합니다.
  GPSET1 = 1 << 15;         // GPSET1의 15번 비트를 1로 설정합니다.
                            // GPIO 47번을 LOW (ACT LED ON)
  return 0;
}
```

여기서 우리는 1초마다 ACT LED가 ON, OFF되는것을 구현하고 싶으니 Delay 함수를 구현해야합니다.  
Delay 함수는 System Timer Counter 레지스터를 사용하면 쉽게 구현이 가능합니다.
![System Timer Counter 레지스터](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-4/2019-03-04-Simple-ARM-Operating-System-Chapter-4_1.png)

**`delay.h`:**

```c
unsigned long get_system_timer();
void wait_msec(unsigned int n);
```

**`delay.c`:**

```c
#include "gpio.h"

/**
 * Get System Timer's counter
 */
unsigned long get_system_timer() {
  unsigned int h = -1, l;
  h = SYSTMR_HI;
  l = SYSTMR_LO;
  // System Timer Counter Higher 32 bits가 변경되면, 위의 작업을 다시 합니다.
  if (h != SYSTMR_HI) {
    h = SYSTMR_HI;
    l = SYSTMR_LO;
  }
  return ((unsigned long)h << 32) | l;
}

/**
 * Wait N microseconds
 */
void wait_msec(unsigned int n) {
  unsigned long t = get_system_timer();
  // 무한 루프를 피하기 위하여 t의 값이 0이 아닌지 확인합니다.
  if (t)
    while (get_system_timer() < t + n)
      ;
}
```

Delay 함수도 구현했으니, 이제 1초마다 ACT LED가 ON, OFF되게 해봅시다.

**`main.c`:**

```c
#include "gpio.h"
#include "delay.h"

int main(void) {
  GPFSEL4 = 1 << 21;        // GPFSEL4의 21번 비트를 1로 설정합니다.
  while (1) {
    GPSET1 = 1 << 15;       // GPSET1의 15번 비트를 1로 설정합니다.
                            // GPIO 47번을 LOW (ACT LED ON)
    wait_msec(1000000 * 1); // 1초 Delay
    GPCLR1 = 1 << 15;       // GPCLR1의 15번 비트를 1로 설정합니다.
                            // GPIO 47번을 HIGH (ACT LED OFF)
    wait_msec(1000000 * 1); // 1초 Delay
  }
  return 0;
}
```

**`linker.ld`:**

```
SECTIONS
{
    . = 0x8000;
    .text : { *(.text.boot) }
}
```

**`Makefile`:**

```
SRCS = $(wildcard *.c)
OBJS = $(SRCS:.c=.o)
CFLAGS = -O2 -Wall -fpic -ffreestanding

all: clean kernel.bin

boot.o: boot.S
	arm-none-eabi-gcc $(CFLAGS) -c boot.S -o boot.o

%.o: %.c
	arm-none-eabi-gcc $(CFLAGS) -c $< -o $@

kernel.bin: boot.o $(OBJS)
	arm-none-eabi-gcc -T linker.ld -o kernel.elf -ffreestanding -O2 -nostdlib boot.o $(OBJS)
	arm-none-eabi-objcopy kernel.elf -O binary kernel.bin
	arm-none-eabi-objdump -D kernel.elf > kernel.dump

clean:
	rm kernel.elf kernel.bin kernel.dump *.o >/dev/null 2>/dev/null || true
```

### 작성한 코드를 빌드하여 실제 Raspberry Pi Zero에서 실행해보자!

위와 같이 `Makefile`까지 모두 작성했다면 터미널에 `make`를 입력하여 빌드합니다.  
빌드가 완료되면 `kernel.bin` 파일이 생성됩니다.

SDCard를 FAT32로 포맷합니다.  
그리고,
[/References/boot](https://github.com/LeeKyuHyuk/Simple-ARM-Operating-System/tree/raspberry-pi-zero/References/boot)에
있는 `bootcode.bin`, `config.txt`, `start.elf`를 모두 복사합니다.  
방금 빌드한 `kernel.bin`도 함께 복사합니다.  
![SDCard files](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-4/2019-03-04-Simple-ARM-Operating-System-Chapter-4_2.png)

> SDCard에 있는 `config.txt`에는 `kernel=kernel.bin`이라는 설정만 있습니다. 이 설정은 `kernel.bin`을
> 사용하여 부팅하겠다는 뜻입니다.

SDCard를 Raspberry Pi Zero에 넣고, 부팅하면 아래와 같이 ACT LED가 켜지고 꺼지는 것을 확인할 수 있습
니다.  
![Raspberry Pi Zero ACT LED On Off](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-4/2019-03-04-Simple-ARM-Operating-System-Chapter-4_3.gif)
