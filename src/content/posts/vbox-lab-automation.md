---
title: "VirtualBox 취약점 진단 랩 + 자동 점검 스크립트"
pubDate: 2026-05-02
category: "프로젝트"
tags: ["devsecops", "lab", "automation"]
summary: "CentOS · Windows Server · pfSense로 구성한 자작 진단 환경과, 직접 작성한 점검 자동화 스크립트 공개."
---

실제 타깃 없이도 진단 역량을 보여주려고, 가상 환경을 직접 구성하고 점검을 자동화했다.

## 구성

- CentOS (웹 / DB 서버)
- Windows Server (AD)
- pfSense (방화벽 / 게이트웨이)

## 자동 점검 스크립트

기본 보안 설정을 점검하는 셸 스크립트의 일부:

```bash
#!/usr/bin/env bash
# SSH root 직접 로그인 허용 여부 점검
if grep -qE "^PermitRootLogin\s+yes" /etc/ssh/sshd_config; then
  echo "[FAIL] PermitRootLogin yes"
else
  echo "[PASS] root 직접 로그인 비활성화"
fi
```

## 정리

타깃이 없을 때는 결국 환경 구성의 완성도와 자동화 품질이 차별점이 된다. 전체 스크립트는 GitHub에 정리해 두었다.
