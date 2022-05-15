---
title: 'Raspberry Pi Bare Bones'
date: '2019-05-14 19:39:57'
category: Raspberry-Pi
---

Raspberry Pi의 운영 체제 개발에 대한 글입니다. 이 글은 테스트할 다른 하드웨어가 없기 때문에
Raspberry Pi Model B Rev 2에 맞춰져 작성되었습니다. 하지만 지금까지의 모델들은 Memory-Mapped I/O 위
치 이외에는 대부분 동일합니다. 이것은 최소한의 시스템을 만드는 방법의 예를 보여주지만, 프로젝트를 적
절하게 구조화하는 방법의 예는 아닙니다.

# Prepare

여러분은 이제 스스로 운영체제 개발을 시작하려고 합니다. 아마도 언젠가는 스스로 새로운 운영체제를 개
발할 수도 있습니다. 이것은 Bootstrap 또는 Self-hosting으로 알려진 과정입니다. 우선은 기존 운영 체제
에서 새 운영 체제를 컴파일 할 수 있는 시스템을 환경을 만들기만 하면 됩니다. 이 과정은
[Cross-Compile](https://wiki.osdev.org/Why_do_I_need_a_Cross_Compiler%3F)으로 알려져 있으며 운영체제
개발의 첫 번째 단계입니다.

이 글에서는 운영체제 개발을 원활하게 할 수 있는 Linux와 같은 Unix 계열 운영체제를 사용합니다.
Windows 사용자는 [MinGW](https://wiki.osdev.org/MinGW) 또는 [Cygwin](https://wiki.osdev.org/Cygwin)
환경에서 진행할 수 있습니다.

# Building a Cross-Compiler

> Main article: [GCC Cross-Compiler](https://wiki.osdev.org/GCC_Cross-Compiler),
> [Why do I need a Cross Compiler?](https://wiki.osdev.org/Why_do_I_need_a_Cross_Compiler%3F)

우선해야 할 일은 **arm-none-eabi** 용 GCC Cross-Compiler를 준비하는 것입니다. 아직 운영체제를 만들기
위해 컴파일러를 수정하지 않았기 때문에, arm-none-eabi라는 일반적인 타겟을 사용할 것입니다. 이 타겟은
System V ABI를 대상으로 하는 Toolchain을 제공합니다. Cross-Compiler 없이 운영체제를 올바르게 컴파일
할 수 없습니다.

만약 64비트 커널이 필요하다면, aarch64-elf를 타겟으로 사용하면 됩니다. 동일한 System V ABI 인터페이
스를 제공하지만 64비트 용입니다. elf를 사용하는 것은 필수가 아니지만 작업을 간편하게 해줍니다.

# Overview

이제 여러분은 크로스 컴파일러를 가지고 있어야 합니다. 이 글은 간단한 운영체제를 만드는데 필요한 최소
한의 방법을 제공하고 있습니다. 이는 프로젝트 구조에 대한 권장 구조로 사용되지는 않지만 최소한의 커널
에 대한 예로서는 사용되고 있습니다. 이런 간단한 커널을 개발하는 경우에는 3개의 파일만 있으면 됩니다.

1. `boot.S` - 커널이 CPU 환경에서 동작할 수 있도록 만들어 주기 위한 커널의 진입점입니다.
2. `kernel.c` - 여러분이 만들게 될 커널 루틴입니다.
3. `linker.ld` - 위에 두 소스코드를 컴파일한 후 Linking 할 때 사용하게 될 Linker Script입니다.

# Booting the Operating System

이제 `boot.S`라는 파일을 만들고 그 내용을 설명할 것입니다. 이 예제에서는 앞에서 빌드 한
Cross-Compiler Toolchain의 일부인 GNU Assembler를 사용합니다. 이 어셈블러는 나머지 GNU Toolchain과
잘 호환됩니다.

## Raspberry Pi Model A, B, A+, B+, and Zero

```assembly
// AArch32 mode

// To keep this in the first portion of the binary.
.section ".text.boot"

// Make _start global.
.globl _start

.org 0x8000
// Entry point for the kernel.
// r15 -> should begin execution at 0x8000.
// r0 -> 0x00000000
// r1 -> 0x00000C42
// r2 -> 0x00000100 - start of ATAGS
// preserve these registers as argument for kernel_main
_start:
	// Setup the stack.
	mov sp, #0x8000

	// Clear out bss.
	ldr r4, =__bss_start
	ldr r9, =__bss_end
	mov r5, #0
	mov r6, #0
	mov r7, #0
	mov r8, #0
	b       2f

1:
	// store multiple at r4.
	stmia r4!, {r5-r8}

	// If we are still below bss_end, loop.
2:
	cmp r4, r9
	blo 1b

	// Call kernel_main
	ldr r3, =kernel_main
	blx r3

	// halt
halt:
	wfe
	b halt
```

Linker Script에서 `.text.boot` 섹션을 사용하여 `boot.S`를 커널 이미지의 맨 처음에 배치합니다. 이 코
드는 `kernel_main` 함수를 호출하기 전에 최소의 C 환경을 초기화합니다. 즉, 스택이 있고 BSS 세그먼트를
0으로 만드는 것을 의미합니다. 이 코드는 `r0`~`r2`를 사용하지 않으므로 `kernel_main` 호출에 유효합니
다.

아래와 같이 `boot.S`를 assemble 할 수 있습니다:

```sh
arm-none-eabi-gcc -mcpu=arm1176jzf-s -fpic -ffreestanding -c boot.S -o boot.o
```

## Raspberry Pi 2

최신 버전의 Raspberry Pi를 사용하면 더 많은 작업을 수행할 수 있습니다. Raspberry Pi 2와 3에는 4개의
코어가 있습니다. 부팅 할 때 모든 코어가 실행 중이며 동일한 부팅 코드를 실행합니다. 따라서 코어를 구
별하고 그중 하나만 실행할 수 있게 하고 나머지는 무한 루프에 넣어야 합니다.

```assembly
// AArch32 mode

// To keep this in the first portion of the binary.
.section ".text.boot"

// Make _start global.
.globl _start

.org 0x8000
// Entry point for the kernel.
// r15 -> should begin execution at 0x8000.
// r0 -> 0x00000000
// r1 -> 0x00000C42
// r2 -> 0x00000100 - start of ATAGS
// preserve these registers as argument for kernel_main
_start:
	// Shut off extra cores
	mrc p15, 0, r5, c0, c0, 5
	and r5, r5, #3
	cmp r5, #0
	bne halt

	// Setup the stack.
	ldr r5, =_start
	mov sp, r5

	// Clear out bss.
	ldr r4, =__bss_start
	ldr r9, =__bss_end
	mov r5, #0
	mov r6, #0
	mov r7, #0
	mov r8, #0
	b       2f

1:
	// store multiple at r4.
	stmia r4!, {r5-r8}

	// If we are still below bss_end, loop.
2:
	cmp r4, r9
	blo 1b

	// Call kernel_main
	ldr r3, =kernel_main
	blx r3

	// halt
halt:
	wfe
	b halt
```

아래와 같이 `boot.S`를 assemble 할 수 있습니다:

```sh
arm-none-eabi-gcc -mcpu=cortex-a7 -fpic -ffreestanding -c boot.S -o boot.o
```

## Raspberry Pi 3

64비트 모드에서 부팅 코드는 `0x8000`이 아닌 `0x80000`에 로드됩니다.

```assembly
// AArch64 mode

// To keep this in the first portion of the binary.
.section ".text.boot"

// Make _start global.
.globl _start

    .org 0x80000
// Entry point for the kernel. Registers are not defined as in AArch32.
_start:
    // read cpu id, stop slave cores
    mrs     x1, mpidr_el1
    and     x1, x1, #3
    cbz     x1, 2f
    // cpu id > 0, stop
1:  wfe
    b       1b
2:  // cpu id == 0

    // set stack before our code
    ldr     x1, =_start
    mov     sp, x1

    // clear bss
    ldr     x1, =__bss_start
    ldr     w2, =__bss_size
3:  cbz     w2, 4f
    str     xzr, [x1], #8
    sub     w2, w2, #1
    cbnz    w2, 3b

    // jump to C code, should not return
4:  bl      kernel_main
    // for failsafe, halt this core too
    b 1b
```

코드를 다음과 같이 컴파일합니다:

```sh
aarch64-elf-gcc -ffreestanding -nostdinc -nostdlib -nostartfiles -c boot.S -o boot.o
```

# Implementing the Kernel

지금까지는 C와 같은 고급 언어를 사용할 수 있도록 프로세서를 설정하는 Bootstrap Assembly Stub를 작성
했습니다. C++와 같은 다른 언어를 사용할 수도 있습니다.

## Freestanding and Hosted Environments

일반적인 사용자 공간에서 C 또는 C++로 프로그래밍을 하는 경우에는 호스팅 환경(Hosted Environment)을
사용했습니다. 호스팅 환경이란 C 표준 라이브러리 및 기타 기능이 있는 환경을 말합니다. 또는 독립적인
(Freestanding) 환경이 있습니다. 이것은 우리가 여기서 사용하는 환경입니다. Freestanding은 C 표준 라이
브러리가 없고, 우리가 제공하는 것만 사용할 수 있는 것을 의미합니다. 그러나 일부 헤더 파일은 실제로 C
표준 라이브러리의 일부가 아니라 컴파일러에서 제공하는 헤더 파일입니다. 이러한 것들은 독립적인 C 소스
코드에서도 사용할 수 있습니다. 이 경우 `<stddef.h>`를 사용하여 `size_t`와 `NULL` 및 `<stdint.h>`를
가져와서 운영체제 개발에 매우 중요한 `intx_t` 및 `uintx_t` 자료형을 가져옵니다. 여기서 변수가 정확한
크기인지 확인해야 합니다. (우리가 `uint16_t` 대신 `short`를 사용하고 `short`의 크기를 변경하면, 여기
에 있는 VGA 드라이버가 깨질 것입니다!) 또한 `<float.h>`, `<iso646.h>`, `<limits.h>`, `<stdarg.h>` 헤
더도 사용이 가능합니다. GCC는 실제로 몇 가지 헤더를 추가로 제공하지만 이들은 특별한 목적으로 사용됩
니다.

## Writing a kernel in C

다음은 C로 간단한 커널을 만드는 방법을 보여줍니다.

```c
#include <stddef.h>
#include <stdint.h>

// Memory-Mapped I/O output
static inline void mmio_write(uint32_t reg, uint32_t data)
{
	*(volatile uint32_t*)reg = data;
}

// Memory-Mapped I/O input
static inline uint32_t mmio_read(uint32_t reg)
{
	return *(volatile uint32_t*)reg;
}

// Loop <delay> times in a way that the compiler won't optimize away
static inline void delay(int32_t count)
{
	asm volatile("__delay_%=: subs %[count], %[count], #1; bne __delay_%=\n"
		 : "=r"(count): [count]"0"(count) : "cc");
}

enum
{
    // The GPIO registers base address.
    GPIO_BASE = 0x3F200000, // for raspi2 & 3, 0x20200000 for raspi1

    // The offsets for reach register.

    // Controls actuation of pull up/down to ALL GPIO pins.
    GPPUD = (GPIO_BASE + 0x94),

    // Controls actuation of pull up/down for specific GPIO pin.
    GPPUDCLK0 = (GPIO_BASE + 0x98),

    // The base address for UART.
    UART0_BASE = 0x3F201000, // for raspi2 & 3, 0x20201000 for raspi1

    // The offsets for reach register for the UART.
    UART0_DR     = (UART0_BASE + 0x00),
    UART0_RSRECR = (UART0_BASE + 0x04),
    UART0_FR     = (UART0_BASE + 0x18),
    UART0_ILPR   = (UART0_BASE + 0x20),
    UART0_IBRD   = (UART0_BASE + 0x24),
    UART0_FBRD   = (UART0_BASE + 0x28),
    UART0_LCRH   = (UART0_BASE + 0x2C),
    UART0_CR     = (UART0_BASE + 0x30),
    UART0_IFLS   = (UART0_BASE + 0x34),
    UART0_IMSC   = (UART0_BASE + 0x38),
    UART0_RIS    = (UART0_BASE + 0x3C),
    UART0_MIS    = (UART0_BASE + 0x40),
    UART0_ICR    = (UART0_BASE + 0x44),
    UART0_DMACR  = (UART0_BASE + 0x48),
    UART0_ITCR   = (UART0_BASE + 0x80),
    UART0_ITIP   = (UART0_BASE + 0x84),
    UART0_ITOP   = (UART0_BASE + 0x88),
    UART0_TDR    = (UART0_BASE + 0x8C),
};

void uart_init()
{
	// Disable UART0.
	mmio_write(UART0_CR, 0x00000000);
	// Setup the GPIO pin 14 && 15.

	// Disable pull up/down for all GPIO pins & delay for 150 cycles.
	mmio_write(GPPUD, 0x00000000);
	delay(150);

	// Disable pull up/down for pin 14,15 & delay for 150 cycles.
	mmio_write(GPPUDCLK0, (1 << 14) | (1 << 15));
	delay(150);

	// Write 0 to GPPUDCLK0 to make it take effect.
	mmio_write(GPPUDCLK0, 0x00000000);

	// Clear pending interrupts.
	mmio_write(UART0_ICR, 0x7FF);

	// Set integer & fractional part of baud rate.
	// Divider = UART_CLOCK/(16 * Baud)
	// Fraction part register = (Fractional part * 64) + 0.5
	// UART_CLOCK = 3000000; Baud = 115200.

	// Divider = 3000000 / (16 * 115200) = 1.627 = ~1.
	mmio_write(UART0_IBRD, 1);
	// Fractional part register = (.627 * 64) + 0.5 = 40.6 = ~40.
	mmio_write(UART0_FBRD, 40);

	// Enable FIFO & 8 bit data transmissio (1 stop bit, no parity).
	mmio_write(UART0_LCRH, (1 << 4) | (1 << 5) | (1 << 6));

	// Mask all interrupts.
	mmio_write(UART0_IMSC, (1 << 1) | (1 << 4) | (1 << 5) | (1 << 6) |
	                       (1 << 7) | (1 << 8) | (1 << 9) | (1 << 10));

	// Enable UART0, receive & transfer part of UART.
	mmio_write(UART0_CR, (1 << 0) | (1 << 8) | (1 << 9));
}

void uart_putc(unsigned char c)
{
	// Wait for UART to become ready to transmit.
	while ( mmio_read(UART0_FR) & (1 << 5) ) { }
	mmio_write(UART0_DR, c);
}

unsigned char uart_getc()
{
    // Wait for UART to have received something.
    while ( mmio_read(UART0_FR) & (1 << 4) ) { }
    return mmio_read(UART0_DR);
}

void uart_puts(const char* str)
{
	for (size_t i = 0; str[i] != '\0'; i ++)
		uart_putc((unsigned char)str[i]);
}

#if defined(__cplusplus)
extern "C" /* Use C linkage for kernel_main. */
#endif
void kernel_main(uint32_t r0, uint32_t r1, uint32_t atags)
{
	// Declare as unused
	(void) r0;
	(void) r1;
	(void) atags;

	uart_init();
	uart_puts("Hello, kernel World!\r\n");

	while (1)
		uart_putc(uart_getc());
}
```

GPU 부트로더는 `r0`~`r2`를 통해 커널에 인수(Argument)를 전달하고 `boot.S`는 이러한 3개의 레지스터를
보존합니다. 이것들은 C 함수 호출에서 사용되는 3개의 인수입니다. `r0`은 Raspberry Pi가 부팅된 장치의
코드를 포함합니다. 일반적으로 `0`이지만 실제 값은 보드의 펌웨어에 따라 다릅니다. `r1`은 'ARM Linux
Machine Type'이 들어있으며, Raspberry Pi의 경우 BCM2708 CPU를 식별하는 `3138`(`0xC42`)입니다.
[여기에서](https://www.arm.linux.org.uk/developer/machines/) ARM Machine 유형의 전체 목록을 볼 수 있
습니다. `r2`는 ATAG(ARM TAG)의 주소를 가지고 있습니다.

GPIO와 UART의 주소는 Peripheral Base Address의 offset이며, Raspberry Pi 1은 `0x20000000`이고
Raspberry Pi 2와 Raspberry Pi 3은 `0x3F000000`입니다. 레지스터 주소와 사용 방법은 BCM2835 설명서에서
확인할 수 있습니다.

다음과 같이 컴파일합니다:

```sh
arm-none-eabi-gcc -mcpu=arm1176jzf-s -fpic -ffreestanding -std=gnu99 -c kernel.c -o kernel.o -O2 -Wall -Wextra
```

64비트로는 다음과 같이 컴파일합니다:

```sh
aarch64-elf-gcc -ffreestanding -nostdinc -nostdlib -nostartfiles -c kernel.c -o kernel.o
```

위의 코드는 몇 가지 확장 기능을 사용하므로, C99의 GNU 버전으로 빌드 합니다.

# Linking the Kernel

마지막으로 커널을 생성하기 위해 오브젝트 파일들을 Link 해야 합니다. 일반적인 프로그래밍을 할 때
Toolchain은 프로그램을 Link 하기 위한 기본 스크립트를 제공합니다. 하지만 커널 개발에는 적합하지 않으
며 사용자 정의된 Linker Script를 사용해야 합니다. 64비트 모드의 Linker Script는 시작 주소를 제외하고
는 똑같습니다.

```
ENTRY(_start)

SECTIONS
{
    /* Starts at LOADER_ADDR. */
    . = 0x8000;
    /* For AArch64, use . = 0x80000; */
    __start = .;
    __text_start = .;
    .text :
    {
        KEEP(*(.text.boot))
        *(.text)
    }
    . = ALIGN(4096); /* align to page size */
    __text_end = .;

    __rodata_start = .;
    .rodata :
    {
        *(.rodata)
    }
    . = ALIGN(4096); /* align to page size */
    __rodata_end = .;

    __data_start = .;
    .data :
    {
        *(.data)
    }
    . = ALIGN(4096); /* align to page size */
    __data_end = .;

    __bss_start = .;
    .bss :
    {
        bss = .;
        *(.bss)
    }
    . = ALIGN(4096); /* align to page size */
    __bss_end = .;
    __end = .;
}
```

`ENTRY(_start)`는 커널 이미지의 진입점을 선언합니다. 이 심볼은 `boot.S` 파일에서 선언되었습니다.

`SECTIONS`은 섹션을 선언합니다. 이것은 코드와 데이터의 비트가 어디로 갈지 결정하고 각 섹션의 크기를
추적하는데 도움이 되는 몇 가지 심볼을 설정합니다.

```assembly
    . = 0x8000;
    __start = .;
```

첫 번째 줄의 "`.`"은 현재 주소를 커널이 시작되는 `0x8000`(또는 `0x80000`)으로 설정하도록 Linker에 알
리기 위해 현재 주소를 나타냅니다. Linker가 데이터를 추가하면 현재 주소가 자동으로 증가합니다. 두 번
째 줄은 "`__start`" 심볼을 만들고 현재 주소로 설정합니다.

이후 섹션은 Text(Code), Read-Only Data, Read-Write Data 그리고 BSS(0으로 초기화된 메모리)로 정의됩니
다.

```assembly
    __text_start = .;
    .text : {
        KEEP(*(.text.boot))
        *(.text)
    }
    . = ALIGN(4096); /* align to page size */
    __text_end = .;
```

첫 번째 행은 섹션에 `__text_start` 심볼을 만듭니다. 두 번째 줄부터 다섯 번째 줄까지는 `.text` 섹션입
니다. 3행과 4행은 파일의 어떤 섹션이 `.text` 섹션에 배치될지 선언합니다. 여기서는 "`.text.boot`"이
먼저 배치되고 그 뒤에 일반적인 "`.text`"가 옵니다. "`.text.boot`"는 `boot.S`에서만 사용되며 커널 이
미지의 시작 부분에서 끝납니다. "`.text`"는 나머지 코드 모두를 포함합니다. Linker에서 추가한 모든 데
이터는 현재 주소("`.`")를 자동으로 증가시킵니다. 6행에서는 4096 바이트씩(Raspberry Pi에 대한 페이지
크기) 정렬되도록 설정합니다. 그리고 마지막 7행에서는 `__text_end` 심볼을 만들어서 섹션이 끝나는 곳을
알 수 있습니다.

`__text_start`와 `__text_end`는 무엇이고 페이지 정렬을 사용하는 이유는 무엇일까요? 심볼
`__text_start`와 `__text_end`는 커널 소스에서 사용될 수 있으며, Linker는 올바른 주소를 바이너리에 저
장합니다. 예를 들어 `__bss_start` 와 `__bss_end`는 `boot.S`에서 사용하고 있습니다. 원한다면 C에서
`extern`으로 선언하여 사용할 수도 있습니다. 필요하진 않지만 모든 섹션을 페이지 크기에 맞게 정렬했습
니다. 나중에 겹쳐서(한 페이지에 2개의 섹션) 처리할 필요 없이 Executable, Read-Only, Read-Write 권한
을 사용하여 [페이지 테이블](https://ko.wikipedia.org/wiki/페이지_테이블)에 매핑할 수 있습니다.

```assembly
    __end = .;
```

모든 섹션이 선언된 후 `__end` 심볼을 만듭니다. 런타임 중에 커널의 크기를 알고 싶다면 `__start`와
`__end`를 사용하여 구할 수 있습니다.

이러한 구성요소를 통해 실제로 최종적인 커널을 빌드 할 수 있습니다. Linker는 Link Process를 보다 잘
할 수 있도록 Compiler를 Linker로 사용합니다. 커널이 C++로 작성되었다면, C++ 컴파일러를 사용해야 합니
다.

아래와 같이 커널을 빌드 합니다:

```sh
arm-none-eabi-gcc -T linker.ld -o myos.elf -ffreestanding -O2 -nostdlib boot.o kernel.o
arm-none-eabi-objcopy myos.elf -O binary kernel7.img
```

64비트용으로는 다음과 같이 합니다:

```sh
aarch64-elf-ld -nostdlib -nostartfiles boot.o kernel.o -T link.ld -o myos.elf
aarch64-elf-objcopy myos.elf -O binary kernel8.img
```

# Booting the Kernel

이제 여러분이 만든 커널을 부팅해보겠습니다.

## Testing your operating system (Real Hardware)

Raspbian 이미지가 기록된 SD카드가 있다면, 이미 부팅 파티션과 필요한 파일이 있다는 것입니다.

SD카드에서 첫 번째 파티션을 마운트 하면 아래와 같은 파일들이 있을 것입니다.

```
bootcode.bin  fixup.dat     kernel.img            start.elf
cmdline.txt   fixup_cd.dat  kernel_cutdown.img    start_cd.elf
config.txt    issue.txt     kernel_emergency.img
```

만약 Raspbian 이미지가 없으면, FAT32 파티션을 만들고
[공식 저장소에서 펌웨어 파일을 다운로드](https://github.com/raspberrypi/firmware/tree/master/boot)
할 수 있습니다. 3개의 파일만 필요합니다.

- `bootcode.bin`: 이 파일이 제일 먼저 로드되고, GPU에서 실행되는 파일입니다.
- `fixup.dat`: 이 데이터 파일에는 중요한 하드웨어 관련 정보가 들어있습니다.
- `start.elf`: Raspberry Pi 펌웨어입니다. (IBM PC의 BIOS와 동일합니다) 이것 또한 GPU에서 실행됩니다.

Raspberry Pi의 전원이 켜지면 ARM CPU가 중지되고 GPU가 실행됩니다. GPU는 ROM에서 부트로더를 로드하고
실행합니다. 그리고 SD카드를 찾아 `bootcode.bin`을 로드합니다. bootcode는 `config.txt`와
`cmdline.txt`를 처리하는 `start.elf` 펌웨어를 로드합니다. `start.elf`는 `kernel*.img`를 로드하고 해
당 커널 이미지를 실행하는 ARM CPU가 실행됩니다.

ARM 모드 간을 전환하려면 `kernel.img` 파일의 이름을 변경해야 합니다. `kernel7.img`로 이름을 바꾸면
AArch32 모드 (ARMv7)에서 실행됩니다. AArch64 모드(ARMv8)의 경우 `kernel8.img`로 이름을 변경해야 합니
다.

이제 원래 있던 `kernel.img`를 자신이 만든 커널 파일로 교체하고, SD카드를 Raspberry Pi에 꽂아 전원을
켭니다. Minicom에서는 다음을 보여주게 됩니다.

```
Hello, kernel World!
```

## Testing your operating system (QEMU)

QEMU는 Raspberry Pi 2 에뮬레이팅을 지원합니다. Machine type를 "raspi2"로 사용하면 됩니다.  
QEMU를 사용하면 일반적으로 커널을 바이너리로 objcopy 할 필요가 없습니다. QEMU는 ELF 커널도 지원합니
다.

```sh
qemu-system-arm -m 256 -M raspi2 -serial stdio -kernel kernel.elf
```

> 원문 : [OSDev Wiki - Raspberry Pi Bare Bones](https://wiki.osdev.org/Raspberry_Pi_Bare_Bones)
