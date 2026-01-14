# JavaScript 패키지 배포 규칙 (npm)

이 문서는 `javascript/` 패키지(`@mediasphere/portone-server-sdk`)를 npm에 배포할 때의 **버전/태그/배포 절차**를 정의합니다.

## 1) 버전 규칙

- **업스트림(원본) 기반 버전 유지**: `@portone/server-sdk`의 기준 버전을 앞에 둡니다.
- **포크 식별자 프리릴리즈**: `-mediasphere.N` 형태를 사용합니다.
  - 예: `0.18.0-mediasphere.0`, `0.18.0-mediasphere.1`, ...
- **재배포 금지**: npm은 **동일 버전 재배포가 불가**합니다. README/코드가 바뀌면 반드시 버전을 올립니다.

## 2) dist-tag 운영 규칙

목표: **기본 설치(`npm install @mediasphere/portone-server-sdk`) 시 항상 최신 포크를 받게 한다.**

- 배포 시 `--tag mediasphere`로 올립니다.
- 배포 직후 `latest` 태그도 **같은 버전으로 이동**시킵니다.

예시(최신 버전이 `0.18.0-mediasphere.1`인 경우):

```bash
npm publish --access public --tag mediasphere
npm dist-tag add @mediasphere/portone-server-sdk@0.18.0-mediasphere.1 latest
```

## 3) 배포 절차 (체크리스트)

아래는 `/home/siluniv/projects/vendor/portone-server-sdk/javascript` 기준입니다.

```bash
cd /home/siluniv/projects/vendor/portone-server-sdk/javascript

# 0) 로그인 확인
npm whoami

# 1) 빌드
pnpm install --frozen-lockfile
pnpm build

# 2) 배포 전 점검(권장)
npm publish --dry-run --access public --tag mediasphere

# 3) 실제 배포
npm publish --access public --tag mediasphere

# 4) latest 태그를 최신으로 이동(운영 규칙)
node -p 'require("./package.json").version'
# 출력된 버전을 사용:
npm dist-tag add @mediasphere/portone-server-sdk@<VERSION> latest

# 5) 확인
npm view @mediasphere/portone-server-sdk dist-tags --json
npm view @mediasphere/portone-server-sdk versions --json
```

## 4) 이 포크의 핵심 차이(멱등 키)

이 포크는 일부 변경 API에 **`Idempotency-Key` 헤더를 보낼 수 있도록** `idempotencyKey?: string`(두 번째 인자)를 노출합니다.

- 포트원 공식 문서(멱등 키): `https://developers.portone.io/api/rest-v2?v=v2`

