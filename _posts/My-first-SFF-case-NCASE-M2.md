---
title: '나의 첫 SFF 케이스 NCASE M2'
date: '2024-10-04 00:14:03'
category: Ordinary-Life
---

2년 전에 SFF(Small Form Factor)라는 것을 알게 되면서 한번 맞춰보고 싶었는데, 최근에 출시한 AMD Ryzen 9700X의 TDP가 65W이면서 개인 작업 시 필요로 하는 성능도 되길래 드디어 SFF를 조립하게 되었습니다.

## 준비물

소음에 민감한 편이라 모든 팬은 녹투아 제품을 사용했습니다.

- **Case** :
    - [NCASE M2 Round (Black)](https://ncased.com/products/m2-round)
    - [M Series - Front IO Cover](https://ncased.com/collections/m2-accessories/products/m-series-front-io-cover)
    - [M Series - Fan + Radiator Bracket](https://ncased.com/collections/m2-accessories/products/m-series-fan-radiator-bracket)
- **Motherboard** : [GIGABYTE B650M AORUS ELITE AX](https://www.gigabyte.com/Motherboard/B650M-AORUS-ELITE-AX-rev-13)
- **CPU** : [AMD Ryzen™ 7 9700X](https://www.amd.com/ko/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9700x.html)
- **DRAM** : [SKhynix DDR5 PC5-44800 32GB](https://www.compuzone.co.kr/product/product_detail.htm?ProductNo=984267) (2개)
- **SSD** : [Samsung 990 PRO PCIe 4.0 4TB](https://www.samsung.com/sec/memory-storage/990-pro-nvme-ssd-d2c7/MZ-V9P4T0BW)
- **GPU** : [GIGABYTE GeForce RTX 4060 Gaming OC D6 8GB](https://www.gigabyte.com/Graphics-Card/GV-N4060GAMING-OC-8GD)
- **PSU** : [CORSAIR SF750 80 PLUS Platinum (SFX/750W)](https://www.corsair.com/us/en/p/psu/cp-9020186-na/sf-series-sf750-750-watt-80-plus-platinum-certified-high-performance-sfx-psu-cp-9020186-na)
- **CPU Cooler** : [Thermalright Peerless Assassin 120 MINI BLACK](https://www.thermalright.com/product/peerless-assassin-120-mini-black/)([NOCTUA NF-A12x25 PWM](https://noctua.at/en/nf-a12x25-pwm-chromax-black-swap)으로 교체)
- **System Fan** :
    - [NOCTUA NF-A12x25 PWM](https://noctua.at/en/nf-a12x25-pwm-chromax-black-swap) (4개)
    - [NOCTUA NF-A9 PWM](https://noctua.at/en/nf-a9-pwm-chromax-black-swap) (1개)
- **Etc** :
    - [Thermalright AM5 Secure Frame BLACK](https://www.thermalright.com/product/am5-secure-frame-black)
    - [NOCTUA NA-SYC1](https://noctua.at/en/na-syc1)

## 시스템 팬 배치

아래와 같이 상단, 측면을 배기로 사용하고 나머지를 모두 흡기로 배치했습니다.

![시스템 팬 배치](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_1.jpg)

## 결과물

기존에 사용했던 NZXT H7 Flow와 크기를 비교해 봤는데 정말 아담하고 디자인도 좋습니다.

![NCASE M2 Round](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_2.jpg)  
![NCASE M2 Round and NZXT H7 Flow](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_3.jpg)

## 추가 설정

성능을 조금이라도 올리고 싶어 아래와 같이 BIOS 설정을 변경했습니다.

- Tweaker
    - Advanced CPU Settings
        - SVM Enable : `Enabled` (작업할 때 Virtual Machine을 사용하기 때문에 설정했습니다)
        - Presision Boost Overdrive
            - Presision Boost Overdrive : `Advanced`
            - PBO Limits : `Manual`
            - PPT Limit \[mW\] : `105000`
            - TDC Limit \[mA\] : `90000`
            - EDC Limit \[mA\] : `150000`
            - Platform Thermal Throttle Ctrl : `Manual`
            - Platform Thermal Throttle Limit : `75`
            - Curve Optimizer
                - Curve Optimizer : `Per Core` (AMD Ryzen Master로 봤을 때 주력 코어가 Core 1, 5이기 때문에 주력 코어에는 -20, 나머지 코어는 -25를 주었습니다)
                - Core 0 Curve Optimizer Sign : `Negative`
                - Core 0 Curve Optimizer Magnitude : `25`
                - Core 1 Curve Optimizer Sign : `Negative`
                - Core 1 Curve Optimizer Magnitude : `20`
                - Core 2 Curve Optimizer Sign : `Negative`
                - Core 2 Curve Optimizer Magnitude : `25`
                - Core 3 Curve Optimizer Sign : `Negative`
                - Core 3 Curve Optimizer Magnitude : `25`
                - Core 4 Curve Optimizer Sign : `Negative`
                - Core 4 Curve Optimizer Magnitude : `25`
                - Core 5 Curve Optimizer Sign : `Negative`
                - Core 5 Curve Optimizer Magnitude : `20`
                - Core 6 Curve Optimizer Sign : `Negative`
                - Core 6 Curve Optimizer Magnitude : `25`
                - Core 7 Curve Optimizer Sign : `Negative`
                - Core 7 Curve Optimizer Magnitude : `25`
    - DDR5 Auto Booster : `Disabled`
    - System Memory Multiplier : `52.00` (GIGABYTE B650M AORUS ELITE AX에서 DDR5 5600MHz는 OC 모드로 동작하기 때문에, 장착된 DRAM이 5600MHz이지만 5200MHz로 낮춰서 설정했습니다)
    - Advanced Memory Settings
        - Power Down Enable : `Enabled`
        - Memory Context Restore : `Enabled`
    - CPU Vcore : `Normal`
    - Dynamic Vcore(DVID) : `-0.050V`
- Settings
    - ErP : `Enabled`
    - Integrated Graphics : `Disabled`
    - Gigabyte Utilities Downloader : `Disabled`
- Boot
    - Fast Boot : `Ultra Fast`

**CPU 팬 설정 :**  
![CPU 팬 설정](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_4.png)

**후면 팬 설정 :**  
![후면 팬 설정](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_5.png)

**하단 팬 설정 :**  
![하단 팬 설정](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_6.png)

**측면 팬 설정 :**  
![측면 팬 설정](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_7.png)

**상단 팬 설정 :**  
![CPU_FAN](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_8.png)

## 성능 및 소음

BIOS 기본 설정 값과 위에서 설정한 값의 성능과 온도를 측정했습니다. (실내온도 25℃에서 테스트 진행)

- Cinebench R23 : 19476 pts → 22026 pts
    - 최대 온도 : 62.0℃ → 67.0℃
- Cinebench R24 : 1118 pts → 1218 pts
    - 최대 온도 : 66.2℃ → 67.0℃

결과를 보면 만족스러운 거 같습니다. BIOS Default Setting은 팬 속도도 제가 설정한 것보다 더 높은 값이어서 시끄러웠는데, PPT 105W로 설정하고 저소음으로 동작하도록 수동 설정했는데 최대 온도도 적당한 상태에서 성능은 향상된 것을  볼 수 있습니다.

![Cinebench 결과](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_9.jpg)

추가로 BIOS 설정 이후 Idle 온도는 46℃가 측정되었습니다. (실내 온도 25℃에서 40분 측정)

![Idle 온도](/assets/image/2024-10-03-My-first-SFF-case-NCASE-M2/2024-10-03-My-first-SFF-case-NCASE-M2_10.png)

# 결론

사용 환경에 알맞은 설정을 찾느라 고생했지만, **저소음** + **온도 관리** + **작업용으로 사용 가능**한 SFF를 맞추게 돼서 너무 행복합니다😊