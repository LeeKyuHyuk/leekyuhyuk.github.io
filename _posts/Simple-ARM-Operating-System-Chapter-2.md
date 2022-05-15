---
title: 'Chapter 2: ARM Assembly 기초'
date: '2019-03-04 23:07:02'
category: Simple-ARM-Operating-System
---

작업에 들어가기 전에 ARM Assembly에 대해 배워보도록 합시다.

- ARM CPU의 기본 구성
  - `R0`~`R14` 총 15개의 범용 레지스터를 가지고 있습니다.
  - 범용 레지스터 `R13`는 특수 레지스터 `SP`로 사용됩니다.
    - `SP`는 C언어 사용시 스택의 주소를 저장하는 레지스터입니다.
  - 범용 레지스터 `R14`는 특수 레지스터 `LR`로 사용됩니다.
    - `LR`은 함수 호출 시 되돌아갈 함수의 주소가 저장되는 레지스터입니다.
  - 범용 레지스터 `R15`는 특수 레지스터 `PC`로 사용됩니다.
    - `PC`는 다음 실행할 프로그램의 주소를 가지고 있는 레지스터입니다.
  - `CPSR`이라는 상태 레지스터를 가지고 있습니다.  
    ![Operand](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_1.jpg)
  - `Rs`, `Rd`는 반드시 레지스터(`R0`~`R15`)이어야 합니다.
    - `OP1`은 항상 레지스터 입니다.
  - **`OP2`는 레지스터 일수도 있고, 레지스터가 아닐수도 있습니다.**
  - [`Rs`, `Rd`, `OP2`의 대상으로 직접 외부 메모리를 접근할수 없습니다.](#ldr-str-쉽게-이해하는-방법)

---

### Load, Store

#### `MOV` 명령

- ARM에서 레지스터의 데이터 이동은 `MOV` 명령을 사용합니다.
  - 예) `MOV R0, R1` : `R1`의 내용을 `R0`으로 복사
  - 예) `MOV R0, #1` : 상수 `1`을 `R0`으로 복사
- 메모리→레지스터 : `LDR` (Load to Register)
- 레지스터→메모리 : `STR` (Store to Memory)

#### 상수 값을 레지스터에 저장

- `LDR` 명령 사용 방법
  - `LDR Rn, =Value`
  - **`LDR`을 사용하여 상수의 값을 레지스터에 저장할때 `=Value`에서 `=`를 빼먹지 않게 주의합니다.**
    - 다른 명령어에서는 상수 입력에 `#`이 들어가지만 `LDR`만 `=`이 들어가니 주의합시다.
  - 레지스터간 데이터 복사는 `MOV`를 사용합니다.
  - `Rn` : `R0` ~ `R15` (대소문자 구분 없음)
  - `=Value` : 상수 값 (최대 4바이트)
    - 10진수 :
      - **예)** `41`, `-27`
    - 16진수 :
      - **예)** `0x1234`, `-0x1EF`
    - 예) `LDR R0, =100`, `LDR R13, =0x1234`

#### 상수 표현

- `OP2`의 상수는 8비트의 값고 짝수 비트 ROR(Rotate Right)로 표현되어야 합니다.
  - 32비트 명령 안에서 상수 값을 함께 저장하다보니 범위 제한이 발생하기 때문입니다.
  - `0`~`255` 범위의 상수는 무조건 사용이 가능합니다.

#### 사용된 상수가 `MOV` 명령에서 사용 가능한지 불가능한지 판단해보자

- `MOV R0, #0x7F00` : **가능**
  ![Example1](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_2.png)

- `MOV R0, #0x30C0` : **가능**
  ![Example2](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_3.png)

- `MOV R3, #0x14E` : **불가능**
  ![Example3](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_4.png)

- `LDR`을 사용하면, **범위 제한 없는 32비트 값으로 표현 가능**
  - 실제 상수 값은 메모리에 존재하며 레지스터 참조로 변환됩니다.

> `MOV`보다 `LDR`이 느리지만, `LDR`은 32비트 데이터를 사용할 수 있습니다.

