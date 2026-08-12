<?php
class JWT {
    private static $secret = "gestion_rh_BT_secret_2025";

    public static function encode(array $payload): string {
        $header  = rtrim(base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])), '=');
        $payload = rtrim(base64_encode(json_encode($payload)), '=');
        $sig     = rtrim(base64_encode(hash_hmac('sha256', "$header.$payload", self::$secret, true)), '=');
        return "$header.$payload.$sig";
    }

    public static function decode(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$header, $payload, $sig] = $parts;
        $validSig = rtrim(base64_encode(hash_hmac('sha256', "$header.$payload", self::$secret, true)), '=');
        if (!hash_equals($validSig, $sig)) return null;
        $data = json_decode(base64_decode($payload), true);
        if (!$data || $data['exp'] < time()) return null;
        return $data;
    }

    public static function fromRequest(): ?array {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $auth);
        if (!$token) return null;
        return self::decode($token);
    }
}
?>
