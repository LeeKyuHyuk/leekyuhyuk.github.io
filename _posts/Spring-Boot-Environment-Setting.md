---
title: '[Spring Boot] 개발 환경 설정'
date: '2020-07-19 16:08:54'
category: Spring-Boot
---

Spring Boot을 공부하기 앞서 개발 환경을 설정할 것입니다.  
이 글은 'Windows 10 x64' 환경에서 개발 환경을 설정합니다.

- OpenJDK 14.0.2
- IntelliJ IDEA Community 2020.1.3

# JDK Installation

[OpenJDK](https://openjdk.java.net)에 접속하여 'OpenJDK'를 다운로드합니다.  
![OpenJDK 14.0.2 Download](/assets/image/2020-07-19-Spring-Boot-Environment-Setting/2020-07-19-Spring-Boot-Environment-Setting_1.png)

`C:\Program Files`에 `OpenJDK` 폴더를 만들고, 다운로드한 `openjdk-14.0.2_windows-x64_bin.zip`의 압축
풀면 나오는 `jdk-14.0.2` 폴더를 `C:\Program Files\OpenJDK`에 넣어줍니다.  
'제어판' → '시스템 및 보안' → '시스템' → '고급 시스템 설정' → '환경 변수 (N)'에 들어가서 '시스템 변
수(S)'에 있는 `PATH`를 편집하여, `C:\Program Files\OpenJDK\jdk-14.0.2\bin`를 추가합니다.

'명령 프롬프트'에서 `java -version`와 `javac -version`으로 버전을 확인하여 설치가 잘 되었는지 확인합
니다.  
![OpenJDK 14.0.2 Download](/assets/image/2020-07-19-Spring-Boot-Environment-Setting/2020-07-19-Spring-Boot-Environment-Setting_2.png)

# IntelliJ IDEA Installation

[Download IntelliJ IDEA](https://www.jetbrains.com/idea/download)에 접속하여 IntelliJ IDEA Community
를 다운로드하고 설치합니다.  
![Download IntelliJ IDEA](/assets/image/2020-07-19-Spring-Boot-Environment-Setting/2020-07-19-Spring-Boot-Environment-Setting_3.png)

# 회사에서 Spring Boot 개발 환경 설정할때

필자의 회사에서는 트래픽 감시를 위해 회사에서 배포한 인증서를 사용합니다.  
이로 인해 IntelliJ IDEA나 Gradle이 정상 동작하지 못하는 일이 발생하기도 합니다.  
이 문제를 해결하려면, OpenJDK와 IntelliJ IDEA에 회사에서 배포한 인증서를 추가해 주시면 됩니다.

[portecle-1.11.zip](/assets/file/2020-07-19-Spring-Boot-Environment-Setting/portecle-1.11.zip) 을 다
운로드하고, '관리자 권한'으로 '명령 프롬프트'를 실행한 뒤 `java -jar portecle.jar`를 입력하여
'Portecle'를 실행합니다.  
![Run Portecle](/assets/image/2020-07-19-Spring-Boot-Environment-Setting/2020-07-19-Spring-Boot-Environment-Setting_4.png)

'File' → 'Open Keystore File'을 클릭하여 `C:\Program Files\OpenJDK\jdk-14.0.2\lib\security`에 있는
`cacerts`를 선택합니다.  
![Open Keystore File](/assets/image/2020-07-19-Spring-Boot-Environment-Setting/2020-07-19-Spring-Boot-Environment-Setting_5.png)

Password는 `changeit`을 입력하고, OK 버튼을 누릅니다.  
그리고, 'Import Trusted Certificate'를 눌러 회사에서 배포한 인증서를 `cacerts`에 추가합니다.  
![Import Trusted Certificate](/assets/image/2020-07-19-Spring-Boot-Environment-Setting/2020-07-19-Spring-Boot-Environment-Setting_6.png)

'File' → 'Save Keystore'를 눌러 변경된 내용을 저장합니다.  
![Save Keystore](/assets/image/2020-07-19-Spring-Boot-Environment-Setting/2020-07-19-Spring-Boot-Environment-Setting_7.png)

위에서는 OpenJDK에 적용했고, IntelliJ IDEA에도 회사에서 배포한 인증서를 적용해야 합니다.  
위와 같은 방법으로
`C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2020.1.3\jbr\lib\security`에 있는
`cacerts`에 인증서를 추가하면 됩니다.