#### 레지스터 간접참조 `LDR`, `STR`

- 레지스터 간접 참조 :
  - `LDR Rd, [Rs]`
    - `Rs` 레지스터 값을 메모리 주소로 하여 `Rd`에 저장
    - `Rs`, `Rd` : `R0` ~ `R15`
  - `STR Rs, [Rd]`
    - `Rd` 레지스터 값을 메모리 주소로 하여 `Rs`를 저장
    - `Rs`, `Rd` : `R0` ~ `R15`

##### 예)

```assembly
  LDR R0, =0x1000   @ R0에 상수 0x1000 저장
  LDR R1, =80       @ R1에 상수 80 저장
  STR R1, [R0]      @ R0의 값인 0x1000를 메모리 주소로 참조하여
                    @ 0x1000에 상수 80을 저장
```

#### `LDR`, `STR` 쉽게 이해하는 방법

![LDR STR Tip!](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_5.png)

### Label

```assembly
START:  MOV R0, #10       @ R0 레지스터에 상수 10을 저장
        STR R0, [R1]      @ R1에 저장되어 있는 주소에 R0 값을 저장
        LDR PC, =START    @ START의 주소를 PC(Program counter)에 저장
```

- Label은 모두 주소 값(해당 Label 위치의 주소)입니다.
- 위의 코드는 `START`의 주소 값을 PC(Program counter)에 저장하여 무한 루프를 하게 됩니다.

### `LDR`, `STR` Post Indexing

#### Post Indexing 사용 방법:

```assembly
  LDR R0, [R1], #4            @ R1 주소에 있는 값을 R0에 넣고, R1에 4를 더합니다.
  STR R0, [R2], #-4           @ R0의 값을 R2의 주소에 넣고, R2에 4를 뺍니다.
```

```assembly
  LDR R0, [R1], R3            @ R1 주소에 있는 값을 R0에 넣고, R1에 R3의 값을 더합니다.
  STR R0, [R2], -R3           @ R0의 값을 R2의 주소에 넣고, R2에 R3의 값을 뺍니다.
```

```assembly
  LDR R0, [R1], R3, LSL #2    @ R1 주소에 있는 값을 R0에 넣고,
                              @ R1에 R3, LSL #2한 값을 더합니다.
  STR R0, [R2], -R3, ASR #2   @ R2 주소에 있는 값을 R0에 넣고,
                              @ R2에 R3, ASR #2한 값을 뺍니다.
```

##### 예)

```assembly
  LDR R1, 0x1000              @ R1에 상수 0x1000을 넣습니다.
                              @ R1 : 0x1000

  LDR R0, [R1], #4            @ R0에 0x1000를 참조한 값(R1의 메모리 참조주소)을 넣고,
                              @ R1에 4를 더합니다.
                              @ R1 : 0x1004

  LDR R2, [R1], #4            @ R2에 0x1004를 참조한 값(R1의 메모리 참조주소)을 넣고,
                              @ R1에 4를 더합니다.
                              @ R1 : 0x1008
```

### `LDR`, `STR` Pre Indexing

#### Pre Indexing 사용 방법:

```assembly
  LDR R0, [R1], #4            @ R1에 4를 더한것을 참조하여 R0에 넣습니다.
  STR R0, [R2], #-4           @ R0의 값을 R2에 4를 뺀 주소에 넣습니다.
```

```assembly
  LDR R0, [R1], R3            @ R1에 R3의 값을 더한것을 참조하여 R0에 넣습니다.
  STR R0, [R2], -R3           @ R0의 값을 R2에 R3의 값을 뺀 주소에 넣습니다.
```

```assembly
  LDR R0, [R1], R3, LSL #2    @ R1에 R3, LSL #2한 값을 더한뒤,
                              @ 주소에 있는 값을 R0에 넣습니다.
  STR R0, [R2], -R3, ASR #2   @ R2에 R3, ASR #2한 값을 뺀뒤,
                              @ R0의 값을 변경된 주소로 넣습니다.
```

##### 예)

