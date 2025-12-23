/**
 * 멱등 키(Idempotency-Key) 헤더를 생성합니다.
 *
 * RFC 8941에 따라 문자열은 쌍따옴표로 감싸야 하며, 미리 감싸지 않은 경우 자동으로 감쌉니다.
 */
export function idempotencyKeyHeader(idempotencyKey?: string): Record<string, string> {
	if (idempotencyKey == null) return {}
	const value =
		idempotencyKey.startsWith("\"") && idempotencyKey.endsWith("\"")
			? idempotencyKey
			: `"${idempotencyKey}"`
	return { "Idempotency-Key": value }
}

