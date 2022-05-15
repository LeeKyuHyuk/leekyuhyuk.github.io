---
title: 'GUID Partition Table'
date: '2019-05-06 20:02:16'
category: File-System
---

GPT(**G**UID **P**artition **T**able)은 저장 장치에 대한 파티션 레이아웃 중 하나입니다.

GUID Partition Table의 구조는 아래와 같습니다.  
![GPT Scheme](/assets/image/2019-05-06-GUID-Partition-Table/GPT-Scheme.png)

실제로 우리가 사용하는 컴퓨터의 GUID Partition Table도 확인해봅시다.  
`sudo dd if=/dev/sda of=disk.img bs=2MB count=1` 명령어로 Protective MBR(LBA 0)부터 GUID Partition
Entries 5~8(LBA 4)까지 disk.img에 저장을 할 수 있습니다.

![Protective MBR](/assets/image/2019-05-06-GUID-Partition-Table/Protective-MBR.png)

![Primary GPT Header](/assets/image/2019-05-06-GUID-Partition-Table/Primary-GPT-Header-1.png)

![Primary GPT Header](/assets/image/2019-05-06-GUID-Partition-Table/Primary-GPT-Header-2.png)

![GUID Partition Entries](/assets/image/2019-05-06-GUID-Partition-Table/GUID-Partition-Entries.png)

**[+] Partition 1**  
&emsp;[-] Partition type GUID: C12A7328-F81F-11D2-BA4B-00A0C93EC93B  
&emsp;&emsp;=> Partition type: EFI System partition, None  
&emsp;[-] Unique partition GUID: 27BB3437-B2DF-4760-8AA8-B5F64A8455D2  
&emsp;[-] First LBA: 2048  
&emsp;&emsp;=> Disk Offset: 0x00100000  
&emsp;[-] Last LBA: 1050623  
&emsp;&emsp;=> Disk Offset: 0x200FFE00  
&emsp;[-] Attribute flags: 0, System Partition  
&emsp;[-] Partition Name: EFI System Partition  
<br> **[+] Partition 2**  
&emsp;[-] Partition type GUID: 0FC63DAF-8483-4772-8E79-3D69D8477DE4  
&emsp;&emsp;=> Partition type: Linux filesystem data, Linux  
&emsp;[-] Unique partition GUID: BD77D7CA-489E-4188-B73A-3C3B7B66D2FE  
&emsp;[-] First LBA: 1050624  
&emsp;&emsp;=> Disk Offset: 0x20100000  
&emsp;[-] Last LBA: 209713151  
&emsp;&emsp;=> Disk Offset: 0x18FFEFFE00  
&emsp;[-] Attribute flags: 0, System Partition  
&emsp;[-] Partition Name:
