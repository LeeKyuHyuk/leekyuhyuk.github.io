---
title: '나만의 NXP LPC812 Board를 만들어보자!'
date: '2023-04-07 23:08:11'
category: ARM-Cortex-M0
---

ARM Cortex M0를 시작하기 전에 간단한 Board를 만들어보겠습니다.

### 준비물

비교적 작업이 쉬운 SO20 패키지 형태인 'LPC812M101JD20J'를 선택했습니다.

- [LPC812M101JD20J](https://www.eleparts.co.kr/goods/view?no=6087287)
- [SOP20/TSSOP20 양면변환기판](https://www.eleparts.co.kr/goods/view?no=2670262)
- [2.54mm 핀 헤더 1x40P Black](https://www.eleparts.co.kr/goods/view?no=10955856)
- Push Button Switch 2개
- 저항 470Ω 1개
- LED 1개
- USB to Serial 케이블 1개 (3.3V)

### 회로도

'LPC812M101JD20J'를 'SOP20/TSSOP20 양면변환기판'에 핀 헤더와 함께 납땜 합니다.  
![NXP LPC812 on PCB](/assets/image/2023-04-07-Make-Your-Own-NXP-LPC812-Board/2023-04-07-Make-Your-Own-NXP-LPC812-Board_1.jpg)

그리고 브레드보드에 아래와 같이 연결합니다. 전원은 3.3V를 인가해야 합니다.  
![NXP LPC812 Board Schematic](/assets/image/2023-04-07-Make-Your-Own-NXP-LPC812-Board/2023-04-07-Make-Your-Own-NXP-LPC812-Board_2.png)

### 예제 프로그램(Blinky) Flash 하기

LED를 깜빡이는 예제 프로그램(Blinky)을 넣기 위해 [lpc21isp](https://sourceforge.net/projects/lpc21isp) 소스코드를 받아 빌드 합니다.  
![lpc21isp](/assets/image/2023-04-07-Make-Your-Own-NXP-LPC812-Board/2023-04-07-Make-Your-Own-NXP-LPC812-Board_3.png)

ARM Cross Compile을 위해 [GNU Arm Embedded Toolchain Downloads](https://developer.arm.com/downloads/-/gnu-rm)에 접속하여 Toolchain을 다운로드해 `/opt`에 압축을 해제합니다.  
![GNU Arm Embedded Toolchain Downloads](/assets/image/2023-04-07-Make-Your-Own-NXP-LPC812-Board/2023-04-07-Make-Your-Own-NXP-LPC812-Board_4.png)

[Blinky](https://github.com/LeeKyuHyuk/Bare-Metal-NXP-LPC812/tree/master/examples/Blinky) 예제를 받아 `Makefile`의 `CC`, `AS`, `LD`, `OBJCOPY`, `LIBSPEC`에 있는 경로를 알맞게 수정하고 `make main.elf`를 실행합니다.  
![Blinky Example Build](/assets/image/2023-04-07-Make-Your-Own-NXP-LPC812-Board/2023-04-07-Make-Your-Own-NXP-LPC812-Board_5.png)

ISP 모드로 진입하기 위해 Reset 버튼을 누른 상태로 ISP 버튼을 누르고 Reset 버튼에서 손을 뗍니다. ISP 모드에 진입되면 ISP 버튼에서도 손을 뗍니다.  
`lpc21isp main.hex /dev/ttyUSB0 9600 12000000` 명령어를 사용하여 LPC812에 Flash 합니다. (Root 권한이 필요합니다)  
정상적으로 Flash가 되었다면 아래와 같은 화면이 출력됩니다.  
![Use lpc21isp](/assets/image/2023-04-07-Make-Your-Own-NXP-LPC812-Board/2023-04-07-Make-Your-Own-NXP-LPC812-Board_6.png)

브레드보드의 LED가 깜빡깜빡하는 것도 확인할 수 있습니다.  
![Blinky](/assets/image/2023-04-07-Make-Your-Own-NXP-LPC812-Board/2023-04-07-Make-Your-Own-NXP-LPC812-Board_7.gif)