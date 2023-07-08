---
title: 'Apple M1 Mac에서 GDB를 사용하여 디버깅을 해보자'
date: '2023-07-08 02:10:31'
category: macOS
---

M1이 탑재된 macOS(Ventura 13.4.1)에서 GDB을 사용할 수 없어서 어떻게 하면 사용할 수 있을지 고민하다가 Docker를 사용하여 GDB를 사용하는 방법을 공유합니다.

# Visual Studio Code의 Remote SSH를 사용하는 방법

[Install Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install)에 접속하여 Docker를 다운로드하여 설치합니다.

아래와 같이 `Dockerfile`과 `build.sh`를 생성하고 아래와 같이 작성합니다.  

**`Dockerfile` :**  
`root`와 사용자(`code`)의 비밀번호는 `code`로 설정했습니다.  
```dockerfile
FROM debian:12.0-slim

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=Asia/Seoul

USER root
RUN apt-get update \
    && apt-get upgrade -y -q \
    && apt-get install -y -q --no-install-recommends ca-certificates cmake curl g++ gcc gdb git gnupg2 make openssh-server sudo zsh \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/*
RUN echo 'root:code' | chpasswd
RUN mkdir -pv /home/code
RUN useradd code -d /home/code -s /usr/bin/zsh && echo 'code:code' | chpasswd
RUN chown code:code /home/code
RUN echo "code	ALL=(ALL:ALL)	ALL" >> /etc/sudoers
RUN /usr/bin/ssh-keygen -A
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config
RUN echo "#!/bin/sh" > /usr/sbin/run_sshd.sh
RUN echo "service ssh restart && /bin/sh" >> /usr/sbin/run_sshd.sh
USER code
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
USER root

EXPOSE 22

CMD ["/bin/sh", "/usr/sbin/run_sshd.sh"]
```

**`build.sh` :**  
```sh
#!/bin/sh
/Applications/Docker.app/Contents/Resources/bin/docker build -t vscode-ssh-server:1.0.0 .
/Applications/Docker.app/Contents/Resources/bin/docker run --name vscode-ssh-server --cap-add=SYS_PTRACE --security-opt="seccomp=unconfined" --tmpfs /tmp -d -dit -p 22:22 -i -t --restart always vscode-ssh-server:1.0.0
```

모두 작성하고 `build.sh`를 실행하면 됩니다.  
Docker Container가 생성되면 Visual Studio Code의 Remote SSH를 사용하여 `code@localhost -p 22`에 접근하여 사용하면 됩니다.  
![GDB Debugging](/assets/image/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac_5.png)


# [code-server](https://github.com/coder/code-server)를 사용하는 방법

[Install Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install)에 접속하여 Docker를 다운로드하여 설치합니다.

아래와 같이 `Dockerfile`과 `build.sh`를 생성하고 아래와 같이 작성합니다.  
![Dockerfile](/assets/image/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac_1.png)  
**`Dockerfile` :**  
`root`와 사용자(`code`)의 비밀번호는 `code`로 설정했습니다.  
```dockerfile
FROM fedora:38

ENV TZ=Asia/Seoul

USER root
RUN dnf upgrade -y --refresh
RUN dnf install -y bash cmake curl dnf-utils g++ gcc gdb git glibc-static gnupg2 libstdc++-static passwd wget
RUN curl -fsSL https://code-server.dev/install.sh | sh
RUN dnf clean all
RUN rm -rf /var/cache/yum
RUN echo code | passwd root --stdin
RUN useradd code -G wheel && echo code | passwd code --stdin
RUN echo "code	ALL=(ALL:ALL)	ALL" >> /etc/sudoers
USER code
RUN mkdir -p /home/code/.config/code-server
RUN echo "bind-addr: 0.0.0.0:8080" > /home/code/.config/code-server/config.yaml
RUN echo "auth: password" >> /home/code/.config/code-server/config.yaml
RUN echo "password: code" >> /home/code/.config/code-server/config.yaml
RUN echo "cert: false" >> /home/code/.config/code-server/config.yaml
RUN echo "#!/bin/sh" > /home/code/.config/code-server/run.sh
RUN echo "/usr/bin/code-server &" >> /home/code/.config/code-server/run.sh
RUN echo "while true ; do" >> /home/code/.config/code-server/run.sh
RUN echo "  sleep 3600;" >> /home/code/.config/code-server/run.sh
RUN echo "done" >> /home/code/.config/code-server/run.sh

EXPOSE 8080
CMD ["/bin/sh", "/home/code/.config/code-server/run.sh"]
```

**`build.sh` :**  
```sh
#!/bin/sh
/Applications/Docker.app/Contents/Resources/bin/docker build -t code-server:1.0.0 .
/Applications/Docker.app/Contents/Resources/bin/docker run --name code-server --cap-add=SYS_PTRACE --security-opt="seccomp=unconfined" --tmpfs /tmp -d -dit -p 8080:8080 -i -t --restart always code-server:1.0.0
```

모두 작성하고 `build.sh`를 실행하면 됩니다.

그리고 아래의 링크를 클릭하여 C/C++ Visual Studio Code Extension의 VSIX 파일을 다운로드 합니다.
- [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
- [C/C++ Themes](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools-themes)
- [CMake](https://marketplace.visualstudio.com/items?itemName=twxs.cmake)
- [CMake Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools)

'Download Extension'을 클릭했을 때 아래와 같이 출력된다면, Linux ARM64로 다운로드하면 됩니다.
![C/C++ Visual Studio Code Extension Download](/assets/image/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac_2.png)

[http://localhost:8080](http://localhost:8080)에 접속하여 VSIX 파일을 설치합니다. **(code-server의 암호는 `code` 입니다)**
![C/C++ Visual Studio Code Extension Install](/assets/image/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac_3.png)

프로젝트를 열고 Breakpoint를 설정한 뒤, Debug 버튼을 클릭해 보면 아래와 같이 GDB가 정상적으로 작동되는 것을 확인할 수 있습니다.
![GDB Debugging](/assets/image/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac/2023-07-08-Debugging-using-GDB-on-Apple-M1-Mac_4.png)