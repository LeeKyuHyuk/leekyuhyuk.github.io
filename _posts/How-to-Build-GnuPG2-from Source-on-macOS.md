---
title: 'Homebrew🍺를 사용하지 않고 macOS에 GnuPG2 설치하기'
date: '2022-11-06 22:16:14'
category: Ordinary-Life
---

작업용으로 사용하는 Mac에 Homebrew를 사용하지 않고 macOS에 GnuPG2를 설치해서 사용 중입니다. 혹시 Homebrew 없이 사용을 원하는 사람들이 있을 거 같아 간단한 스크립트와 함께 글을 작성했습니다.

1. 아래의 Shell Script를 `gnupg2.sh`로 저장합니다.

```sh
#!/bin/sh
set -o nounset
set -o errexit

curl https://gnupg.org/ftp/gcrypt/gnupg/gnupg-2.2.40.tar.bz2 | tar xvj
curl https://gnupg.org/ftp/gcrypt/npth/npth-1.6.tar.bz2 | tar xvj
curl https://gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-1.46.tar.bz2 | tar xvj
curl https://gnupg.org/ftp/gcrypt/libgcrypt/libgcrypt-1.10.1.tar.bz2 | tar xvj
curl https://gnupg.org/ftp/gcrypt/libksba/libksba-1.6.2.tar.bz2 | tar xvj
curl https://gnupg.org/ftp/gcrypt/libassuan/libassuan-2.5.5.tar.bz2 | tar xvj
curl https://gnupg.org/ftp/gcrypt/pinentry/pinentry-1.2.1.tar.bz2 | tar xvj

echo "# npth 1.6"
( cd npth-1.6 && ./configure )
make -C npth-1.6
make check -C npth-1.6
make install -C npth-1.6

echo "# libgpg-error-1.46"
( cd libgpg-error-1.46 && ./configure \
--enable-install-gpg-error-config \
--disable-pinentry-qt \
--disable-pinentry-emacs \
--disable-inside-emacs \
--disable-pinentry-gtk2 \
--disable-pinentry-curses \
--enable-pinentry-tty )
make -C libgpg-error-1.46
make check -C libgpg-error-1.46
make install -C libgpg-error-1.46

echo "# libgcrypt 1.10.1"
( cd libgcrypt-1.10.1 && ./configure \
--disable-pinentry-qt \
--disable-pinentry-emacs \
--disable-inside-emacs \
--disable-pinentry-gtk2 \
--disable-pinentry-curses \
--enable-pinentry-tty \
--with-libgpg-error-prefix=/usr/local )
make -C libgcrypt-1.10.1
make check -C libgcrypt-1.10.1
make install -C libgcrypt-1.10.1

echo "# libksba 1.6.2"
( cd libksba-1.6.2 && ./configure \
--disable-pinentry-qt \
--disable-pinentry-emacs \
--disable-inside-emacs \
--disable-pinentry-gtk2 \
--disable-pinentry-curses \
--enable-pinentry-tty )
make -C libksba-1.6.2
make check -C libksba-1.6.2
make install -C libksba-1.6.2

echo "# libassuan 2.5.5"
( cd libassuan-2.5.5 && ./configure \
--disable-pinentry-qt \
--disable-pinentry-emacs \
--disable-inside-emacs \
--disable-pinentry-gtk2 \
--disable-pinentry-curses \
--enable-pinentry-tty )
make -C libassuan-2.5.5
make check -C libassuan-2.5.5
make install -C libassuan-2.5.5

echo "# pinentry 1.2.1"
( cd pinentry-1.2.1 && ./configure )
make -C pinentry-1.2.1
make check -C pinentry-1.2.1
make install -C pinentry-1.2.1

echo "# gnupg 2.2.40"
( cd gnupg-2.2.40 && ./configure \
--enable-gpg-is-gpg2 \
--with-pinentry-pgm )
make -C gnupg-2.2.40
make check -C gnupg-2.2.40
make install -C gnupg-2.2.40
make install -C gnupg-2.2.40/dirmngr
```

2. 아래의 명령어로 빌드 및 설치를 합니다.

```sh
chmod +x ./gnupg2.sh
sudo ./gnupg2.sh
```

3. 모든 작업이 끝나면, `export GPG_TTY=$(tty)`를 `~/.zshrc` 파일의 맨 아랫줄에 추가합니다.

4. `echo "test" | gpg --clearsign`를 터미널에 입력해서 정상적으로 작동하는지 확인합니다.
