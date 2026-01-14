# PortOne Server SDK for JavaScript

JavaScript 서버 환경에서 포트원 V2 결제 시스템에 연동하기 위한 SDK입니다.

## 안내 (포크)

이 패키지(`@mediasphere/portone-server-sdk`)는 포트원에서 배포하는 공식 SDK
`@portone/server-sdk`를 기반으로 한 **포크(fork) 버전**입니다.

- 대부분의 경우 **공식 패키지(`@portone/server-sdk`) 사용을 권장**합니다.
- 이 포크는 벤더링/운영 편의 목적의 변경을 포함할 수 있으며, 공식 SDK와 릴리즈/지원 정책이 다를 수 있습니다.

### 이 포크에서 추가된 핵심 기능: 멱등 키(Idempotency-Key) 지원

포트원 V2 REST API는 `Idempotency-Key` 헤더를 지원하지만, 공식 JavaScript SDK에서는 (시점에 따라)
요청 헤더에 멱등 키를 넣을 수 있도록 노출이 되어 있지 않을 수 있습니다.

이 포크는 **변경 요청(POST/PUT/PATCH/DELETE 등)** 을 수행하는 일부 메서드에
`idempotencyKey?: string`를 추가로 받아 `Idempotency-Key` 헤더를 전송할 수 있게 했습니다.

