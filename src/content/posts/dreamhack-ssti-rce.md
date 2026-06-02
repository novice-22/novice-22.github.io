---
title: "DreamHack web 문제 풀이 — SSTI에서 RCE까지"
pubDate: 2026-05-14
category: "CTF · 워게임"
tags: ["web", "ssti", "writeup"]
summary: "템플릿 인젝션 포인트를 찾아 필터를 우회하고, 끝내 원격 코드 실행으로 끌고 간 풀이 정리."
---

사용자 입력이 템플릿 엔진에 그대로 들어가는 지점을 찾아 SSTI를 RCE로 확장한 문제였다.

## 인젝션 확인

`{{7*7}}` 입력이 `49`로 렌더되는 걸 보고 Jinja2 SSTI를 확신했다.

```python
{{ 7 * 7 }}
# → 49
```

## 필터 우회

`__class__`, `import` 같은 키워드가 막혀 있어 속성 접근을 우회 표기로 구성했다.

```python
{{ ''.__class__.__mro__[1].__subclasses__() }}
```

## RCE

최종적으로 `subprocess`를 들고 있는 클래스를 찾아 명령을 실행했고 플래그를 읽었다.

필터링은 블랙리스트로는 한계가 명확하다는 걸 다시 확인한 문제.