```assembly
  LDR R1, 0x1000              @ R1에 상수 0x1000을 넣습니다.
                              @ R1 : 0x1000

  LDR R0, [R1, #4]            @ R1에 4를 더한 주소의 참조한 값(0x1004)을 R0에 넣습니다.
                              @ R1 : 0x1000

  LDR R2, [R1, #4]            @ R1에 4를 더한 주소의 참조한 값(0x1004)을 R2에 넣습니다.
                              @ R1 : 0x1000
```

> Pre Indexing에서는 **값이 업데이트 되지 않습니다!** 만약 값을 업데이트하고 싶다면 아래의 `!`(Auto
> Update) 옵션을 사용해야합니다.

#### '`!`(Auto Update) suffix' 사용 예시)

```assembly
  LDR R1, 0x1000              @ R1에 상수 0x1000을 넣습니다.
                              @ R1 : 0x1000

  LDR R0, [R1, #4]!           @ R1에 4를 더한 주소의 참조한 값(0x1004)을 R0에 넣습니다.
                              @ ! suffix가 있으므로, 자동으로 값이 업데이트 됩니다.
                              @ R1 : 0x1004

  LDR R2, [R1, #4]            @ R1에 4를 더한 주소의 참조한 값(0x1008)을 R2에 넣습니다.
                              @ ! suffix가 없으므로, 자동으로 값이 업데이트 되지 않습니다.
                              @ R1 : 0x1004
```

#### `LSL`, `LSR` Shift

- `LSL #n` : 최후에 밀려난 비트가 `CPSR`(상태레지스터)의 C(Carry) flag에 저장
  - Logical Shift Left
  - `LSL` : `signed/unsigned` 곱하기 2
- `LSR #n` : 최후에 밀려난 비트가 `CPSR`(상태레지스터)의 C(Carry) flag에 저장
  - Logical Shift Right
  - `LSR` : `unsigned` 나누기 2

#### `ASR` Shift

- `ASR #n` : MSB(부호)를 유지하고, 밀려난 비트가 `CPSR`(상태레지스터)의 C(Carry) flag에 저장
  - 레지스터를 우측으로 지정한 비트 수 만큼 **부호를 유지하며** Shift합니다.
  - `ASR`은 `signed int`의 나누기 2 동작을 수행합니다.

---

### 비트제어 명령어

- `ORR` : 원하는 비트만 1로 설정합니다.

  - 예) `ORR R0, R0, #0x1F` , `ORR R0, R1, R2, LSL #2`

- `EOR` : 원하는 비트만 반전 시킵니다.

  - 예) `EOR R0, R0, #0x1F` , `EOR R0, R1, R2, LSL #2`

- `AND` : 원하는 비트만 0으로 설정합니다.

  - **0인 비트에 0으로 설정합니다.**
  - 예) `AND R0, R0, #0x1F` , `AND R0, R1, R2, LSL #2`

- `BIC` : 원하는 비트만 0으로 설정합니다.
  - **1인 비트에 0으로 설정합니다.**
  - `AND`보다 편리한 장점이 있습니다.
  - 예) `BIC R0, R0, #0x1F` , `BIC R0, R1, R2, LSL #2`

#### 다양한 비트연산

- **[문제]** `0x1000`의 4~7번 비트를 `1010`으로 변경하는 어셈블리 코드를 작성하세요.

![Example4](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_6.png)

```assembly
  LDR R0, =0x1000           @ R0에 상수 0x1000을 넣습니다.
  LDR R1, [R0]              @ R1에 R0을 참조한 값을 넣습니다.
  BIC R1, R1, 0xF << 4      @ '1111'을 4번 Left Shift하면 '11110000'가 됩니다.
                            @ BIC로 R1의 4~7 비트를 0으로 설정합니다.
  ORR R1, R1, 0xA << 4      @ '1010'을 4번 Left Shift하면 '10100000'가 됩니다.
                            @ ORR로 R1의 5, 7번 비트를 1로 설정합니다.
  STR R1, [R0]              @ R1의 데이터를 R0에 저장되어있는 메모리주소에 저장합니다.
```

