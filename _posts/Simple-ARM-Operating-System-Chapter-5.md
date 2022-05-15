---
title: 'Chapter 5: UART를 구현해보자!'
date: '2019-03-04 23:07:05'
category: Simple-ARM-Operating-System
---

> Source Code는
> [https://github.com/LeeKyuHyuk/Simple-ARM-Operating-System/tree/raspberry-pi-zero/Chapter-5/src](https://github.com/LeeKyuHyuk/Simple-ARM-Operating-System/tree/raspberry-pi-zero/Chapter-5/src)에
> 있습니다.

> UART(범용 비동기화 송수신기: Universal asynchronous receiver/transmitter)는 병렬 데이터의 형태를
> 직렬 방식으로 전환하여 데이터를 전송하는 컴퓨터 하드웨어의 일종이다. UART는 일반적으로 EIA RS-232,
> RS-422, RS-485와 같은 통신 표준과 함께 사용한다.
> [Wikipedia - UART](https://ko.wikipedia.org/wiki/UART)

Mini UART를 사용하여 UART를 구현해보도록 하겠습니다.

### `uart_init()` : UART Initialization

1. `AUXENB` Register의 `0`번 비트(Mini UART enable)를 `1`로 설정합니다.  
   ![AUXENB](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_ENABLES.png)

2. `AUX_MU_CNTL_REG` Register의 모든 비트를 `0`으로 설정합니다. Tx, Rx가 비활성화 됩니다.  
   ![AUX_MU_CNTL_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_CNTL.png)

3. `AUX_MU_LCR_REG` Register의 `0`번, `1`번 비트를 `1`으로 설정합니다.  
   `0`번 비트는 8-bit mode를 사용하도록 설정되며, `1`번 비트 또한 같은 이유로 설정되어야 합니다.  
   **_문서에는 `5`:`1`번 비트가 Reserved라고 표기 되어있지만 이렇게 하지 않으면 정상적인 데이터가 전
   송되지 않습니다._**  
   [BCM2835 datasheet errata #14P](https://elinux.org/BCM2835_datasheet_errata#p14)에 BCM2835
   Datasheet의 `AUX_MU_LCR_REG`의 틀린 부분이 언급되어 있습니다.  
   ![AUX_MU_LCR_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_LCR.png)

4. `AUX_MU_MCR_REG` Register의 모든 비트를 `0`으로 설정합니다.  
   ![AUX_MU_MCR_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_MCR.png)

5. `AUX_MU_IER_REG` Register의 모든 비트를 `0`으로 설정합니다.  
   ![AUX_MU_IER_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_IER.png)

6. `AUX_MU_IIR_REG` Register의 비트를 `11000001`로 설정합니다.  
   ![AUX_MU_IIR_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_IIR.png)

- Interrupt Pending[`0`], FIFO Enable[`7`:`6`]

7. `AUX_MU_BAUD` Register를 `270`으로 설정합니다.  
   ![AUX_MU_BAUD](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_BAUD.png)

- `baudrate = system_clock_freq / 8 * (baudrate_reg + 1)`
- **`baudrate_reg` 계산 방법:**
  - `baudrate_reg = (system_clock_freq / 8 * baudrate) - 1`
  - `baudrate_reg = (250000000 / 8 * 115200) - 1 = 270.267‥ ≈ 270`

8. `GPFSEL1` Register에서 GPIO 14, 15 Pin을 'Alternate function 5'로 설정합니다.  
   ![Alternative Function Assignments](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/alternative_function_assignments_gpio_14_15.png)  
   ![GPFSEL1](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/GPFSEL1.png)

9. `GPPUD` Register의 [`1`:`0`]을 `0`으로 설정합니다.  
   ![GPPUD](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/GPPUD.png)

- Off - Disable Pull-up/down

10. `GPPUDCLK0` Register에서 `14`, `15`번 비트를 `1`로 설정합니다.  
    (GPIO Pin 14, 15를 Assert Clock on line으로 만듭니다)  
    ![GPPUDCLK0](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/GPPUDCLK0.png)

11. `GPPUDCLK0` Register를 `0`으로 설정하여, 모든 GPIO Pin을 No Effect로 만듭니다.

> **9번 ~ 11번 과정 설명 :**
>
> 1. `GPPUD`에 기록하여 필요한 control signal를 설정합니다.
> 2. control signal를 설정하기 위해 150 사이클을 기다립니다.
> 3. `GPPUD`에서 수정한 GPIO의 control signal에 clock을 보내기 위해 `GPPUDCLK0`에서도 해당 GPIO 핀을
>    수정합니다.
> 4. 150 사이클을 기다립니다.
> 5. '1'에서 `GPPUD`에 기록했던 GPIO의 설정을 제거합니다.
> 6. '3'에서 `GPPUDCLK0`에 기록했던 GPIO의 설정을 제거합니다.

12. `AUX_MU_CNTL_REG` Register의 `0`, `1`번 비트를 `1`로 설정하여 Tx, Rx를 활성화 합니다.  
    ![AUX_MU_CNTL_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_CNTL.png)

```c
/* initialize UART */
void uart_init() {
  volatile unsigned char delay;

  AUX_ENABLES |= 1; // Mini UART 활성화
  AUX_MU_CNTL = 0;  // Tx, Rx 비활성화
  AUX_MU_LCR = 3;   // Data size : 8-bit mode
  AUX_MU_MCR = 0;
  AUX_MU_IER = 0;
  AUX_MU_IIR = 0xC1; // Interrupts 비활성화
  AUX_MU_BAUD = 270; // Baudrate를 115200로 설정

  // UART1 GPIO pins setting
  GPFSEL1 = (2 << 12) | (2 << 15); // GPIO 14, 15핀을 alternate function 5로 설정
  GPPUD = 0;                       // GPIO 14, 15핀 활성화
  for (delay = 0; delay < 150; delay++)
    asm volatile("nop");
  GPPUDCLK0 = (1 << 14) | (1 << 15);
  for (delay = 0; delay < 150; delay++)
    asm volatile("nop");
  GPPUDCLK0 = 0;   // Flush GPIO setup
  AUX_MU_CNTL = 3; // Tx, Rx 활성화
}
```

### `uart_send()` : Send a character

1. `AUX_MU_LSR_REG` Register의 `5`번째 비트인 'Transmitter Empty'를 확인합니다.
   ![AUX_MU_LSR_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_LSR.png)

2. 'Transmitter Empty'가 `1`이면 `AUX_MU_IO_REG`에 Data를 넣어 Buffer에 문자를 기록합니다.  
   ![AUX_MU_IO_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_IO.png)

```c
/* Send a character */
void uart_send(unsigned int data) {
  // AUX_MU_LSR의 Transmitter Empty 비트가 '1'이 될 때까지 대기합니다.
  do {
    asm volatile("nop");
  } while (!(AUX_MU_LSR & (1<<5)));
  // Buffer에 문자를 기록합니다.
  AUX_MU_IO = data;
}
```

### `uart_getc()` : Receive a character

1. `AUX_MU_LSR_REG` Register의 `1`번째 비트인 'Data ready'를 확인합니다.
   ![AUX_MU_LSR_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_LSR.png)

2. 'Data ready'가 `1`이면 `AUX_MU_IO_REG`의 Data를 읽어 반환합니다.  
   ![AUX_MU_IO_REG](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/AUX_MU_IO.png)

```c
/*  Receive a character */
char uart_getc() {
  char character;
  // Buffer에 무엇인가 있을때까지 대기합니다.
  do {
    asm volatile("nop");
  } while (!(AUX_MU_LSR & 1));
  // AUX_MU_IO에서 값을 읽어오고 return 합니다.
  character = (char)(AUX_MU_IO);
  // '\r'를 '\n'으로 변환합니다.
  return character == '\r' ? '\n' : character;
}
```

### `uart_puts()` : Display a string

앞에서 만들었던 `uart_send()`를 사용하여, `string`의 index를 1씩 더하며 `string`이 `NULL`이 될 때까
지 `uart_send(*string++);`을 호출합니다.

```c
/* Display a string */
void uart_puts(char *string) {
  while (*string) {
    // '\n'를 '\r'으로 변환합니다.
    if (*string == '\n')
      uart_send('\r');
    uart_send(*string++);
  }
}
```

### Source Code

**Makefile :**

```
SRCS = $(wildcard *.c)
OBJS = $(SRCS:.c=.o)
CFLAGS = -Wall -O2 -ffreestanding -nostdinc -nostdlib -nostartfiles

all: clean kernel.bin

boot.o: boot.S
	arm-none-eabi-gcc $(CFLAGS) -c boot.S -o boot.o

%.o: %.c
	arm-none-eabi-gcc $(CFLAGS) -c $< -o $@

kernel.bin: boot.o $(OBJS)
	arm-none-eabi-ld -nostdlib -nostartfiles boot.o $(OBJS) -Map kernel.map -T linker.ld -o kernel.elf
	arm-none-eabi-objcopy kernel.elf -O binary kernel.bin
	arm-none-eabi-objdump -D kernel.elf > kernel.dump

clean:
	rm kernel.elf kernel.bin kernel.dump kernel.map *.o >/dev/null 2>/dev/null || true
```

**boot.S :**

```
.section ".text.boot"

.global _start

_start:
	bl      main
```

**gpio.h :**

```c
#define MMIO_BASE       0x20000000

/* GPIO registers */
#define GPFSEL1         (*(volatile unsigned int*)(MMIO_BASE+0x00200004))
#define GPPUD           (*(volatile unsigned int*)(MMIO_BASE+0x00200094))
#define GPPUDCLK0       (*(volatile unsigned int*)(MMIO_BASE+0x00200098))

/* Auxilary mini UART registers */
#define AUX_ENABLES     (*(volatile unsigned int*)(MMIO_BASE+0x00215004))
#define AUX_MU_IO       (*(volatile unsigned int*)(MMIO_BASE+0x00215040))
#define AUX_MU_IER      (*(volatile unsigned int*)(MMIO_BASE+0x00215044))
#define AUX_MU_IIR      (*(volatile unsigned int*)(MMIO_BASE+0x00215048))
#define AUX_MU_LCR      (*(volatile unsigned int*)(MMIO_BASE+0x0021504C))
#define AUX_MU_MCR      (*(volatile unsigned int*)(MMIO_BASE+0x00215050))
#define AUX_MU_LSR      (*(volatile unsigned int*)(MMIO_BASE+0x00215054))
#define AUX_MU_CNTL     (*(volatile unsigned int*)(MMIO_BASE+0x00215060))
#define AUX_MU_BAUD     (*(volatile unsigned int*)(MMIO_BASE+0x00215068))
```

**linker.ld :**

```
SECTIONS
{
    . = 0x8000;
    .text : { KEEP(*(.text.boot)) *(.text .text.* .gnu.linkonce.t*) }
    .rodata : { *(.rodata .rodata.* .gnu.linkonce.r*) }
    PROVIDE(_data = .);
    .data : { *(.data .data.* .gnu.linkonce.d*) }
    .bss (NOLOAD) : {
        . = ALIGN(16);
        __bss_start = .;
        *(.bss .bss.*)
        *(COMMON)
        __bss_end = .;
    }
    _end = .;

   /DISCARD/ : { *(.comment) *(.gnu*) *(.note*) *(.eh_frame*) }
}
__bss_size = (__bss_end - __bss_start)>>3;
```

**uart.h :**

```c
void uart_init();
void uart_send(unsigned int c);
char uart_getc();
void uart_puts(char *s);
```

**uart.c :**

```c
#include "gpio.h"

/**
 * initialize UART
 */
void uart_init() {
  volatile unsigned char delay;

  AUX_ENABLES |= 1; // Mini UART 활성화
  AUX_MU_CNTL = 0;  // Tx, Rx 비활성화
  AUX_MU_LCR = 3;   // Data size : 8-bit mode
  AUX_MU_MCR = 0;
  AUX_MU_IER = 0;
  AUX_MU_IIR = 0xC1; // Interrupts 비활성화
  AUX_MU_BAUD = 270; // Baudrate를 115200로 설정

  // UART1 GPIO pins setting
  GPFSEL1 = (2 << 12) | (2 << 15); // GPIO 14, 15핀을 alternate function 5로 설정
  GPPUD = 0;                 // GPIO 14, 15핀 활성화
  for (delay = 0; delay < 150; delay++)
    asm volatile("nop");
  GPPUDCLK0 = (1 << 14) | (1 << 15);
  for (delay = 0; delay < 150; delay++)
    asm volatile("nop");
  GPPUDCLK0 = 0;   // Flush GPIO setup
  AUX_MU_CNTL = 3; // Tx, Rx 활성화
}

/**
 * Send a character
 */
void uart_send(unsigned int data) {
  // AUX_MU_LSR의 Transmitter Empty 비트가 '1'이 될 때까지 대기합니다.
  do {
    asm volatile("nop");
  } while (!(AUX_MU_LSR & (1 << 5)));
  // Buffer에 문자를 기록합니다.
  AUX_MU_IO = data;
}

/**
 * Receive a character
 */
char uart_getc() {
  char character;
  // Buffer에 무엇인가 있을때까지 대기합니다.
  do {
    asm volatile("nop");
  } while (!(AUX_MU_LSR & 1));
  // AUX_MU_IO에서 값을 읽어오고 return 합니다.
  character = (char)(AUX_MU_IO);
  // '\r'를 '\n'으로 변환합니다.
  return character == '\r' ? '\n' : character;
  ;
}

/**
 * Display a string
 */
void uart_puts(char *string) {
  while (*string) {
    // '\n'를 '\r'으로 변환합니다.
    if (*string == '\n')
      uart_send('\r');
    uart_send(*string++);
  }
}
```

**main.c :**

```c
#include "uart.h"

void main() {
  // UART 초기화
  uart_init();

  // "Hello World!"를 UART로 출력
  uart_puts("Hello World!\n");
  uart_puts("Raspberry Pi Zero UART\n");

  // UART 입력되는 것을 UART로 출력 (Echo 기능)
  while (1) {
    uart_send(uart_getc());
  }
}
```

![Putty](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-5/putty.png)