멱등 키에 대한 공식 설명/제약 사항은 포트원 문서를 참고하세요: [PortOne REST API - V2](https://developers.portone.io/api/rest-v2?v=v2)

### 문서/링크

- **공식(원본)**
  - npm: https://www.npmjs.com/package/@portone/server-sdk
  - 문서(API 색인): https://portone-io.github.io/server-sdk/js/
  - GitHub: https://github.com/portone-io/server-sdk
- **포크(이 패키지)**
  - npm: https://www.npmjs.com/package/@mediasphere/portone-server-sdk
  - GitHub(소스/README): https://github.com/siluniv/portone-server-sdk/tree/main/javascript#readme
  - 변경 이력: https://github.com/siluniv/portone-server-sdk/blob/main/javascript/CHANGELOG.md

### 지원/문의

- 이 포크에 대한 버그/요청: https://github.com/siluniv/portone-server-sdk/issues
- 공식 SDK/제품 관련 지원: tech.support@portone.io

### 라이선스/출처

이 프로젝트는 원본 프로젝트의 라이선스 정책(듀얼 라이선스: Apache-2.0 OR MIT)을 따릅니다.
자세한 내용은 `LICENSE-APACHE`, `LICENSE-MIT` 및 관련 고지 파일을 참고하세요.

## 의존성

Web Crypto API와 Fetch API를 사용합니다.

- Node.js의 경우 v20 이상이 필요합니다.
- 기타 위 표준 API를 지원하는 모든 자바스크립트 런타임에서 사용할 수 있습니다.

## 설치

![NPM Version](https://img.shields.io/npm/v/%40mediasphere%2Fportone-server-sdk)
![NPM Version (Original)](https://img.shields.io/npm/v/%40portone%2Fserver-sdk)
![JSR Version (Original)](https://img.shields.io/jsr/v/%40portone/server-sdk)

npm 혹은 jsr을 통해 설치합니다.

```shell
# 포크(이 패키지)
npm install --save @mediasphere/portone-server-sdk

# 공식(원본)
# npm install --save @portone/server-sdk
```

### 배포 (npmjs)

```shell
# 최초 1회: npmjs 로그인
npm login

# 배포 전 빌드(배포 시에도 prepublishOnly로 자동 실행됨)
pnpm install --frozen-lockfile
pnpm build

# 패키지 버전 변경(원하는 방식 사용)
npm version patch

# 배포
npm publish --access public --tag mediasphere
```

배포 규칙(버전/태그/절차)은 `RELEASING.md`를 참고하세요.

## 사용법

### 포트원 REST API

먼저
[포트원 개발자콘솔](https://admin.portone.io/integration-v2/manage/api-keys?version=v2)에서
API Secret을 발급받습니다.

발급받은 API Secret을 사용해 필요한 API에 맞는 Client를 생성합니다.

```js
import { PaymentClient, PortOneClient } from "@mediasphere/portone-server-sdk";

// 결제 관련 API를 사용하는 경우
const paymentClient = PaymentClient({ secret: PORTONE_API_SECRET });
paymentClient.getPayment(/* ... */);

// 전체 API를 사용하는 경우
const portoneClient = PortOneClient({ secret: PORTONE_API_SECRET });
// 상위 Client를 생성한 경우 하위 Client에 접근 가능합니다.
portoneClient.payment.getPayment(/* ... */);
```

Client의 각 함수는 함수마다 고유한 타입의 Error을 발생시킬 수 있습니다. Error의
data 필드는 서버로부터 받은 오류 응답값을 나타내며, data.type 필드를 통해 오류의
상세 원인을 파악하실 수 있습니다.

```js
import { GetPaymentError } from "@mediasphere/portone-server-sdk/payment";

try {
    const payment = await paymentClient.getPayment({ paymentId: "test" });
} catch (e) {
    if (e instanceof GetPaymentError) {
        switch (e.data.type) {
            case "FORBIDDEN":
                // 요청이 거절된 경우
            case "INVALID_REQUEST":
                // 입력 정보가 유효하지 않은 경우
        }
    }
}
```

포트원 REST API로부터 현재 SDK 버전에서 지원하지 않는 응답을 받을 수 있습니다.
이 경우 `isUnrecognized` 편의 함수를 통해 해당 응답을 검출할 수 있습니다.

```js
import { isUnrecognizedPayment } from "@mediasphere/portone-server-sdk/payment";

const payment = await paymentClient.getPayment({ paymentId: "test" });
console.log(payment.amount.total); // Error: Property 'amount' does not exist on type 'Payment'.
if (!isUnrecognizedPayment(payment)) {
    console.log(payment.amount.total); // Ok
}
```

### 멱등 키(Idempotency-Key) 사용(이 포크 전용)

이 포크에서는 “요청 옵션 객체” 다음 인자로 `idempotencyKey`를 넘기면 멱등 키가 헤더로 전송됩니다.
SDK는 RFC 8941 요구사항에 맞게 **쌍따옴표로 감싸지 않은 값도 자동으로 감쌉니다.**

```js
import { PortOneClient } from "@mediasphere/portone-server-sdk";

const portoneClient = PortOneClient({ secret: PORTONE_API_SECRET });

// 예제 1) 결제 취소(POST 계열) + 멱등 키
await portoneClient.payment.cancelPayment(
  { paymentId: "test", reason: "duplicate-request" },
  "unique-request-id-123",
);

// 예제 2) 빌링키 발급(POST) + 멱등 키
// - method 값은 PG/결제수단에 맞게 구성해야 합니다.
await portoneClient.payment.billingKey.issueBillingKey(
  {
    method: {/* ... */},
    channelKey: "channel-key",
    customer: {/* ... */},
  },
  "unique-request-id-124",
);

// 예제 3) 결제 예약 생성(POST) + 멱등 키
await portoneClient.payment.paymentSchedule.createPaymentSchedule(
  {
    paymentId: "payment-id",
    payment: {/* ... */},
    timeToPay: "2026-01-14T12:34:56.000Z",
  },
  "unique-request-id-125",
);
```

멱등 키 사용 가이드(길이/허용 문자/재시도 정책/지원 메서드 등)는 포트원 문서를 참고하세요:
[PortOne REST API - V2 (멱등 키)](https://developers.portone.io/api/rest-v2?v=v2)

참고로 문서 기준 `Idempotency-Key`는 POST/PUT/PATCH/DELETE에서만 유효하며, GET에서는 무시됩니다.
([PortOne REST API - V2](https://developers.portone.io/api/rest-v2?v=v2))

### 웹훅 검증

먼저
[포트원 개발자콘솔](https://admin.portone.io/integration-v2/manage/webhook?version=V2)에서
웹훅 시크릿을 발급받습니다.

Webhook.verify 함수로 웹훅 내용을 검증할 수 있습니다.

**주의: 웹훅 내용은 서버에서 전달한 body를 JSON 형태로 파싱하지 않고, 문자열
형태로 그대로 입력합니다.**

```js
import { Webhook } from "@mediasphere/portone-server-sdk";

const payload =
    `{"type":"BillingKey.Issued","timestamp":"2024-04-25T10:00:00.000Z","data":{"storeId":"store-61e0db3d-b967-47db-8b50-96002da90d55","billingKey":"billing-key-75ae3cab-6afe-422d-bf34-3a7b1762451d"}}`;
const headers = {
    "webhook-id": "test-id",
    "webhook-signature": `v1,aW52YWxpZCBzaWduYXR1cmU=`,
    "webhook-timestamp": "100",
};
await Webhook.verify(PORTONE_WEBHOOK_SECRET, payload, headers);
```

Webhook.verify 함수는 body를 object 형태로 변환하여 반환합니다. 웹훅 또한 현재
SDK 버전에서 지원하지 않은 응답을 받을 수 있으며, 이 경우
`isUnrecognizedWebhook` 편의 함수를 통해 해당 응답을 검출할 수 있습니다.

```js
const webhook = await Webhook.verify(/* ... */);

console.log(webhook.data); // Error: Property 'data' does not exist on type 'Webhook'.
if (!Webhook.isUnrecognizedWebhook(webhook)) {
    console.log(payment.data); // Ok
}
```

웹훅의 `type` 값에 따라 `data`의 형식이 변하기 때문에, 각 필드에 접근하기
위해서는 `type`을 확인해야 합니다.

```js
if (
    webhook.type === "Transaction.Paid" ||
    webhook.type === "Transaction.VirtualAccountIssued"
) {
    console.log(webhook.data.paymentId);
}
if (webhook.type === "Transaction.Cancelled") {
    console.log(webhook.data.cancellationId);
}
```

## 버전

[유의적 버전 2.0.0](https://semver.org/spec/v2.0.0.html)을 사용합니다.

현재 주(主) 버전은 0입니다. 이는 라이브러리 공개 API가 아직 고정되지 않았음을
의미합니다. 주 버전이 1이 되기 전에도 릴리스 버전(프리릴리스가 아닌 버전)의
SDK를 프로덕션에서 사용할 수 있으며, 포트원은 관련 기술 지원을 제공합니다.

## API 안정성

포트원 V2는 REST API의 하위 호환을 보장합니다. 본 SDK는 REST API에 의존하므로,
한 버전의 SDK로 연동한 뒤에는 해당 버전에 특별한 버그가 없는 한 연동이 깨지지
않습니다.

SDK의 버전을 업데이트한 경우 코드 호환성이 깨질 수 있습니다. 이 경우 코드 작업이
필요합니다.

## 기술 지원

- tech.support@portone.io

---

Packages under _portone-io/server-sdk-js_ are primarily distributed under the
terms of both the [Apache License (Version 2.0)] and the [MIT license]. See
[COPYRIGHT] for details.

[MIT license]: LICENSE-MIT
[Apache License (Version 2.0)]: LICENSE-APACHE
[COPYRIGHT]: COPYRIGHT