---

### 분기 명령어

- `B` 명령 사용 예시:
  1. `B add` : Global Label
  2. `B 1f` : Local Label
  3. `B . ` : 무한 루프 (`.`은 제자리를 말합니다.)
- `B R0`와 같이 `B` 명령은 분기 주소로 레지스터를 쓸수 없습니다.

---

### 비교 연산 명령어

- `CMP` : `CMP Rs, OP2`
  - `Rn - OP2` 연산을 하여 `CPSR`(상태레지스터)의 Flag만 변경합니다.
- `CMN` : `CMN Rs, OP2`
  - `Rn + OP2` 연산을 하여 `CPSR`(상태레지스터)의 Flag만 변경합니다.
  - 컴파일러단에서 주로 사용되니, 되도록이면 `CMP`를 사용하자.
- `TST` : `TST Rs, OP2`
  - `Rn & OP2` 연산을 하여 `CPSR`(상태레지스터)의 Flag만 변경합니다.
  - **특정비트를 확인하기 위해 사용됩니다.**
  - 비교 비트가 **1이면, Z clear, 0이면 Z set**
- `TEQ` : `TEQ Rs, OP2`
  - `Rn ^ OP2` 연산을 하여 `CPSR`(상태레지스터)의 Flag만 변경합니다.
  - **두 데이터의 비트가 완전 똑같은지 확인하기 위해 사용됩니다**
  - 비트 패턴이 **동일하면, Zero set**

> 비교연산은 레지스터에 변화가 없으며, Flag만 변합니다.

- **[문제]** `R0`의 7번 비트가 `1`이면 `R1` 레지스터에 2를 기록하고, `0`이면 `R1` 레지스터에 3을 기
  록하는 프로그램을 작성하시오.

- `AND`를 사용하여 해결:

```assembly
  AND R0, R0, #1 << 7
  CMP R0, #0
  MOVEQ R1, #3
  MOVNE R1, #2
```

- `TST`를 사용하여 해결:

```assembly
  TST R0, #1 << 7
  MOVEQ R1, #3
  MOVNE R1, #2
```

---

### `CPSR`(상태레지스터)과 Flag

