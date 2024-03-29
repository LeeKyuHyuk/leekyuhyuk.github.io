---
title: '쉽고 간편하게 HEIC를 JPG로 손쉽게 변환하는 iHEIC v1.0.0'
date: '2021-09-05 00:32:14'
category: Ordinary-Life
---

![iHEIC v1.0.0](/assets/image/2021-09-06-iHEIC-v1.0.0/2021-09-06-iHEIC-v1.0.0_1.png)

iPhone에서 찍은 사진이 iOS 11부터 HEIC(HEIF) 포맷으로 저장되게 기본 설정이 되어있어, 사진을 PC로 옮겼을 때 바로 볼 수 없거나 JPG 파일로 변환할 일이 있을 거 같아 HEIC를 JPG로 변환해 주는 iHEIC를 만들어 배포하게 되었습니다.

## iHEIC Download

[https://github.com/LeeKyuHyuk/iHEIC/releases/tag/v1.0.0](https://github.com/LeeKyuHyuk/iHEIC/releases/tag/v1.0.0/)에접속하여 사용하고 있는 OS에 맞게 다운로드하여 설치하면 됩니다.  
Windows를 사용하시는 분은 `iHEIC-Setup-x86_64-1.0.0.exe`를 받아주시면 됩니다.  
Linux 사용자는 `iHEIC-x86_64-1.0.0.AppImage`, macOS 사용자는 `iHEIC-x86_64-1.0.0.dmg`를 다운로드하여설치합니다.

![iHEIC v1.0.0](/assets/image/2021-09-06-iHEIC-v1.0.0/2021-09-06-iHEIC-v1.0.0_2.png)

## How to use iHEIC

사용방법은 간단합니다.  
iHEIC를 실행하여 변환할 HEIC 파일을 상단의 회색 박스에 넣고 'Start' 버튼을 누르면 됩니다.  
변환된 JPG 파일은 추가한 HEIC와 같은 위치에 생성됩니다.

![How to use iHEIC](/assets/image/2021-09-06-iHEIC-Development-Story/2021-09-06-iHEIC-Development-Story_1.gif)

## Libraries used in iHEIC

- [libde265 1.0.8](https://github.com/strukturag/libde265/releases/tag/v1.0.8)
- [libjpeg 9d](https://ijg.org/)
- [libheif 1.12.0](https://github.com/strukturag/libheif/releases/tag/v1.12.0)
- [Electron 13.2.3](https://www.npmjs.com/package/electron)
- [React 17.0.2](https://www.npmjs.com/package/react)
- [TypeScript 4.4.2](https://www.npmjs.com/package/typescript)
- [Ant Design 4.16.13](https://www.npmjs.com/package/antd)