![CPSR : https://www.wikinote.org/Main/Savitribai-Phule-Pune-University/ENTC/AP-TE/Unit-1/Registers-CPSR-SPSR](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_7.jpg)

비교 연산을 할때는 NZCV만 사용한다

- N (Negative) : 연산결과가 음수인 경우
- Z (Zero) : 연산결과가 0인 경우
- C (Carry) : 덧셈 Carry에 Set, 뺄셈 Borrow에 Clear, Rotate시 밀린 비트 저장
- V (oVerflow) : `signed` 덧셈, 뺄셈 연산 결과로 값의 초과가 발생한 경우

> Carry는 덧셈을 했을때 범위를 초과해서 자리 올림이 발생했을때를 말하는것입니다. Overflow와는 다릅니
> 다.

---

### 상태 플래그와 조건

```assembly
  CMP R0, R1
  B□□ LOOP
```

□ 부분에 아래의 16가지 조건식이 들어가게 됩니다.

| 약어          | 뜻                                     | Flag 상태                    |
| ------------- | -------------------------------------- | ---------------------------- |
| **`EQ`**      | **Eq**ual / Equals zero (False)        | Z set                        |
| **`NE`**      | **N**ot **E**qual (True)               | Z clear                      |
| **`CS`**/`HS` | Carry Set / Unsigned higher or same    | **C set**                    |
| **`CC`**/`LO` | Carry Clear / Unsigned Lower           | **C clear**                  |
| **`MI`**      | **Mi**nus / Negative                   | N set                        |
| **`PL`**      | **Pl**us / Positive or zero            | N clear                      |
| **`VS`**      | Overflow                               | **V s**et                    |
| **`VC`**      | No Overflow                            | **V c**lear                  |
| **`HI`**      | `Unsigned` **hi**gher                  | C set and Z clear            |
| **`LS`**      | `Unsigned` **l**ower or **s**ame       | C clear and Z set            |
| **`GE`**      | `Signed` **g**reater then or **e**qual | N equals V                   |
| **`LT`**      | `Signed` **l**ess **t**han             | N is not equals V            |
| **`GT`**      | `Signed` **g**reater **t**han          | Z clear and N equals V       |
| **`LE`**      | `Signed` **l**ess than or **e**qual    | Z set or N is not equal to V |
| **`AL`**      | **Al**ways                             | Any state                    |
| **`NV`**      | **N**e**v**er                          | None                         |

- 주소 연산을 할때는 `HI`, `LO`, `HS`, `LS`와 같은 `Unsigned` 비교를 사용합니다.

---

### 산술 명령어

- **ADD** : `ADD Rd, Rs, OP2`
  - `Rd := Rs + OP2`
- **ADC** : `ADC Rd, Rs, OP2`
  - `Rd := Rs + OP2 + Carry`
- **SUB** : `SUB Rd, Rs, OP2`
  - `Rd := Rs - OP2`
- **SBC** : `SBC Rd, Rs, OP2`
  - `Rd := Rs - OP2 - !Carry`
- **RSB** : `RSB Rd, Rs, OP2`
  - `Rd := OP2 - Rs`
- **RSC** : `RSC Rd, Rs, OP2`

  - `Rd := OP2 - Rs - !Carry`

- `RSB`, `RSC`에 있는 R은 Reverse라고 생각합시다.

#### 일정 횟수를 반복하는 프로그램

1. `for(i=0; i<10; i++)` 방식

```assembly
  MOV R0, #0
1:
  @ 이곳에 코드 작성

  ADD R0, R0, #1
  CMP R0, #10
  BLT 1b
```

2. `for(i=10; i>0; i--)` 방식

```assembly
  MOV R0, #10
1:
  @ 이곳에 코드 작성

  SUB R0, R0, #1
  CMP R0, #0
  BGT 1b
```

위의 두 방법도 좋지만, Down Count 방식에 S-Suffix를 사용하는게 더 효율적입니다.

```assembly
  MOV R0, #10
1:
  @ 이곳에 코드 작성

  SUBS R0, R0, #1
  BGT 1b
```

---

### 서브루틴 호출

- `BL label` : Branch and Link
  - `BL` : 서브루틴 호출 명령
  - `label` : 서브루틴의 상대주소 값
  - `B`와 달리 복귀한 주소(따음 명령 주소) 값을 `R14`에 저장합니다.  
    ![Subroutine](/assets/image/2019-03-04-Simple-ARM-Operating-System-Chapter-2/2019-03-04-Simple-ARM-Operating-System-Chapter-2_8.png)
  - `BL`은 분기 주소로 레지스터를 사용하지 못합니다.

#### 서브루틴 호출과 복귀

- **서브루틴 호출** (`BL label`):
  1. 복귀할 주소를 `LR`(`R14`)에 저장합니다.
  2. 서브루틴의 주소를 `PC`(`R15`)에 저장합니다.
- **서브루틴 복귀** (`BX LR`):

  - `LR`(`R14`)의 값을 `PC`(`R15`)에 저장하여 복귀합니다.

- 왜 함수라고 하지 않고 서브루틴이라고 부를까?
  - 함수는 다른 값들에 영향을 주지 않지만, 서브루틴은 다른 값들에 영향을 줄수 있습니다.

---

### 특수용도 레지스터

| 레지스터     | 설명                            | 용도                                         |
| ------------ | ------------------------------- | -------------------------------------------- |
| `SP` / `R13` | Stack Pointer                   | C언어 사용시 스택의 주소를 저장              |
| `LR` / `R14` | Link Register                   | 함수 호출 시 되돌아갈 함수의 주소가 저장     |
| `PC` / `R15` | Program Counter                 | 프로그램 수행 시 읽어오는 명령의 주소를 저장 |
| CPSR         | Current Program Status Register | 연산결과, IRQ, FIQ금지, 동작모드 등을 저장   |

- `SP`, `LR`은 일반 레지스터로 사용해도 무방합니다.
